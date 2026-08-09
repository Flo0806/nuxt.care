// Nitro scheduled task - crawls README + repo structure for AI context
// Runs weekly, stores in KV as context:{moduleName} (overwritten each run)
export default defineTask({
  meta: {
    name: 'crawl:readme',
    description: 'Crawl module READMEs and repo structure for AI context',
  },
  async run() {
    // Dev switch, see server/plugins/startup-sync.ts
    if (process.env.NUXT_SKIP_SYNC === 'true') {
      console.log('README crawl skipped: NUXT_SKIP_SYNC is set')
      return { result: { skipped: true } }
    }

    const result = await $fetch('/api/crawl', { method: 'POST' })
    console.log('README crawl triggered:', result)
    return { result }
  },
})
