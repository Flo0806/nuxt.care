import { saveSnapshots } from '../utils/history'

export default defineEventHandler(async (event) => {
  const meta = await kv.get<SyncMetaWithServerId>('sync:meta') || getDefaultMeta()

  // Check for stale lock (crashed/restarted syncs)
  const { stale, reason } = isStaleSync(meta)

  if (meta.isRunning && !stale) {
    const runningFor = Date.now() - new Date(meta.startedAt!).getTime()
    return {
      status: 'already_running',
      startedAt: meta.startedAt,
      runningForMinutes: Math.round(runningFor / 60000),
    }
  }

  if (stale) {
    console.warn(`[sync] Stale lock detected: ${reason}, resetting`)
  }

  const query = getQuery(event)
  const force = query.force === 'true'

  if (!force && meta.lastSync) {
    const syncInterval = SYNC_INTERVAL
    const timeSinceSync = Date.now() - new Date(meta.lastSync).getTime()
    if (timeSinceSync < syncInterval) {
      return {
        status: 'skipped',
        reason: 'recently_synced',
        lastSync: meta.lastSync,
        nextSyncIn: Math.round((SYNC_INTERVAL - timeSinceSync) / 60000) + ' minutes',
      }
    }
  }

  const startedAt = new Date().toISOString()
  const newMeta = {
    ...meta,
    isRunning: true,
    startedAt,
    error: null,
    serverId: SERVER_ID,
  }
  await kv.set('sync:meta', newMeta)

  runSync(startedAt).catch((err) => {
    console.error('Sync failed:', err)
  })

  return {
    status: 'started',
    startedAt,
  }
})

async function runSync(startedAt: string): Promise<void> {
  const config = useRuntimeConfig()
  const githubToken = config.github?.token as string | undefined

  if (!githubToken) {
    throw new Error('No GitHub token configured (NUXT_GITHUB_TOKEN)')
  }

  try {
    const nuxtApi = await $fetch<NuxtApiResponse>('https://api.nuxt.com/modules')
    const syncLimit = Number(process.env.NUXT_SYNC_LIMIT) || 0
    const allModules = syncLimit > 0 ? nuxtApi.modules.slice(0, syncLimit) : nuxtApi.modules

    const totalModules = allModules.length

    console.log(`Syncing ${totalModules} modules...`)

    const results: ModuleData[] = []

    for (let i = 0; i < allModules.length; i++) {
      const mod = allModules[i]

      if (i % 10 === 0) {
        await updateProgress(startedAt, totalModules, i)
      }

      if (!mod) continue
      const descriptor = descriptorFromNuxtApi(mod)
      try {
        const moduleData = await analyzeModule(descriptor, githubToken)
        results.push(moduleData)
      }
      catch (err) {
        console.error(`[sync] Failed ${mod.name}:`, err)
        results.push(createErrorModule(descriptor, err))
      }

      await sleep(200)
    }

    // Sorting happens in modules.get.ts (score calculated on-the-fly)
    const duration = Date.now() - new Date(startedAt).getTime()

    // Detect new modules before overwriting
    const previousModules = await kv.get<ModuleData[]>('modules:all')
    const previousNames = new Set(previousModules?.map((m: ModuleData) => m.name) || [])
    const newModules = results.filter(m => !previousNames.has(m.name))

    await kv.set('modules:all', results)

    // Save daily history snapshots (max 1 per day)
    const { saved, skipped } = await saveSnapshots(results)
    console.log(`[sync] History: ${saved} snapshots saved, ${skipped} skipped (already today)`)

    // Crawl context for new modules in background (non-blocking)
    if (newModules.length > 0) {
      console.log(`[sync] Scheduling context crawl for ${newModules.length} new module(s)...`)
      crawlNewModulesInBackground(newModules, githubToken)
    }

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
    serverId: SERVER_ID,
  })
}

function crawlNewModulesInBackground(modules: ModuleData[], token?: string) {
  (async () => {
    let crawled = 0
    for (const mod of modules) {
      try {
        await crawlAndSaveContext(mod, token)
        crawled++
        if (crawled % 25 === 0) console.log(`[sync] Crawl progress: ${crawled}/${modules.length}`)
      }
      catch (err) {
        console.warn(`[sync] Failed to crawl context for ${mod.name}:`, err)
      }
    }
    console.log(`[sync] Crawl done: ${crawled}/${modules.length}`)
  })().catch(err => console.error('[sync] Background crawl failed:', err))
}
