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

  const categoryOptions = computed(() => {
    const categories = new Set(modules.value?.map(m => m.category) || [])
    return [
      { label: 'All Categories', value: 'all' },
      ...Array.from(categories).sort().map(c => ({ label: c, value: c })),
    ]
  })

  const hasActiveFilters = computed(() => {
    return search.value
      || filterCategory.value !== 'all'
      || filterType.value !== 'all'
      || filterCompat.value !== 'all'
      || showFavoritesOnly.value
  })

  function resetFilters() {
    search.value = ''
    filterCategory.value = 'all'
    filterType.value = 'all'
    filterCompat.value = 'all'
    showFavoritesOnly.value = false
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
    categoryOptions,
    hasActiveFilters,
    resetFilters,
    filteredModules,
  }
}
