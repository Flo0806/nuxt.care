// GET /api/sync - Get sync status
// Also detects and resets stale locks (crashed/restarted syncs)

export default defineEventHandler(async () => {
  const meta = await kv.get<SyncMetaWithServerId>('sync:meta')

  if (!meta) {
    return getDefaultMeta()
  }

  // Check for stale lock
  const { stale, reason } = isStaleSync(meta)
  if (stale) {
    console.warn(`[sync.get] Stale lock detected: ${reason}, resetting`)

    const resetMeta: SyncMeta = {
      ...meta,
      isRunning: false,
      startedAt: null,
      error: `Sync stopped: ${reason}`,
    }

    await kv.set('sync:meta', resetMeta)
    return resetMeta
  }

  return meta
})
