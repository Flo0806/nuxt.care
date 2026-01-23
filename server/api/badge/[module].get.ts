import type { ModuleData } from '~~/shared/types/modules'
import { calculateHealth } from '../../utils/health'

// DEPRECATED: Use /api/v1/badge?module=xxx instead
export default defineEventHandler(async (event) => {
  // Mark as deprecated (RFC 8594)
  setResponseHeader(event, 'Deprecation', 'true')
  setResponseHeader(event, 'Link', '</api/v1/badge>; rel="successor-version"')

  const moduleName = getRouterParam(event, 'module')

  if (!moduleName) {
    throw createError({ statusCode: 400, message: 'Module name required' })
  }

  const modules = await kv.get<ModuleData[]>('modules:all')
  if (!modules) {
    throw createError({ statusCode: 404, message: 'No modules found' })
  }

  // Find module by name or npm package name
  const mod = modules.find(
    m => m.name === moduleName || m.npmPackage === moduleName,
  )

  if (!mod) {
    throw createError({ statusCode: 404, message: `Module "${moduleName}" not found` })
  }

  const health = calculateHealth(mod)
  const score = health.score

  // Determine color based on score
  let color: string
  if (score >= 80) color = 'brightgreen'
  else if (score >= 60) color = 'green'
  else if (score >= 40) color = 'yellow'
  else if (score >= 20) color = 'orange'
  else color = 'red'

  // shields.io endpoint schema
  return {
    schemaVersion: 1,
    label: 'nuxt.care',
    message: `${score}/100`,
    color,
  }
})
