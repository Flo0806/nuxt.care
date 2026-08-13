<template>
  <div class="flex items-center gap-3 px-4 py-3 mb-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
    <UIcon
      name="i-lucide-refresh-cw"
      class="w-4 h-4 text-primary-500 animate-spin shrink-0"
    />

    <div class="flex-1 min-w-0">
      <div class="flex items-baseline justify-between gap-3 mb-1.5">
        <span class="text-sm text-neutral-700 dark:text-neutral-300">{{ label }}</span>
        <span class="text-xs text-neutral-500 tabular-nums shrink-0">
          {{ meta.processed }} / {{ meta.totalPrs }}
          <span
            v-if="elapsed"
            class="text-neutral-400 ml-2"
          >{{ elapsed }}</span>
        </span>
      </div>

      <div class="h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
        <div
          class="h-full bg-primary-500 transition-all duration-300 ease-out"
          :style="{ width: `${percentage}%` }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Shown while a run is filling the cache.
//
// The list stays visible underneath: a run replaces the entries only at the
// very end, so what is on screen is the last complete state, not a half
// finished one.

const props = defineProps<{
  meta: ReviewSyncMeta
}>()

const label = computed(() =>
  props.meta.phase === 'files'
    ? 'Reading submitted files'
    : props.meta.phase === 'details'
      ? 'Reading npm, checks and comments'
      : 'Updating submissions')

const percentage = computed(() => {
  if (!props.meta.totalPrs) return 0
  return Math.round((props.meta.processed / props.meta.totalPrs) * 100)
})

/** Ticks on its own so the time keeps moving between polls. */
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const elapsed = computed(() => {
  if (!props.meta.startedAt) return null

  const seconds = Math.max(0, Math.floor((now.value - new Date(props.meta.startedAt).getTime()) / 1000))
  if (seconds < 60) return `${seconds}s`

  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
})
</script>
