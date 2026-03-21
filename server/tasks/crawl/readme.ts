// Nitro scheduled task - crawls README + repo structure for AI context
// Runs weekly, stores in KV as context:{moduleName} (overwritten each run)
export default defineTask({
  meta: {
    name: 'crawl:readme',
    description: 'Crawl module READMEs and repo structure for AI context',
  },
  async run() {
    const result = await $fetch('/api/crawl', { method: 'POST' })
    console.log('README crawl triggered:', result)
    return { result }
  },
})
