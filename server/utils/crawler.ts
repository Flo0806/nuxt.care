// Crawl module README and repo structure for AI context
// Each module gets one KV entry: context:{moduleName} (overwritten on each crawl)

import { cleanRepoPath, ghFetch } from './fetchers'

const README_MAX_LENGTH = 50000 // Cap README at 50KB

export async function crawlModuleContext(mod: ModuleData, token?: string): Promise<ModuleContext | null> {
  const repoPath = cleanRepoPath(mod.repo)
  if (!repoPath) return null

  const [readme, tree, npmMeta] = await Promise.all([
    fetchReadme(repoPath, token),
    fetchRepoTree(repoPath, token),
    fetchNpmHomepage(mod.npmPackage),
  ])

  const composables = extractFromTree(tree, 'composables')
  const components = extractFromTree(tree, 'components')
  const configKey = extractConfigKey(readme)
  const quickStart = extractQuickStart(readme)
  const docsUrl = npmMeta?.homepage || extractDocsUrl(readme) || null

  return {
    moduleName: mod.name,
    npmPackage: mod.npmPackage,
    readme: readme ? readme.slice(0, README_MAX_LENGTH) : null,
    docsUrl,
    composables,
    components,
    configKey,
    installCommand: `npx nuxt module add ${mod.name}`,
    quickStart,
    crawledAt: new Date().toISOString(),
  }
}

export async function crawlAndSaveContext(mod: ModuleData, token?: string): Promise<boolean> {
  const context = await crawlModuleContext(mod, token)
  if (!context) return false
  await kv.set(`context:${mod.name}`, context)
  return true
}

export async function getModuleContext(moduleName: string): Promise<ModuleContext | null> {
  return await kv.get<ModuleContext>(`context:${moduleName}`)
}

// Fetch raw README markdown from GitHub
async function fetchReadme(repoPath: string, token?: string): Promise<string | null> {
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.raw+json',
      'User-Agent': 'nuxt-care',
    }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`https://api.github.com/repos/${repoPath}/readme`, { headers })
    if (!res.ok) return null
    return await res.text()
  }
  catch {
    return null
  }
}

// Fetch repo file tree to find composables/components
async function fetchRepoTree(repoPath: string, token?: string): Promise<string[]> {
  const data = await ghFetch<GitHubTreeResponse>(
    `https://api.github.com/repos/${repoPath}/git/trees/HEAD?recursive=1`,
    token,
  )
  if (!data?.tree) return []
  return data.tree.filter(f => f.type === 'blob').map(f => f.path)
}

// Extract composable/component names from file paths
function extractFromTree(paths: string[], type: 'composables' | 'components'): string[] {
  const pattern = type === 'composables'
    ? /(?:runtime|src)\/composables\/(\w+)\.(ts|js)$/
    : /(?:runtime|src)\/components\/(\w+)\.(vue|ts)$/

  return paths
    .map(p => p.match(pattern)?.[1])
    .filter((name): name is string => !!name)
}

// Extract config key from README (looks for "configKey" or nuxt.config example)
function extractConfigKey(readme: string | null): string | null {
  if (!readme) return null
  const match = readme.match(/configKey:\s*['"](\w+)['"]/)
    || readme.match(/defineNuxtConfig\(\{[\s\S]*?(\w+):\s*\{[\s\S]*?\}\s*\}/)
  return match?.[1] ?? null
}

// Extract first code block after "Quick Start", "Usage", or "Setup" heading
function extractQuickStart(readme: string | null): string | null {
  if (!readme) return null
  const match = readme.match(/##\s*(?:Quick\s*Start|Usage|Setup|Getting\s*Started|Installation)[\s\S]*?```[\w]*\n([\s\S]*?)```/)
  return match?.[1]?.trim().slice(0, 2000) ?? null
}

// Extract docs URL from README
function extractDocsUrl(readme: string | null): string | null {
  if (!readme) return null
  const match = readme.match(/(?:documentation|docs|full docs|read the docs)[:\s]*\[?[^\]]*\]?\(?(https?:\/\/[^\s)]+)/i)
  return match?.[1] ?? null
}

// Fetch homepage from npm registry
async function fetchNpmHomepage(pkg: string): Promise<{ homepage?: string } | null> {
  try {
    const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(pkg)}/latest`)
    if (!res.ok) return null
    const data = await res.json() as { homepage?: string }
    return data
  }
  catch {
    return null
  }
}
