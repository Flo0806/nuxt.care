import type {
  SyncMeta,
  ModuleData,
  NuxtApiModule,
  NuxtApiResponse,
  GitHubRepoResponse,
  GitHubRepoInfo,
  GitHubReleaseResponse,
  GitHubCommitResponse,
  ReleaseInfo,
  ContributorsInfo,
  TopicsAnalysis,
  KeywordsAnalysis,
  NpmInfo,
  CompatAnalysis,
  HealthScore,
  HealthSignal,
} from '~~/shared/types/modules'

const SYNC_INTERVAL = 8 * 60 * 60 * 1000
const SYNC_TIMEOUT = 4 * 60 * 60 * 1000

// TEST: limit to 20 modules (set to 0 for all)
const TEST_LIMIT = 20

export default defineEventHandler(async (event) => {
  const meta = await kv.get<SyncMeta>('sync:meta') || getDefaultMeta()

  if (meta.isRunning && meta.startedAt) {
    const runningFor = Date.now() - new Date(meta.startedAt).getTime()

    if (runningFor < SYNC_TIMEOUT) {
      return {
        status: 'already_running',
        startedAt: meta.startedAt,
        runningForMinutes: Math.round(runningFor / 60000),
      }
    }

    console.warn(`Sync running for ${Math.round(runningFor / 60000)}min, resetting lock`)
  }

  const query = getQuery(event)
  const force = query.force === 'true'

  if (!force && meta.lastSync) {
    const timeSinceSync = Date.now() - new Date(meta.lastSync).getTime()
    if (timeSinceSync < SYNC_INTERVAL) {
      return {
        status: 'skipped',
        reason: 'recently_synced',
        lastSync: meta.lastSync,
        nextSyncIn: Math.round((SYNC_INTERVAL - timeSinceSync) / 60000) + ' minutes',
      }
    }
  }

  const startedAt = new Date().toISOString()
  await kv.set('sync:meta', {
    ...meta,
    isRunning: true,
    startedAt,
    error: null,
  })

  runSync(startedAt).catch((err) => {
    console.error('Sync failed:', err)
  })

  return {
    status: 'started',
    startedAt,
  }
})

function getDefaultMeta(): SyncMeta {
  return {
    lastSync: null,
    isRunning: false,
    startedAt: null,
    totalModules: 0,
    syncedModules: 0,
    duration: null,
    error: null,
  }
}

async function runSync(startedAt: string): Promise<void> {
  const config = useRuntimeConfig()
  const githubToken = config.github?.token as string | undefined

  try {
    const nuxtApi = await $fetch<NuxtApiResponse>('https://api.nuxt.com/modules')
    let allModules = nuxtApi.modules

    // TEST: pick every Nth module to get variety
    if (TEST_LIMIT > 0 && allModules.length > TEST_LIMIT) {
      const step = Math.floor(allModules.length / TEST_LIMIT)
      allModules = allModules.filter((_, i) => i % step === 0).slice(0, TEST_LIMIT)
    }

    const totalModules = allModules.length

    console.log(`Syncing ${totalModules} modules...`)

    const results: ModuleData[] = []

    for (let i = 0; i < allModules.length; i++) {
      const mod = allModules[i]

      if (i % 10 === 0) {
        await updateProgress(startedAt, totalModules, i)
      }

      try {
        const moduleData = await fetchModuleData(mod, githubToken)
        results.push(moduleData)
      }
      catch (err) {
        console.error(`Failed to fetch ${mod.name}:`, err)
        results.push(createErrorModule(mod, err))
      }

      await sleep(200)
    }

    results.sort((a, b) => b.health.score - a.health.score)

    const duration = Date.now() - new Date(startedAt).getTime()

    await kv.set('modules:all', results)
    await kv.set('sync:meta', {
      lastSync: new Date().toISOString(),
      isRunning: false,
      startedAt: null,
      totalModules,
      syncedModules: results.length,
      duration,
      error: null,
    } satisfies SyncMeta)

    console.log(`Sync complete: ${results.length} modules in ${Math.round(duration / 1000)}s`)
  }
  catch (err) {
    await kv.set('sync:meta', {
      ...getDefaultMeta(),
      error: String(err),
    })
    throw err
  }
}

async function updateProgress(startedAt: string, total: number, current: number): Promise<void> {
  await kv.set('sync:meta', {
    lastSync: null,
    isRunning: true,
    startedAt,
    totalModules: total,
    syncedModules: current,
    duration: null,
    error: null,
  } satisfies SyncMeta)
}

function createErrorModule(mod: NuxtApiModule, err: unknown): ModuleData {
  return {
    name: mod.name,
    npmPackage: mod.npm,
    repo: mod.repo,
    description: mod.description,
    category: mod.category,
    type: mod.type,
    maintainers: [],
    nuxtApiCompat: null,
    nuxtApiStats: null,
    github: null,
    topics: null,
    nuxt4Issues: null,
    release: null,
    oldestIssue: null,
    contributors: null,
    readme: null,
    npm: null,
    keywords: null,
    nodeEngine: null,
    deps: null,
    moduleJson: null,
    health: {
      score: 0,
      signals: [{ type: 'negative', msg: `Fetch failed: ${String(err)}` }],
    },
  }
}

async function fetchModuleData(mod: NuxtApiModule, githubToken?: string): Promise<ModuleData> {
  const data: ModuleData = {
    name: mod.name,
    npmPackage: mod.npm,
    repo: mod.repo,
    description: mod.description,
    category: mod.category,
    type: mod.type,
    icon: mod.icon,
    maintainers: mod.maintainers?.map(m => m.name) || [],
    nuxtApiCompat: analyzeCompatString(mod.compatibility?.nuxt),
    nuxtApiStats: mod.stats || null,
    github: null,
    topics: null,
    nuxt4Issues: null,
    release: null,
    oldestIssue: null,
    contributors: null,
    readme: null,
    npm: null,
    keywords: null,
    nodeEngine: null,
    deps: null,
    moduleJson: null,
    health: { score: 0, signals: [] },
  }

  if (mod.repo) {
    const repoPath = cleanRepoPath(mod.repo)
    if (repoPath) {
      const [github, releases, contributors] = await Promise.all([
        fetchGitHubRepo(repoPath, githubToken),
        fetchGitHubReleases(repoPath, githubToken),
        fetchContributors(repoPath, githubToken),
      ])

      if (github) {
        data.github = github
        data.topics = analyzeTopics(github.topics)
      }

      if (releases) {
        data.release = releases
      }

      if (contributors) {
        data.contributors = contributors
      }
    }
  }

  if (mod.npm) {
    const npmData = await fetchNpmInfo(mod.npm)
    if (npmData) {
      data.npm = npmData
      data.keywords = analyzeKeywords(npmData.keywords)
    }
  }

  data.health = calculateHealth(data)

  return data
}

function cleanRepoPath(repo: string): string | null {
  if (!repo) return null
  const clean = repo.split('#')[0].split('/').slice(0, 2).join('/')
  return clean.split('/').length === 2 ? clean : null
}

async function fetchGitHubRepo(repoPath: string, token?: string): Promise<GitHubRepoInfo | null> {
  const res = await ghFetch<GitHubRepoResponse>(
    `https://api.github.com/repos/${repoPath}`,
    token,
  )
  if (!res) return null

  return {
    fullName: res.full_name,
    defaultBranch: res.default_branch,
    stars: res.stargazers_count,
    forks: res.forks_count,
    openIssues: res.open_issues_count,
    archived: res.archived,
    pushedAt: res.pushed_at,
    topics: res.topics,
    license: res.license?.spdx_id || null,
  }
}

async function fetchGitHubReleases(repoPath: string, token?: string): Promise<ReleaseInfo | null> {
  const releases = await ghFetch<GitHubReleaseResponse[]>(
    `https://api.github.com/repos/${repoPath}/releases?per_page=5`,
    token,
  )
  if (!releases?.length) return null

  const latest = releases[0]
  const nuxt4Mentioned = releases.some(r =>
    /nuxt\s*4|nuxt4/i.test(r.body || '') || /nuxt\s*4|nuxt4/i.test(r.name || ''),
  )

  return {
    tag: latest.tag_name,
    date: latest.published_at,
    daysSince: daysSince(latest.published_at),
    nuxt4Mentioned,
  }
}

async function fetchContributors(repoPath: string, token?: string): Promise<ContributorsInfo | null> {
  const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
  const commits = await ghFetch<GitHubCommitResponse[]>(
    `https://api.github.com/repos/${repoPath}/commits?since=${since}&per_page=100`,
    token,
  )
  if (!commits?.length) return null

  const authors = new Set<string>()
  for (const c of commits) {
    if (c.author?.login) {
      authors.add(c.author.login)
    }
  }

  return {
    commitsLastYear: commits.length,
    uniqueContributors: authors.size,
    contributors: Array.from(authors).slice(0, 5),
  }
}

async function fetchNpmInfo(pkg: string): Promise<NpmInfo | null> {
  try {
    const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(pkg)}`)
    if (!res.ok) return null

    const data = await res.json() as {
      'name': string
      'dist-tags'?: { latest?: string }
      'versions'?: Record<string, { peerDependencies?: Record<string, string>, keywords?: string[] }>
      'time'?: Record<string, string>
      'deprecated'?: string
    }

    const latest = data['dist-tags']?.latest
    const latestInfo = latest ? data.versions?.[latest] : null
    const time = data.time || {}

    return {
      name: data.name,
      latestVersion: latest || '',
      lastPublish: time[latest || ''] || time.modified || '',
      daysSincePublish: latest && time[latest] ? daysSince(time[latest]) : null,
      peerDeps: latestInfo?.peerDependencies || null,
      keywords: latestInfo?.keywords || [],
      deprecated: data.deprecated || null,
    }
  }
  catch {
    return null
  }
}

async function ghFetch<T>(url: string, token?: string): Promise<T | null> {
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'nuxamine',
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(url, { headers })
    if (!res.ok) return null
    return res.json() as Promise<T>
  }
  catch {
    return null
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

function daysSince(date: string): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
}

function analyzeCompatString(compat?: string): CompatAnalysis | null {
  if (!compat) return null
  return {
    supports4: /\^4|>=4|>3\.99|\*/.test(compat),
    supports3: /\^3|>=3|>2\.99|\*/.test(compat),
    raw: compat,
  }
}

function analyzeTopics(topics?: string[]): TopicsAnalysis | null {
  if (!topics?.length) return null
  const t = topics.map(x => x.toLowerCase())
  return {
    hasNuxt4: t.includes('nuxt4') || t.includes('nuxt-4'),
    hasNuxt3: t.includes('nuxt3') || t.includes('nuxt-3'),
    hasNuxt2: t.includes('nuxt2') || t.includes('nuxt-2'),
    isNuxtModule: t.includes('nuxt-module') || t.includes('nuxtjs'),
    all: topics,
  }
}

function analyzeKeywords(keywords?: string[]): KeywordsAnalysis | null {
  if (!keywords?.length) return null
  const k = keywords.map(x => x.toLowerCase())
  return {
    hasNuxt4: k.includes('nuxt4') || k.includes('nuxt-4'),
    hasNuxt3: k.includes('nuxt3') || k.includes('nuxt-3'),
    all: keywords,
  }
}

function calculateHealth(data: ModuleData): HealthScore {
  let score = 50
  const signals: HealthSignal[] = []

  // Activity
  if (data.github?.pushedAt) {
    const days = daysSince(data.github.pushedAt)

    if (days < 7) {
      score += 15
      signals.push({ type: 'positive', msg: 'Very active' })
    }
    else if (days < 30) {
      score += 10
      signals.push({ type: 'positive', msg: 'Active' })
    }
    else if (days > 365) {
      score -= 25
      signals.push({ type: 'negative', msg: 'Abandoned (>1y)' })
    }
    else if (days > 180) {
      score -= 10
      signals.push({ type: 'warning', msg: 'Stale (>6mo)' })
    }
  }

  if (data.github?.archived) {
    score -= 40
    signals.push({ type: 'negative', msg: 'Archived' })
  }

  // Contributors
  if (data.contributors && data.contributors.uniqueContributors >= 3) {
    score += 5
    signals.push({ type: 'positive', msg: `${data.contributors.uniqueContributors} contributors` })
  }

  // Nuxt 4 signals
  if (data.topics?.hasNuxt4) {
    score += 20
    signals.push({ type: 'positive', msg: 'nuxt4 topic' })
  }

  if (data.keywords?.hasNuxt4) {
    score += 10
    signals.push({ type: 'positive', msg: 'nuxt4 keyword' })
  }

  if (data.nuxtApiCompat?.supports4) {
    score += 10
    signals.push({ type: 'positive', msg: 'Nuxt 4 compat' })
  }

  if (data.release?.nuxt4Mentioned) {
    score += 10
    signals.push({ type: 'positive', msg: 'Nuxt 4 in release' })
  }

  // Release
  if (data.release?.daysSince !== undefined && data.release.daysSince < 30) {
    score += 5
    signals.push({ type: 'positive', msg: 'Recent release' })
  }
  else if (data.release?.daysSince !== undefined && data.release.daysSince > 365) {
    score -= 5
    signals.push({ type: 'warning', msg: 'Old release' })
  }

  // npm
  if (data.npm?.deprecated) {
    score -= 30
    signals.push({ type: 'negative', msg: 'Deprecated' })
  }

  // Type
  if (data.type === 'official') {
    score += 10
    signals.push({ type: 'positive', msg: 'Official' })
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    signals,
  }
}
