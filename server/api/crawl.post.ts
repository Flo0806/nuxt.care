// POST /api/crawl - Crawl README + repo structure for all modules
// Stores AI context in KV as context:{moduleName} (overwritten each run)

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const token = config.github?.token as string | undefined

  const modules = await kv.get<ModuleData[]>('modules:all')
  if (!modules?.length) {
    return { status: 'skipped', reason: 'no modules' }
  }

  console.log(`[crawl] Starting crawl for ${modules.length} modules...`)

  let crawled = 0
  let failed = 0
  const errors: Array<{ module: string, error: string }> = []

  for (let i = 0; i < modules.length; i++) {
    const mod = modules[i]!

    if (i % 25 === 0) {
      console.log(`[crawl] Progress: ${i}/${modules.length} (${crawled} ok, ${failed} failed)`)
    }

    try {
      const context = await crawlModuleContext(mod, token)
      if (context) {
        await kv.set(`context:${mod.name}`, context)
        console.log(`[crawl] ${mod.name}: readme=${context.readme ? `${context.readme.length}ch` : 'none'}, composables=${context.composables.length}, components=${context.components.length}, docs=${context.docsUrl ?? 'none'}`)
        crawled++
      }
      else {
        const reason = `no repo path (repo: ${mod.repo || 'empty'})`
        console.warn(`[crawl] ${mod.name}: skipped - ${reason}`)
        errors.push({ module: mod.name, error: reason })
        failed++
      }
    }
    catch (err) {
      const msg = String(err)
      console.error(`[crawl] ${mod.name}: FAILED - ${msg}`)
      errors.push({ module: mod.name, error: msg })
      failed++
    }

    // Rate limit: 200ms between modules
    await new Promise(r => setTimeout(r, 200))
  }

  console.log(`[crawl] Done: ${crawled} crawled, ${failed} failed out of ${modules.length}`)
  if (errors.length > 0) {
    console.warn(`[crawl] Errors:`)
    for (const e of errors) {
      console.warn(`  - ${e.module}: ${e.error}`)
    }
  }

  return { status: 'done', crawled, failed, total: modules.length, errors: errors.length > 0 ? errors : undefined }
})
