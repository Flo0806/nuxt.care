import type { ModuleData } from '~~/shared/types/modules'

export default defineEventHandler(async () => {
  const modules = await kv.get<ModuleData[]>('modules:all')
  return modules || []
})
