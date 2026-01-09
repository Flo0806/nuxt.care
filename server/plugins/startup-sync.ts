import type { SyncMeta } from '~~/shared/types/modules'

const SYNC_INTERVAL = 8 * 60 * 60 * 1000

export default defineNitroPlugin(async () => {
  await new Promise(r => setTimeout(r, 2000))

  const meta = await kv.get<SyncMeta>('sync:meta')
  const modules = await kv.get('modules:all')

  // No data at all
  if (!modules) {
    console.log('No modules data, triggering sync...')
    await triggerSync()
    return
  }

  // No meta or never synced
  if (!meta?.lastSync) {
    console.log('No sync meta, triggering sync...')
    await triggerSync()
    return
  }

  // Last sync > 8h ago
  const timeSinceSync = Date.now() - new Date(meta.lastSync).getTime()
  if (timeSinceSync > SYNC_INTERVAL) {
    console.log(`Last sync ${Math.round(timeSinceSync / 60000)}min ago, triggering sync...`)
    await triggerSync()
    return
  }

  console.log(`Sync not needed, last sync ${Math.round(timeSinceSync / 60000)}min ago`)
})

async function triggerSync() {
  try {
    const result = await $fetch('/api/sync?force=true', { method: 'POST' })
    console.log('Startup sync:', result)
  }
  catch (err) {
    console.error('Startup sync failed:', err)
  }
}
