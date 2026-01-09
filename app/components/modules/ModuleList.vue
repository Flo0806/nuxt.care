<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    <ModulesModuleCard
      v-for="mod in modules"
      :key="mod.name"
      :module="mod"
      :is-favorite="favorites.includes(mod.name)"
      @toggle-favorite="$emit('toggle-favorite', mod.name)"
    />
  </div>
</template>

<script setup lang="ts">
import type { ModuleData } from '~~/shared/types/modules'

defineProps<{
  modules: ModuleData[]
  favorites: string[]
}>()

defineEmits<{
  'toggle-favorite': [moduleName: string]
}>()
</script>
