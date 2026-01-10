<template>
  <div class="flex flex-wrap gap-1.5">
    <button
      v-for="chip in chipFilters"
      :key="chip.id"
      class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border transition-colors"
      :class="isActive(chip.id)
        ? 'bg-primary-100 dark:bg-primary-900 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300'
        : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600'"
      @click="toggle(chip.id)"
    >
      <UIcon
        :name="chip.icon"
        class="w-3 h-3"
      />
      <span>{{ chip.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { chipFilters } from '~/composables/useModuleFilters'

const props = defineProps<{
  activeChips: Set<string>
}>()

const emit = defineEmits<{
  toggle: [chipId: string]
}>()

function isActive(chipId: string): boolean {
  return props.activeChips.has(chipId)
}

function toggle(chipId: string) {
  emit('toggle', chipId)
}
</script>
