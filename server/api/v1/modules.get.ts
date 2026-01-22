import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ModuleData, ModuleSlim, ModuleStatus } from '~~/shared/types/modules'
import { calculateHealth } from '../../utils/health'

// GET /api/v1/modules - all modules (sorted by score)
// GET /api/v1/modules?package=a&package=b - specific modules by npm package
// GET /api/v1/modules?slim=true - slim format for devtools
// GET /api/v1/modules?slim=true&badge=inline|dataurl|url

function scoreToStatus(score: number): ModuleStatus {
  if (score >= 90) return 'optimal'
  if (score >= 70) return 'stable'
  if (score >= 40) return 'degraded'
  return 'critical'
}

// Cache badges in memory
const badgeCache = new Map<ModuleStatus, string>()

// Determine public path (differs between dev and production)
function getPublicPath(): string {
  const prodPath = join(process.cwd(), '.output', 'public')
  if (existsSync(prodPath)) return prodPath
  return join(process.cwd(), 'public')
}

function loadBadgeSvg(status: ModuleStatus): string {
  if (!badgeCache.has(status)) {
    const path = join(getPublicPath(), 'images', 'badges', `badge_${status}.svg`)
    badgeCache.set(status, readFileSync(path, 'utf-8'))
  }
  return badgeCache.get(status)!
}

function getBadge(status: ModuleStatus, format: string | undefined): string | undefined {
  if (format === 'url') {
    return `/images/badges/badge_${status}.svg`
  }

  if (format === 'inline') {
    return loadBadgeSvg(status)
  }

  if (format === 'dataurl') {
    const svg = loadBadgeSvg(status)
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
  }

  return undefined
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const packageParam = query.package as string | string[] | undefined
  const slim = query.slim === 'true'
  const badgeFormat = query.badge as string | undefined

  const allModules = await kv.get<ModuleData[]>('modules:all')
  if (!allModules) return []

  let modules = allModules

  // Filter by package if provided (?package=a&package=b)
  if (packageParam) {
    const packages = Array.isArray(packageParam) ? packageParam : [packageParam]

    modules = allModules.filter(
      m => packages.includes(m.npmPackage),
    )
  }

  // Calculate health score on-the-fly (allows scoring changes without re-sync)
  const withHealth = modules.map((mod) => {
    mod.health = calculateHealth(mod)
    return mod
  }).sort((a, b) => b.health.score - a.health.score)

  // Slim format for devtools
  if (slim) {
    return withHealth.map((mod): ModuleSlim => {
      const status = scoreToStatus(mod.health.score)
      const badge = getBadge(status, badgeFormat)
      return {
        name: mod.name,
        npm: mod.npmPackage,
        score: mod.health.score,
        status,
        lastUpdated: mod.npm?.lastPublish ?? null,
        ...(badge && { badge }),
      }
    })
  }

  return withHealth
})
