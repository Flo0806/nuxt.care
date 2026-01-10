// Shared sync utilities
// SERVER_ID is unique per server instance - used to detect crashed syncs

export const SERVER_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export const SYNC_INTERVAL = 8 * 60 * 60 * 1000 // 8 hours
export const SYNC_TIMEOUT = process.env.NODE_ENV === 'production' ? 2 * 60 * 60 * 1000 : 10 * 60 * 1000

export type SyncMetaWithServerId = SyncMeta & { serverId?: string }

export function getDefaultMeta(): SyncMeta {
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

/**
 * Check if a sync lock is stale (different server or timed out)
 */
export function isStaleSync(meta: SyncMetaWithServerId): { stale: boolean, reason?: string } {
  if (!meta.isRunning || !meta.startedAt) {
    return { stale: false }
  }

  const runningFor = Date.now() - new Date(meta.startedAt).getTime()

  // No serverId = old format or corrupted, treat as stale
  if (!meta.serverId) {
    return { stale: true, reason: 'missing serverId (old format)' }
  }

  // Different server = sync is definitely dead
  if (meta.serverId !== SERVER_ID) {
    return { stale: true, reason: 'server restarted' }
  }

  // Running too long = probably crashed
  if (runningFor > SYNC_TIMEOUT) {
    return { stale: true, reason: `timed out after ${Math.round(runningFor / 60000)} minutes` }
  }

  return { stale: false }
}
