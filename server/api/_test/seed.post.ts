import type { ModuleData } from '~~/shared/types/modules'

// Test-only endpoint to seed KV with mock data
export default defineEventHandler(async (event) => {
  // Only allow in test/development
  if (process.env.NODE_ENV === 'production') {
    throw createError({ statusCode: 404, message: 'Not found' })
  }

  const body = await readBody<{ modules: ModuleData[] }>(event)

  if (!body?.modules) {
    throw createError({ statusCode: 400, message: 'modules required' })
  }

  await kv.set('modules:all', body.modules)

  return { ok: true, count: body.modules.length }
})
