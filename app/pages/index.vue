<template>
  <main class="min-h-screen bg-neutral-50 dark:bg-neutral-950">
    <div class="container mx-auto px-4 py-8">
      <AppHeader
        :sync-status="syncStatus"
        :critical-count="criticalCount"
        @show-critical="showCriticalOnly = true"
      />

      <!-- Dashboard Charts -->
      <DashboardCharts
        v-if="modules?.length"
        :modules="modules"
      />

      <!-- Sync in Progress (no data yet) -->
      <SyncProgress
        v-if="!modules?.length && syncStatus?.isRunning"
        :sync-status="syncStatus"
      />

      <!-- Has modules: show toolbar + list -->
      <template v-else-if="modules?.length">
        <ModulesModuleToolbar
          v-model:search="search"
          v-model:sort-by="sortBy"
          v-model:filter-category="filterCategory"
          v-model:filter-type="filterType"
          v-model:filter-compat="filterCompat"
          v-model:show-favorites-only="showFavoritesOnly"
          v-model:show-critical-only="showCriticalOnly"
          :active-chips="activeChips"
          :category-options="categoryOptions"
          :has-active-filters="hasActiveFilters"
          :module-count="filteredModules.length"
          :favorites-count="favorites.length"
          :critical-count="criticalCount"
          @toggle-chip="toggleChip"
          @reset="resetFilters"
        />

        <!-- Loading -->
        <div
          v-if="pending"
          class="text-center py-12"
        >
          <UIcon
            name="i-lucide-loader-2"
            class="w-8 h-8 animate-spin text-primary-500"
          />
        </div>

        <!-- Modules Grid -->
        <template v-else-if="filteredModules.length">
          <ModulesModuleList
            :modules="paginatedModules"
            :favorites="favorites"
            @toggle-favorite="toggleFavorite"
            @select="openModule"
          />

          <!-- Pagination -->
          <div
            v-if="totalPages > 1"
            class="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div class="text-sm text-neutral-500 dark:text-neutral-400">
              Showing {{ paginationStart }}-{{ paginationEnd }} of {{ filteredModules.length }} modules
            </div>
            <UPagination
              v-model:page="currentPage"
              :items-per-page="itemsPerPage"
              :total="filteredModules.length"
            />
          </div>
        </template>

        <!-- Empty (filters) -->
        <div
          v-else
          class="text-center py-12 text-neutral-600 dark:text-neutral-400"
        >
          No modules match your filters.
        </div>
      </template>

      <!-- No Data, no sync -->
      <div
        v-else
        class="text-center py-12 text-neutral-600 dark:text-neutral-400"
      >
        No modules available.
      </div>

      <!-- Detail Slideover -->
      <ModulesModuleDetailSlideover
        v-model:open="isSlideoverOpen"
        :module="selectedModule"
        :is-favorite="selectedModule ? favorites.includes(selectedModule.name) : false"
        @toggle-favorite="toggleFavorite"
      />

      <AppFooter />
    </div>
  </main>
</template>

<script setup lang="ts">
import type { ModuleData, SyncMeta } from '~~/shared/types/modules'

const { data: modules, pending } = await useFetch<ModuleData[]>('/api/modules')
const { data: syncStatus } = await useFetch<SyncMeta>('/api/sync', {
  server: false,
})

const { favorites, toggleFavorite } = useFavorites()

// Slideover
const selectedModule = ref<ModuleData | null>(null)
const isSlideoverOpen = ref(false)

function openModule(mod: ModuleData) {
  selectedModule.value = mod
  isSlideoverOpen.value = true
}

const {
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
} = useModuleFilters(modules, favorites)

// Pagination
const itemsPerPage = 12
const currentPage = ref(1)

const totalPages = computed(() => Math.ceil(filteredModules.value.length / itemsPerPage))

const paginatedModules = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredModules.value.slice(start, end)
})

const paginationStart = computed(() => {
  if (filteredModules.value.length === 0) return 0
  return (currentPage.value - 1) * itemsPerPage + 1
})

const paginationEnd = computed(() => {
  return Math.min(currentPage.value * itemsPerPage, filteredModules.value.length)
})

// Reset page when filters change
watch([search, sortBy, filterCategory, filterType, filterCompat, showFavoritesOnly, showCriticalOnly, activeChips], () => {
  currentPage.value = 1
})

// Refetch every 5s while syncing
const interval = setInterval(async () => {
  if (syncStatus.value?.isRunning) {
    await refreshNuxtData()
  }
}, 5000)

onUnmounted(() => clearInterval(interval))
</script>
