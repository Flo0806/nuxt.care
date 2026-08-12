// Nitro scheduled task - called by cron '*/30 * * * *'
//
// Runs twice as often as REVIEW_INTERVAL_MS on purpose: the cron is the clock,
// the interval inside the endpoint is the brake. Half the firings bounce off
// it and cost a single KV read, which keeps the two numbers independent.
export default defineTask({
  meta: {
    name: 'review:run',
    description: 'Refresh the cache of open submissions to nuxt/modules',
  },
  async run() {
    // Dev switch, see server/plugins/startup-sync.ts
    if (process.env.NUXT_SKIP_SYNC === 'true') {
      console.log('Review run skipped: NUXT_SKIP_SYNC is set')
      return { result: { skipped: true } }
    }

    const result = await $fetch('/api/review/run', { method: 'POST' })
    console.log('Review run triggered:', result)
    return { result }
  },
})
