// Nitro scheduled task - called by cron '0 */8 * * *'
export default defineTask({
  meta: {
    name: 'sync:modules',
    description: 'Sync modules from Nuxt API, GitHub, npm',
  },
  async run() {
    // Dev switch, see server/plugins/startup-sync.ts
    if (process.env.NUXT_SKIP_SYNC === 'true') {
      console.log('Scheduled sync skipped: NUXT_SKIP_SYNC is set')
      return { result: { skipped: true } }
    }

    // Trigger the sync endpoint internally
    const result = await $fetch('/api/sync', { method: 'POST' })
    console.log('Scheduled sync triggered:', result)
    return { result }
  },
})
