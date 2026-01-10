<template>
  <div class="flex flex-col items-center justify-center py-16">
    <div class="w-full max-w-md">
      <!-- Icon + Title -->
      <div class="flex items-center justify-center gap-3 mb-6">
        <UIcon
          name="i-lucide-refresh-cw"
          class="w-6 h-6 text-primary-500 animate-spin"
        />
        <h2 class="text-lg font-semibold text-neutral-700 dark:text-neutral-300">
          Syncing Modules
        </h2>
      </div>

      <!-- Progress Bar -->
      <div class="mb-4">
        <div class="h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
          <div
            class="h-full bg-primary-500 transition-all duration-300 ease-out"
            :style="{ width: `${percentage}%` }"
          />
        </div>
      </div>

      <!-- Stats -->
      <div class="flex justify-between text-sm text-neutral-600 dark:text-neutral-400">
        <span>{{ syncStatus.syncedModules }} / {{ syncStatus.totalModules }} modules</span>
        <span>{{ percentage }}%</span>
      </div>

      <!-- Elapsed Time -->
      <p
        v-if="elapsed"
        class="text-center text-xs text-neutral-500 dark:text-neutral-500 mt-4"
      >
        Running for {{ elapsed }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SyncMeta } from '~~/shared/types/modules'

const props = defineProps<{
  syncStatus: SyncMeta
}>()

const percentage = computed(() => {
  if (!props.syncStatus.totalModules) return 0
  return Math.round((props.syncStatus.syncedModules / props.syncStatus.totalModules) * 100)
})

const elapsed = computed(() => {
  if (!props.syncStatus.startedAt) return null
  const started = new Date(props.syncStatus.startedAt).getTime()
  const now = Date.now()
  const seconds = Math.floor((now - started) / 1000)

  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
})
</script>
