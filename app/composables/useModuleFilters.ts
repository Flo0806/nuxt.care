import type { ModuleData } from '~~/shared/types/modules'

export const sortOptions = [
  { label: 'Score (High)', value: 'score' },
  { label: 'Score (Low)', value: 'score-asc' },
  { label: 'Downloads', value: 'downloads' },
  { label: 'Stars', value: 'stars' },
  { label: 'Activity', value: 'activity' },
  { label: 'Name', value: 'name' },
]

// Helper to check if module belongs to maintainer/org
export function matchesMaintainer(mod: ModuleData, query: string): boolean {
  if (!query || query === 'all') return true
  const q = query.toLowerCase()

  const repoOwner = mod.repo?.split('/')[0]?.toLowerCase()
  if (repoOwner === q) return true

  if (mod.maintainers?.some(m => m.toLowerCase() === q)) return true

  return false
}

// Chip filter definitions
export interface ChipFilter {
  id: string
  label: string
  icon: string
  filter: (m: ModuleData) => boolean
}

export const chipFilters: ChipFilter[] = [
  { id: 'hasTests', label: 'Has Tests', icon: 'i-lucide-test-tube', filter: m => m.npm?.hasTests === true },
  { id: 'hasTypes', label: 'TypeScript', icon: 'i-lucide-file-code', filter: m => m.npm?.hasTypes === true },
  { id: 'ciPassing', label: 'CI Passing', icon: 'i-lucide-check-circle', filter: m => m.ciStatus?.lastRunConclusion === 'success' },
  { id: 'noVulns', label: 'No Vulns', icon: 'i-lucide-shield-check', filter: m => m.vulnerabilities?.count === 0 },
  // Quality - needs attention (inverse)
  { id: 'noTests', label: 'No Tests', icon: 'i-lucide-test-tube-diagonal', filter: m => m.npm?.hasTests !== true },
  { id: 'noTypes', label: 'No TypeScript', icon: 'i-lucide-file-x', filter: m => m.npm?.hasTypes !== true },
  { id: 'ciFailing', label: 'CI Failing', icon: 'i-lucide-x-circle', filter: m => m.ciStatus?.lastRunConclusion === 'failure' },
  { id: 'hasVulns', label: 'Has Vulns', icon: 'i-lucide-shield-alert', filter: m => (m.vulnerabilities?.count || 0) > 0 },
  // Popularity
  { id: 'stars100', label: '100+ ⭐', icon: 'i-lucide-star', filter: m => (m.github?.stars || 0) >= 100 },
  { id: 'stars1k', label: '1K+ ⭐', icon: 'i-lucide-star', filter: m => (m.github?.stars || 0) >= 1000 },
  { id: 'dl10k', label: '10K+ DL/w', icon: 'i-lucide-download', filter: m => (m.npm?.downloads || 0) >= 10000 },
  // Score
  { id: 'score70', label: 'Score 70+', icon: 'i-lucide-heart-pulse', filter: m => m.health.score >= 70 },
  { id: 'scoreLow', label: 'Score < 50', icon: 'i-lucide-heart-crack', filter: m => m.health.score < 50 },
]

export function isCriticalModule(mod: ModuleData): boolean {
  // Critical/high vulnerabilities = always critical
  if ((mod.vulnerabilities?.critical || 0) > 0) return true
  if ((mod.vulnerabilities?.high || 0) > 0) return true

  // Deprecated = critical (shouldn't use)
  if (mod.npm?.deprecated) return true

  // Archived = critical (no longer maintained)
  if (mod.github?.archived) return true

  // Abandoned WITH pending commits = critical (dead with unfinished work)
  const pendingCount = mod.pendingCommits?.nonChore ?? 0
  if (pendingCount > 0 && mod.github?.pushedAt) {
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

export function useModuleFilters(modules: Ref<ModuleData[] | null | undefined>, favorites: Ref<string[]>, stars: Ref<string[]>, user?: Ref<SessionUser | null>) {
  const search = ref('')
  const sortBy = ref('score')

  // Read search from URL on client-side mount
  onMounted(() => {
    const params = new URLSearchParams(window.location.search)
    const searchParam = params.get('search')
    if (searchParam) {
      search.value = searchParam
    }
  })
  const filterCategory = ref('all')
  const filterType = ref('all')
  const filterCompat = ref('all')
  const filterMaintainer = ref('all')
  const showFavoritesOnly = ref(false)
  const showStarsOnly = ref(false)
  const showCriticalOnly = ref(false)
  const showContributedOnly = ref(false)
  const activeChips = ref<Set<string>>(new Set())

  // Helper: apply all filters, optionally excluding one (for dynamic dropdown options)
  function getPreFiltered(exclude: 'category' | 'type' | 'compat' | 'maintainer' | null) {
    let result = modules.value || []

    if (search.value) {
      const q = search.value.toLowerCase()
      result = result.filter(m =>
        m.name.toLowerCase().includes(q)
        || m.description?.toLowerCase().includes(q)
        || m.npmPackage?.toLowerCase().includes(q)
        || m.repo?.toLowerCase().includes(q),
      )
    }

    if (exclude !== 'category' && filterCategory.value !== 'all') {
      result = result.filter(m => m.category === filterCategory.value)
    }

    if (exclude !== 'type' && filterType.value !== 'all') {
      result = result.filter(m => m.type === filterType.value)
    }

    if (exclude !== 'compat' && filterCompat.value !== 'all') {
      result = result.filter(m => getCompatStatus(m) === filterCompat.value)
    }

    if (exclude !== 'maintainer' && filterMaintainer.value !== 'all') {
      result = result.filter(m => matchesMaintainer(m, filterMaintainer.value))
    }

    if (showFavoritesOnly.value) {
      result = result.filter(m => favorites.value.includes(m.name))
    }

    if (showCriticalOnly.value) {
      result = result.filter(isCriticalModule)
    }

    if (showStarsOnly.value) {
      result = result.filter(m => stars.value.includes(m.name))
    }

    if (showContributedOnly.value) {
      const username = user?.value?.username
      if (!username) return []
      result = result.filter(m => m.contributors?.contributors?.includes(username))
    }

    if (activeChips.value.size > 0) {
      const activeFilters = chipFilters.filter(c => activeChips.value.has(c.id))
      result = result.filter(m => activeFilters.every(f => f.filter(m)))
    }

    return result
  }

  // Dynamic filter options - each updates based on other active filters
  const categoryOptions = computed(() => {
    const filtered = getPreFiltered('category')
    return buildCategoryOptions(filtered.map(m => m.category), true)
  })

  const typeOptions = computed(() => {
    const filtered = getPreFiltered('type')
    const types = new Set(filtered.map(m => m.type))

    return [
      { label: 'All Types', value: 'all' },
      ...(types.has('official') ? [{ label: 'Official', value: 'official' }] : []),
      ...(types.has('community') ? [{ label: 'Community', value: 'community' }] : []),
      ...(types.has('3rd-party') ? [{ label: '3rd Party', value: '3rd-party' }] : []),
    ]
  })

  const compatOptions = computed(() => {
    const filtered = getPreFiltered('compat')
    const compats = new Set(filtered.map(m => getCompatStatus(m)))

    return [
      { label: 'All Compat', value: 'all' },
      ...(compats.has('nuxt4') ? [{ label: 'Nuxt 4', value: 'nuxt4' }] : []),
      ...(compats.has('nuxt3') ? [{ label: 'Nuxt 3 only', value: 'nuxt3' }] : []),
      ...(compats.has('unknown') ? [{ label: 'Unknown', value: 'unknown' }] : []),
    ]
  })

  const maintainerOptions = computed(() => {
    const filtered = getPreFiltered('maintainer')
    const owners = new Map<string, number>()

    for (const mod of filtered) {
      const owner = mod.repo?.split('/')[0]
      if (owner) {
        owners.set(owner, (owners.get(owner) || 0) + 1)
      }
    }

    const sorted = [...owners.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

    return [
      { label: 'All', value: 'all' },
      ...sorted.map(([owner, count]) => ({
        label: `${owner} (${count})`,
        value: owner,
      })),
    ]
  })

  const criticalCount = computed(() => {
    return (modules.value || []).filter(isCriticalModule).length
  })

  const hasActiveFilters = computed(() => {
    return !!search.value
      || filterCategory.value !== 'all'
      || filterType.value !== 'all'
      || filterCompat.value !== 'all'
      || filterMaintainer.value !== 'all'
      || showFavoritesOnly.value
      || showStarsOnly.value
      || showCriticalOnly.value
      || showContributedOnly.value
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
    filterMaintainer.value = 'all'
    showFavoritesOnly.value = false
    showStarsOnly.value = false
    showCriticalOnly.value = false
    showContributedOnly.value = false
    activeChips.value = new Set()
  }

  const filteredModules = computed(() => {
    // Reuse getPreFiltered with no exclusions (apply all filters)
    const result = getPreFiltered(null)

    // Sort
    return [...result].sort((a, b) => {
      switch (sortBy.value) {
        case 'score':
          return b.health.score - a.health.score
        case 'score-asc':
          return a.health.score - b.health.score
        case 'downloads':
          return (b.npm?.downloads || 0) - (a.npm?.downloads || 0)
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
  })

  return {
    search,
    sortBy,
    filterCategory,
    filterType,
    filterCompat,
    filterMaintainer,
    showFavoritesOnly,
    showStarsOnly,
    showContributedOnly,
    showCriticalOnly,
    activeChips,
    toggleChip,
    categoryOptions,
    typeOptions,
    compatOptions,
    maintainerOptions,
    criticalCount,
    hasActiveFilters,
    resetFilters,
    filteredModules,
  }
}
