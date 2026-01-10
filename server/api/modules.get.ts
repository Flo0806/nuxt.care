import type { ModuleData } from '~~/shared/types/modules'
import { calculateHealth } from '../utils/health'

export default defineEventHandler(async () => {
  const modules = await kv.get<ModuleData[]>('modules:all')
  if (!modules) return []

  // Calculate health score on-the-fly (allows scoring changes without re-sync)
  return modules.map((mod) => {
    mod.health = calculateHealth(mod)
    return mod
  }).sort((a, b) => b.health.score - a.health.score)
})
