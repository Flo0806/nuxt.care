// GET /api/sync - Get sync status
export default defineEventHandler(async () => {
  const meta = await kv.get('sync:meta')

  if (!meta) {
    return {
      status: 'never_synced',
      message: 'No sync has run yet. POST /api/sync to start.',
    }
  }

  return meta
})
