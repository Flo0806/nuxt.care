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

  console.log(`GitHub Token: ${githubToken ? `configured (${githubToken.substring(0, 10)}...)` : 'NOT SET'}`)

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
    vulnerabilities: null,
    health: {
      score: 0,
      signals: [{ type: 'negative', msg: `Fetch failed: ${String(err)}`, points: 0, maxPoints: 100 }],
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
    vulnerabilities: null,
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
    const [npmData, vulns] = await Promise.all([
      fetchNpmInfo(mod.npm),
      fetchVulnerabilities(mod.npm),
    ])
    if (npmData) {
      data.npm = npmData
      data.keywords = analyzeKeywords(npmData.keywords)
    }
    data.vulnerabilities = vulns
  }

  data.health = calculateHealth(data)

  return data
}
