// Nitro scheduled task - called by cron '0 */8 * * *'
export default defineTask({
  meta: {
    name: 'sync:modules',
    description: 'Sync modules from Nuxt API, GitHub, npm',
  },
  async run() {
    // Trigger the sync endpoint internally
    const result = await $fetch('/api/sync', { method: 'POST' })
    console.log('Scheduled sync triggered:', result)
    return { result }
  },
})
