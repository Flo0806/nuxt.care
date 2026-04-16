import type { ModuleData } from '~~/shared/types/modules'

export interface MaintainerModule {
  module: ModuleData
  role: 'owner' | 'contributor'
}

function getOwner(m: ModuleData): string | null {
  return m.github?.fullName?.split('/')[0] ?? null
}

export function categorizeMaintainerModules(modules: ModuleData[], username: string): MaintainerModule[] {
  const needle = username.toLowerCase()
  const entries: MaintainerModule[] = []
  for (const m of modules) {
    const owner = getOwner(m)
    if (owner && owner.toLowerCase() === needle) {
      entries.push({ module: m, role: 'owner' })
      continue
    }
    if (m.contributors?.contributors?.some(c => c.toLowerCase() === needle)) {
      entries.push({ module: m, role: 'contributor' })
    }
  }
  return entries
}

export function useMaintainerModules(modules: Ref<ModuleData[] | null | undefined>) {
  const { user } = useAuth()

  const maintainerModules = computed<MaintainerModule[]>(() => {
    const username = user.value?.username
    if (!username || !modules.value) return []
    return categorizeMaintainerModules(modules.value, username)
  })

  const ownedModules = computed(() =>
    maintainerModules.value.filter(e => e.role === 'owner'),
  )

  const contributorModules = computed(() =>
    maintainerModules.value.filter(e => e.role === 'contributor'),
  )

  return {
    maintainerModules,
    ownedModules,
    contributorModules,
  }
}
