// GET /api/v1/badge?package=packageName - badge for specific module by npm package name
// GET /api/v1/badge?module=moduleName - badge for specific module by module name
// GET /api/v1/badge?mode=score|status - badge display mode (default: score)

import { calculateHealth, getStatusColor, scoreToStatus } from '../../utils/health'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const packageName = query.package as string | undefined
  const moduleName = query.module as string | undefined
  const mode = (query.mode as string | undefined) || 'score'

  if (!packageName && !moduleName) {
    throw createError({ statusCode: 400, message: 'Package or module name required' })
  }

  const modules = await kv.get<ModuleData[]>('modules:all')
  if (!modules) {
    throw createError({ statusCode: 404, message: 'No modules found' })
  }

  const mod = modules.find(
    m => moduleName ? m.name === moduleName : m.npmPackage === packageName,
  )

  if (!mod) {
    throw createError({ statusCode: 404, message: `Module "${moduleName || packageName}" not found` })
  }

  const health = calculateHealth(mod)

  const color = getStatusColor(health.score)

  // shields.io endpoint schema
  return {
    schemaVersion: 1,
    label: 'nuxt.care',
    message: mode === 'score' ? `${health.score}/100` : scoreToStatus(health.score),
    color,
  }
})
