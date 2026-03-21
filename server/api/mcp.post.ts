import { calculateHealth, scoreToStatus } from '../utils/health'
import { calculateVersionScore } from '../utils/version-score'

// Tool definitions for MCP discovery
const TOOLS = [
  {
    name: 'module_search',
    description: 'Search for Nuxt modules by keyword. Returns matching modules with health score, status, install command, downloads and stars. Use this whenever the user needs a module for a specific purpose (auth, forms, images, etc.) instead of guessing or relying on training data.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term like "forms", "auth", "i18n", "image"' },
        limit: { type: 'number', description: 'Max results (default 5, max 10)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'module_health',
    description: 'Get detailed health information for a specific Nuxt module. Returns score breakdown, all signals with points, version, vulnerabilities, trend data. Use this to evaluate if a module is safe to use.',
    inputSchema: {
      type: 'object',
      properties: {
        module: { type: 'string', description: 'Module name like "pinia", "i18n", "image"' },
      },
      required: ['module'],
    },
  },
  {
    name: 'project_check',
    description: 'PROACTIVE: Run this check automatically when starting work on a Nuxt project, during maintenance tasks, or when the user asks about dependencies/updates. Read the modules array from nuxt.config.ts and the installed versions from package.json (or lock file). Returns a markdown table with health scores, upgrade recommendations, and critical warnings for archived/deprecated/vulnerable modules. Always offer to run this check when you detect a Nuxt project.',
    inputSchema: {
      type: 'object',
      properties: {
        modules: {
          type: 'array',
          description: 'Array of { name: string, version: string } - name from nuxt.config.ts modules array (e.g. "@nuxt/image"), version from package.json or lock file',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Module name from nuxt.config.ts like "@nuxt/image", "@pinia/nuxt", "nuxt-auth-utils"' },
              version: { type: 'string', description: 'Installed version from package.json like "1.8.0" or "^1.8.0"' },
            },
            required: ['name', 'version'],
          },
        },
      },
      required: ['modules'],
    },
  },
  {
    name: 'module_context',
    description: 'Get basic integration context for a Nuxt module: README, composables, components, config key, quick-start example, docs URL. IMPORTANT: This provides only a quick overview. Always refer the user to the official docs URL for detailed configuration, advanced usage, and edge cases.',
    inputSchema: {
      type: 'object',
      properties: {
        module: { type: 'string', description: 'Module name like "pinia", "i18n", "image"' },
      },
      required: ['module'],
    },
  },
]

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // MCP uses JSON-RPC 2.0
  const { method, params, id } = body

  // Discovery: which tools are available?
  if (method === 'tools/list') {
    return { jsonrpc: '2.0', id, result: { tools: TOOLS } }
  }

  // Execution: run a specific tool
  if (method === 'tools/call') {
    const { name, arguments: args } = params

    if (name === 'module_search') {
      return { jsonrpc: '2.0', id, result: await handleModuleSearch(args) }
    }

    if (name === 'module_health') {
      return { jsonrpc: '2.0', id, result: await handleModuleHealth(args) }
    }

    if (name === 'project_check') {
      return { jsonrpc: '2.0', id, result: await handleProjectCheck(args) }
    }

    if (name === 'module_context') {
      return { jsonrpc: '2.0', id, result: await handleModuleContext(args) }
    }

    return { jsonrpc: '2.0', id, error: { code: -32602, message: `Unknown tool: ${name}` } }
  }

  // Unknown method
  return { jsonrpc: '2.0', id, error: { code: -32601, message: `Unknown method: ${method}` } }
})

async function handleModuleSearch(args: { query: string, limit?: number }) {
  const query = args.query.toLowerCase()
  const limit = Math.min(args.limit ?? 5, 10)

  const allModules = await kv.get<ModuleData[]>('modules:all')
  if (!allModules) {
    return { content: [{ type: 'text', text: 'No module data available. Try again later.' }] }
  }

  // Search by name, description, category, keywords
  const matches = allModules
    .map((mod: ModuleData) => {
      const health = calculateHealth(mod)
      let relevance = 0
      if (mod.name.includes(query)) relevance += 10
      if (mod.description?.toLowerCase().includes(query)) relevance += 5
      if (mod.category?.toLowerCase().includes(query)) relevance += 3
      if (mod.npm?.keywords?.some((k: string) => k.toLowerCase().includes(query))) relevance += 3
      return { mod, health, relevance }
    })
    .filter((m: { relevance: number }) => m.relevance > 0)
    .sort((a: { relevance: number, health: HealthScore }, b: { relevance: number, health: HealthScore }) => b.relevance - a.relevance || b.health.score - a.health.score)
    .slice(0, limit)

  if (matches.length === 0) {
    return { content: [{ type: 'text', text: `No modules found for "${args.query}".` }] }
  }

  const results = matches.map(({ mod, health }: { mod: ModuleData, health: HealthScore }, i: number) => {
    const status = scoreToStatus(health.score)
    return [
      `${i + 1}. **${mod.name}** (${health.score}/100 - ${status})`,
      `   ${mod.description}`,
      `   Install: \`npx nuxt module add ${mod.name}\``,
      `   npm: ${mod.npmPackage} | Downloads: ${formatNum(mod.npm?.downloads)} | Stars: ${formatNum(mod.github?.stars)}`,
      `   Type: ${mod.type} | Category: ${mod.category}`,
    ].join('\n')
  })

  return {
    content: [{
      type: 'text',
      text: `Found ${matches.length} module${matches.length > 1 ? 's' : ''} for "${args.query}":\n\n${results.join('\n\n')}`,
    }],
  }
}

async function handleModuleHealth(args: { module: string }) {
  const allModules = await kv.get<ModuleData[]>('modules:all')
  if (!allModules) {
    return { content: [{ type: 'text', text: 'No module data available. Try again later.' }] }
  }

  const mod = allModules.find((m: ModuleData) => m.name === args.module)
  if (!mod) {
    return { content: [{ type: 'text', text: `Module "${args.module}" not found.` }] }
  }

  const health = calculateHealth(mod)
  const status = scoreToStatus(health.score)

  const signals = health.signals
    .filter(s => s.maxPoints > 0 || s.points < 0)
    .map(s => `  ${s.points >= 0 ? '+' : ''}${s.points}/${s.maxPoints} ${s.msg}`)
    .join('\n')

  const info = health.signals
    .filter(s => s.maxPoints === 0 && s.points === 0)
    .map(s => `  ${s.msg}`)
    .join('\n')

  const history = await getModuleHistory(mod.name, { days: 30 })
  let trend = ''
  if (history && history.snapshots.length >= 2) {
    const first = history.snapshots[0]!
    const last = history.snapshots[history.snapshots.length - 1]!
    const diff = last.score - first.score
    trend = `\nTrend (${history.snapshots.length}d): ${first.score} → ${last.score} (${diff >= 0 ? '+' : ''}${diff})`
  }

  const text = [
    `**${mod.name}** — ${health.score}/100 (${status})`,
    `${mod.description}`,
    ``,
    `Install: \`npx nuxt module add ${mod.name}\``,
    `Package: ${mod.npmPackage} v${mod.npm?.latestVersion ?? '?'}`,
    `Type: ${mod.type} | Category: ${mod.category}`,
    ``,
    `Score breakdown:`,
    signals,
    ``,
    `Info:`,
    info,
    trend,
    mod.vulnerabilities && mod.vulnerabilities.count > 0
      ? `\nVulnerabilities: ${mod.vulnerabilities.count} (${mod.vulnerabilities.critical} critical, ${mod.vulnerabilities.high} high)`
      : '',
  ].filter(Boolean).join('\n')

  return { content: [{ type: 'text', text }] }
}

async function handleProjectCheck(args: { modules: Array<{ name: string, version: string }> }) {
  const allModules = await kv.get<ModuleData[]>('modules:all')
  if (!allModules) {
    return { content: [{ type: 'text', text: 'No module data available. Try again later.' }] }
  }

  // Match by npm package name (from nuxt.config.ts modules array)
  const byNpm = new Map(allModules.map((m: ModuleData) => [m.npmPackage, m]))
  // Also match by module name (some configs use short names)
  const byName = new Map(allModules.map((m: ModuleData) => [m.name, m]))

  const matched: Array<{ pkg: { name: string, version: string }, mod: ModuleData }> = []
  const unmatched: string[] = []

  for (const pkg of args.modules) {
    const mod = (byNpm.get(pkg.name) ?? byName.get(pkg.name)) as ModuleData | undefined
    if (mod) matched.push({ pkg, mod })
    else unmatched.push(pkg.name)
  }

  if (matched.length === 0) {
    return { content: [{ type: 'text', text: `No known Nuxt modules found in the ${args.modules.length} modules provided. Unrecognized: ${unmatched.join(', ')}` }] }
  }

  // Check each module: version score, latest score, warnings
  const rows: string[] = []
  const warnings: string[] = []

  for (const { pkg, mod } of matched) {
    const cleanVersion = pkg.version.replace(/^[\^~>=<]*/g, '')
    const versionResult = await calculateVersionScore(mod.npmPackage, cleanVersion)
    const latestHealth = calculateHealth(mod)

    let action = '✅ OK'
    let details = 'Up to date'

    if (mod.github?.archived) {
      action = '🔴 Archived'
      details = 'Repository is archived - find a replacement!'
      warnings.push(`**${mod.name}**: Repository is ARCHIVED. Stop using this module and migrate to an alternative.`)
    }
    else if (mod.npm?.deprecated) {
      action = '🔴 Deprecated'
      details = `${mod.npm.deprecated}`
      warnings.push(`**${mod.name}**: DEPRECATED - ${mod.npm.deprecated}`)
    }
    else if (versionResult && !versionResult.isLatest) {
      const scoreDiff = (versionResult.latestScore ?? 0) - versionResult.score
      const parts: string[] = []

      if (scoreDiff > 0) parts.push(`score +${scoreDiff}`)
      if (versionResult.vulnerabilities
        && versionResult.vulnerabilities.count > 0
        && (!versionResult.latestVulnerabilities || versionResult.latestVulnerabilities.count < versionResult.vulnerabilities.count)) {
        const fixed = versionResult.vulnerabilities.count - (versionResult.latestVulnerabilities?.count ?? 0)
        parts.push(`${fixed} vuln${fixed > 1 ? 's' : ''} fixed`)
      }
      if (versionResult.versionInfo.deprecated) parts.push('version deprecated')
      if (versionResult.latestVersionInfo?.nuxtCompat?.supports4 && !versionResult.versionInfo.nuxtCompat?.supports4) {
        parts.push('Nuxt 4 support added')
      }

      if (versionResult.recommendation === 'avoid') {
        action = '🔴 Upgrade!'
        warnings.push(`**${mod.name}**: Installed version ${cleanVersion} should be avoided. ${parts.join(', ')}`)
      }
      else if (versionResult.recommendation === 'upgrade') {
        action = '⚠️ Upgrade'
      }
      else {
        action = '🔄 Update available'
      }
      details = parts.length > 0 ? parts.join(', ') : `${cleanVersion} → ${versionResult.latestVersion}`
    }
    else if (versionResult?.vulnerabilities && versionResult.vulnerabilities.count > 0) {
      action = '⚠️ Vulns'
      details = `${versionResult.vulnerabilities.count} vulnerabilities (${versionResult.vulnerabilities.critical} critical)`
      if (versionResult.vulnerabilities.critical > 0) {
        warnings.push(`**${mod.name}**: ${versionResult.vulnerabilities.critical} CRITICAL vulnerabilities!`)
      }
    }

    const installedScore = versionResult?.score ?? latestHealth.score
    const latestScore = versionResult?.isLatest ? installedScore : (versionResult?.latestScore ?? latestHealth.score)
    const scoreDisplay = installedScore === latestScore
      ? `${installedScore}`
      : `${installedScore}→${latestScore}`

    rows.push(`| ${mod.name} | ${cleanVersion} | ${versionResult?.latestVersion ?? mod.npm?.latestVersion ?? '?'} | ${scoreDisplay} | ${action} | ${details} |`)
  }

  const table = [
    `| Module | Installed | Latest | Score | Status | Details |`,
    `|--------|-----------|--------|-------|--------|---------|`,
    ...rows,
  ].join('\n')

  const sections: string[] = [
    `## Project Health Check`,
    ``,
    `Found **${matched.length}** Nuxt module${matched.length > 1 ? 's' : ''} out of ${args.modules.length} in config.`,
    ``,
    table,
  ]

  if (warnings.length > 0) {
    sections.push(``, `### ⚠️ Critical Warnings`, ``, ...warnings.map(w => `- ${w}`))
  }

  const okCount = rows.filter(r => r.includes('✅')).length
  const upgradeCount = rows.filter(r => r.includes('⚠️') || r.includes('🔴') || r.includes('🔄')).length

  sections.push(``, `---`, `${okCount} module${okCount !== 1 ? 's' : ''} healthy, ${upgradeCount} need${upgradeCount === 1 ? 's' : ''} attention.`)

  return { content: [{ type: 'text', text: sections.join('\n') }] }
}

async function handleModuleContext(args: { module: string }) {
  const context = await getModuleContext(args.module)
  if (!context) {
    return { content: [{ type: 'text', text: `No context available for "${args.module}". It may not have been crawled yet.` }] }
  }

  const sections: string[] = [
    `# ${context.moduleName}`,
    ``,
    `> NOTE: This is a quick-start overview only. For detailed configuration, advanced usage, and all options, always refer to the official documentation.`,
    ``,
    `Install: \`${context.installCommand}\``,
    `Package: ${context.npmPackage}`,
  ]

  if (context.docsUrl) {
    sections.push(`Docs (RECOMMENDED): ${context.docsUrl}`)
  }

  if (context.composables.length > 0) {
    sections.push(``, `## Composables`, context.composables.map(c => `- \`${c}\``).join('\n'))
  }

  if (context.components.length > 0) {
    sections.push(``, `## Components`, context.components.map(c => `- \`<${c} />\``).join('\n'))
  }

  if (context.configKey) {
    sections.push(``, `## Config`, `Config key in \`nuxt.config.ts\`: \`${context.configKey}\``)
  }

  if (context.quickStart) {
    sections.push(``, `## Quick Start`, '```ts', context.quickStart, '```')
  }

  if (context.readme) {
    const truncated = context.readme.length > 10000
      ? context.readme.slice(0, 10000) + '\n\n... (README truncated)'
      : context.readme
    sections.push(``, `## Full README`, truncated)
  }

  return { content: [{ type: 'text', text: sections.join('\n') }] }
}

function formatNum(n: number | null | undefined): string {
  if (n == null) return '-'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return String(n)
}
