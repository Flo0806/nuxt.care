<template>
  <div>
    <!-- Search + Sort + Count -->
    <div class="flex flex-col md:flex-row gap-4 mb-4">
      <UInput
        :model-value="search"
        placeholder="Search modules..."
        icon="i-lucide-search"
        class="flex-1"
        @update:model-value="$emit('update:search', $event)"
      />
      <div class="flex items-center gap-3">
        <USelectMenu
          :model-value="sortBy"
          :items="sortOptions"
          value-key="value"
          class="w-40"
          @update:model-value="$emit('update:sortBy', $event)"
        />
        <span class="text-sm text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
          {{ moduleCount }} modules
        </span>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-2 mb-6">
      <USelectMenu
        :model-value="filterCategory"
        :items="categoryOptions"
        value-key="value"
        placeholder="Category"
        class="w-36"
        @update:model-value="$emit('update:filterCategory', $event)"
      />

      <USelectMenu
        :model-value="filterType"
        :items="typeOptions"
        value-key="value"
        placeholder="Type"
        class="w-36"
        @update:model-value="$emit('update:filterType', $event)"
      />

      <USelectMenu
        :model-value="filterCompat"
        :items="compatOptions"
        value-key="value"
        placeholder="Compatibility"
        class="w-40"
        @update:model-value="$emit('update:filterCompat', $event)"
      />

      <!-- Maintainer/Org Filter -->
      <USelectMenu
        :model-value="filterMaintainer"
        :items="maintainerOptions"
        value-key="value"
        searchable
        searchable-placeholder="Search owner..."
        class="w-48"
        @update:model-value="$emit('update:filterMaintainer', $event)"
      />

      <UButton
        :color="showCriticalOnly ? 'error' : 'neutral'"
        :variant="showCriticalOnly ? 'soft' : 'ghost'"
        size="sm"
        @click="$emit('update:showCriticalOnly', !showCriticalOnly)"
      >
        <UIcon
          name="i-lucide-alert-triangle"
          class="w-4 h-4"
        />
        Critical
        <UBadge
          v-if="criticalCount"
          color="error"
          variant="subtle"
          size="xs"
        >
          {{ criticalCount }}
        </UBadge>
      </UButton>

      <UButton
        :color="showFavoritesOnly ? 'primary' : 'neutral'"
        :variant="showFavoritesOnly ? 'soft' : 'ghost'"
        size="sm"
        @click="$emit('update:showFavoritesOnly', !showFavoritesOnly)"
      >
        <UIcon
          name="i-lucide-heart"
          class="w-4 h-4"
        />
        Favorites
        <UBadge
          v-if="favoritesCount"
          color="primary"
          variant="subtle"
          size="xs"
        >
          {{ favoritesCount }}
        </UBadge>
      </UButton>

      <UButton
        v-if="isLoggedIn"
        :color="showStarsOnly ? 'primary' : 'neutral'"
        :variant="showStarsOnly ? 'soft' : 'ghost'"
        size="sm"
        @click="$emit('update:showStarsOnly', !showStarsOnly)"
      >
        <UIcon
          name="i-lucide-star"
          class="w-4 h-4"
        />
        Stars
        <UBadge
          v-if="starsCount"
          color="primary"
          variant="subtle"
          size="xs"
        >
          {{ starsCount }}
        </UBadge>
      </UButton>

      <UButton
        v-if="hasActiveFilters"
        color="neutral"
        variant="ghost"
        size="sm"
        @click="$emit('reset')"
      >
        Reset
      </UButton>
    </div>

    <!-- Chip Filters -->
    <ModulesFilterChips
      :active-chips="activeChips"
      class="mb-4"
      @toggle="$emit('toggle-chip', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { sortOptions } from '~/composables/useModuleFilters'

defineProps<{
  search: string
  sortBy: string
  filterCategory: string
  filterType: string
  filterCompat: string
  filterMaintainer: string
  showFavoritesOnly: boolean
  showStarsOnly: boolean
  showCriticalOnly: boolean
  activeChips: Set<string>
  categoryOptions: Array<{ label: string, value: string, icon?: string }>
  typeOptions: Array<{ label: string, value: string }>
  compatOptions: Array<{ label: string, value: string }>
  maintainerOptions: Array<{ label: string, value: string }>
  hasActiveFilters: boolean
  moduleCount: number
  favoritesCount: number
  starsCount: number
  criticalCount: number
  isLoggedIn: boolean
}>()

defineEmits<{
  'update:search': [value: string]
  'update:sortBy': [value: string]
  'update:filterCategory': [value: string]
  'update:filterType': [value: string]
  'update:filterCompat': [value: string]
  'update:filterMaintainer': [value: string]
  'update:showFavoritesOnly': [value: boolean]
  'update:showStarsOnly': [value: boolean]
  'update:showCriticalOnly': [value: boolean]
  'toggle-chip': [chipId: string]
  'reset': []
}>()
</script>
