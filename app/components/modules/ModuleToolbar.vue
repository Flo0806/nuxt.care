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
import { sortOptions, typeOptions, compatOptions } from '~/composables/useModuleFilters'

defineProps<{
  search: string
  sortBy: string
  filterCategory: string
  filterType: string
  filterCompat: string
  showFavoritesOnly: boolean
  activeChips: Set<string>
  categoryOptions: Array<{ label: string, value: string, icon?: string }>
  hasActiveFilters: boolean
  moduleCount: number
  favoritesCount: number
}>()

defineEmits<{
  'update:search': [value: string]
  'update:sortBy': [value: string]
  'update:filterCategory': [value: string]
  'update:filterType': [value: string]
  'update:filterCompat': [value: string]
  'update:showFavoritesOnly': [value: boolean]
  'toggle-chip': [chipId: string]
  'reset': []
}>()
</script>
