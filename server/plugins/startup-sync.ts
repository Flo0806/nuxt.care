// Check on startup if sync is needed

// Cooldown: Don't start a new sync if one was attempted in the last 5 minutes
// This prevents rapid restarts from spamming sync attempts
const STARTUP_COOLDOWN = 5 * 60 * 1000

export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig()
  if (!config.github?.token) {
    console.log('[startup] No GitHub token configured, skipping sync')
    return
  }

  await new Promise(r => setTimeout(r, 2000))

  const meta = await kv.get<SyncMetaWithServerId>('sync:meta')
  const modules = await kv.get('modules:all')

  // Check if we have usable data (successful sync happened before)
  const hasData = !!modules && !!meta?.lastSync

  // Cooldown only applies if we have data - otherwise we MUST try to sync
  if (hasData && meta?.startedAt) {
    const timeSinceStart = Date.now() - new Date(meta.startedAt).getTime()
    if (timeSinceStart < STARTUP_COOLDOWN) {
      console.log(`[startup] Sync attempted ${Math.round(timeSinceStart / 1000)}s ago, cooldown active (have data)`)
      return
    }
  }

  // No data at all - need sync urgently
  if (!modules) {
    console.log('[startup] No modules data, triggering sync...')
    await triggerSync()
    return
  }

  // No successful sync recorded - need sync
  if (!meta?.lastSync) {
    console.log('[startup] No successful sync recorded, triggering sync...')
    await triggerSync()
    return
  }

  // Last sync > 8h ago
  const timeSinceSync = Date.now() - new Date(meta.lastSync).getTime()
  if (timeSinceSync > SYNC_INTERVAL) {
    console.log(`[startup] Last sync ${Math.round(timeSinceSync / 60000)}min ago, triggering sync...`)
    await triggerSync()
    return
  }

  console.log(`[startup] Sync not needed, last sync ${Math.round(timeSinceSync / 60000)}min ago`)
})

async function triggerSync() {
  try {
    const result = await $fetch('/api/sync?force=true', { method: 'POST' })
    console.log('[startup] Sync response:', result)
  }
  catch (err) {
    console.error('[startup] Sync request failed:', err)
  }
}
