import type { ModuleData } from '~~/shared/types/modules'

export const sortOptions = [
  { label: 'Score', value: 'score' },
  { label: 'Downloads', value: 'downloads' },
  { label: 'Stars', value: 'stars' },
  { label: 'Activity', value: 'activity' },
  { label: 'Name', value: 'name' },
]

export const typeOptions = [
  { label: 'All Types', value: 'all' },
  { label: 'Official', value: 'official' },
  { label: 'Community', value: 'community' },
  { label: '3rd Party', value: '3rd-party' },
]

export const compatOptions = [
  { label: 'All Compat', value: 'all' },
  { label: 'Nuxt 4', value: 'nuxt4' },
  { label: 'Nuxt 3 only', value: 'nuxt3' },
  { label: 'Unknown', value: 'unknown' },
]

// Chip filter definitions
export interface ChipFilter {
  id: string
  label: string
  icon: string
  filter: (m: ModuleData) => boolean
}

export const chipFilters: ChipFilter[] = [
  { id: 'stars100', label: '100+ ⭐', icon: 'i-lucide-star', filter: m => (m.github?.stars || 0) >= 100 },
  { id: 'stars500', label: '500+ ⭐', icon: 'i-lucide-star', filter: m => (m.github?.stars || 0) >= 500 },
  { id: 'stars1k', label: '1K+ ⭐', icon: 'i-lucide-star', filter: m => (m.github?.stars || 0) >= 1000 },
  { id: 'dl10k', label: '10K+ DL', icon: 'i-lucide-download', filter: m => (m.nuxtApiStats?.downloads || 0) >= 10000 },
  { id: 'dl100k', label: '100K+ DL', icon: 'i-lucide-download', filter: m => (m.nuxtApiStats?.downloads || 0) >= 100000 },
  { id: 'devs3', label: '3+ Devs', icon: 'i-lucide-users', filter: m => (m.contributors?.uniqueContributors || 0) >= 3 },
  { id: 'noVulns', label: 'No Vulns', icon: 'i-lucide-shield-check', filter: m => m.vulnerabilities?.count === 0 },
  { id: 'noCritical', label: 'No Critical', icon: 'i-lucide-shield', filter: m => (m.vulnerabilities?.critical || 0) === 0 },
  { id: 'score70', label: 'Score 70+', icon: 'i-lucide-heart-pulse', filter: m => m.health.score >= 70 },
  { id: 'score90', label: 'Score 90+', icon: 'i-lucide-heart-pulse', filter: m => m.health.score >= 90 },
]

export function isCriticalModule(mod: ModuleData): boolean {
  // Critical vulnerabilities
  if ((mod.vulnerabilities?.critical || 0) > 0) return true
  if ((mod.vulnerabilities?.high || 0) > 0) return true

  // Deprecated or archived
  if (mod.npm?.deprecated) return true
  if (mod.github?.archived) return true

  // Abandoned (>1 year no commits)
  if (mod.github?.pushedAt) {
    const daysSincePush = Math.floor(
      (Date.now() - new Date(mod.github.pushedAt).getTime()) / (1000 * 60 * 60 * 24),
    )
    if (daysSincePush > 365) return true
  }

  return false
}

export function getCompatStatus(mod: ModuleData): 'nuxt4' | 'nuxt3' | 'unknown' {
  const hasNuxt4 = mod.nuxtApiCompat?.supports4
    || mod.topics?.hasNuxt4
    || mod.keywords?.hasNuxt4
  if (hasNuxt4) return 'nuxt4'

  const hasNuxt3 = mod.nuxtApiCompat?.supports3
    || mod.topics?.hasNuxt3
    || mod.keywords?.hasNuxt3
  if (hasNuxt3) return 'nuxt3'

  return 'unknown'
}

export function useModuleFilters(modules: Ref<ModuleData[] | null>, favorites: Ref<string[]>) {
  const search = ref('')
  const sortBy = ref('score')
  const filterCategory = ref('all')
  const filterType = ref('all')
  const filterCompat = ref('all')
  const showFavoritesOnly = ref(false)
  const showCriticalOnly = ref(false)
  const activeChips = ref<Set<string>>(new Set())

  const categoryOptions = computed(() => {
    const categoriesFromData = modules.value?.map(m => m.category) || []
    return buildCategoryOptions(categoriesFromData, true)
  })

  const criticalCount = computed(() => {
    return (modules.value || []).filter(isCriticalModule).length
  })

  const hasActiveFilters = computed(() => {
    return search.value
      || filterCategory.value !== 'all'
      || filterType.value !== 'all'
      || filterCompat.value !== 'all'
      || showFavoritesOnly.value
      || showCriticalOnly.value
      || activeChips.value.size > 0
  })

  function toggleChip(chipId: string) {
    const newSet = new Set(activeChips.value)
    if (newSet.has(chipId)) {
      newSet.delete(chipId)
    }
    else {
      newSet.add(chipId)
    }
    activeChips.value = newSet
  }

  function resetFilters() {
    search.value = ''
    filterCategory.value = 'all'
    filterType.value = 'all'
    filterCompat.value = 'all'
    showFavoritesOnly.value = false
    showCriticalOnly.value = false
    activeChips.value = new Set()
  }

  const filteredModules = computed(() => {
    let result = modules.value || []

    if (search.value) {
      const q = search.value.toLowerCase()
      result = result.filter(m =>
        m.name.toLowerCase().includes(q)
        || m.description?.toLowerCase().includes(q),
      )
    }

    if (filterCategory.value !== 'all') {
      result = result.filter(m => m.category === filterCategory.value)
    }

    if (filterType.value !== 'all') {
      result = result.filter(m => m.type === filterType.value)
    }

    if (filterCompat.value !== 'all') {
      result = result.filter(m => getCompatStatus(m) === filterCompat.value)
    }

    if (showFavoritesOnly.value) {
      result = result.filter(m => favorites.value.includes(m.name))
    }

    if (showCriticalOnly.value) {
      result = result.filter(isCriticalModule)
    }

    // Apply chip filters (AND logic - all active chips must match)
    if (activeChips.value.size > 0) {
      const activeFilters = chipFilters.filter(c => activeChips.value.has(c.id))
      result = result.filter(m => activeFilters.every(f => f.filter(m)))
    }

    result = [...result].sort((a, b) => {
      switch (sortBy.value) {
        case 'score':
          return b.health.score - a.health.score
        case 'downloads':
          return (b.nuxtApiStats?.downloads || 0) - (a.nuxtApiStats?.downloads || 0)
        case 'stars':
          return (b.github?.stars || 0) - (a.github?.stars || 0)
        case 'activity': {
          const aDate = a.github?.pushedAt ? new Date(a.github.pushedAt).getTime() : 0
          const bDate = b.github?.pushedAt ? new Date(b.github.pushedAt).getTime() : 0
          return bDate - aDate
        }
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

    return result
  })

  return {
    search,
    sortBy,
    filterCategory,
    filterType,
    filterCompat,
    showFavoritesOnly,
    showCriticalOnly,
    activeChips,
    toggleChip,
    categoryOptions,
    criticalCount,
    hasActiveFilters,
    resetFilters,
    filteredModules,
  }
}
