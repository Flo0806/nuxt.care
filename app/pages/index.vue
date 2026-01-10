<template>
  <main class="min-h-screen bg-neutral-50 dark:bg-neutral-950">
    <div class="container mx-auto px-4 py-8">
      <AppHeader :sync-status="syncStatus" />

      <ModulesModuleToolbar
        v-model:search="search"
        v-model:sort-by="sortBy"
        v-model:filter-category="filterCategory"
        v-model:filter-type="filterType"
        v-model:filter-compat="filterCompat"
        v-model:show-favorites-only="showFavoritesOnly"
        :category-options="categoryOptions"
        :has-active-filters="hasActiveFilters"
        :module-count="filteredModules.length"
        :favorites-count="favorites.length"
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
      <ModulesModuleList
        v-else-if="filteredModules.length"
        :modules="filteredModules"
        :favorites="favorites"
        @toggle-favorite="toggleFavorite"
        @select="openModule"
      />

      <!-- Empty -->
      <div
        v-else-if="modules?.length"
        class="text-center py-12 text-neutral-600 dark:text-neutral-400"
      >
        No modules match your filters.
      </div>

      <!-- No Data -->
      <div
        v-else
        class="text-center py-12 text-neutral-600 dark:text-neutral-400"
      >
        No modules yet. Sync running...
      </div>

      <!-- Detail Slideover -->
      <ModulesModuleDetailSlideover
        v-model:open="isSlideoverOpen"
        :module="selectedModule"
        :is-favorite="selectedModule ? favorites.includes(selectedModule.name) : false"
        @toggle-favorite="toggleFavorite"
      />
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
  categoryOptions,
  hasActiveFilters,
  resetFilters,
  filteredModules,
} = useModuleFilters(modules, favorites)

// Refetch every 5s while syncing
const interval = setInterval(async () => {
  if (syncStatus.value?.isRunning) {
    await refreshNuxtData()
  }
}, 5000)

onUnmounted(() => clearInterval(interval))
</script>
