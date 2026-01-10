<template>
  <UPopover
    v-if="signals?.length"
    mode="hover"
    :ui="{ content: 'p-0' }"
  >
    <span
      class="text-xs font-bold px-1.5 py-0.5 rounded cursor-help"
      :class="colorClass"
    >
      {{ score }}
    </span>
    <template #content>
      <div class="p-3 text-xs w-80">
        <!-- Header with score -->
        <div class="flex items-center justify-between mb-3 pb-2 border-b border-neutral-700">
          <span class="font-semibold text-neutral-200">Health Check</span>
          <span
            class="font-bold text-lg"
            :class="[
              score >= 70 ? 'text-green-400'
              : score >= 40 ? 'text-yellow-400' : 'text-red-400',
            ]"
          >
            {{ score }}%
          </span>
        </div>

        <!-- Checklist with points -->
        <div class="space-y-1.5">
          <div
            v-for="(signal, i) in signals"
            :key="i"
            class="flex items-center gap-2"
          >
            <span
              class="shrink-0 w-4 text-center"
              :class="signalColor(signal.type)"
            >
              {{ signalIcon(signal.type) }}
            </span>
            <span
              class="flex-1"
              :class="signal.type === 'positive' ? 'text-neutral-200' : 'text-neutral-400'"
            >
              {{ signal.msg }}
            </span>
            <span
              class="shrink-0 font-mono tabular-nums"
              :class="signal.type === 'positive' ? 'text-green-400' : 'text-neutral-500'"
            >
              {{ signal.points }}/{{ signal.maxPoints || signal.points }}
            </span>
          </div>
        </div>

        <!-- Summary -->
        <div class="mt-3 pt-2 border-t border-neutral-700 flex justify-between">
          <span class="text-neutral-400">{{ passedCount }}/{{ signals?.length || 0 }} checks passed</span>
          <span
            class="font-bold"
            :class="[
              score >= 70 ? 'text-green-400'
              : score >= 40 ? 'text-yellow-400' : 'text-red-400',
            ]"
          >
            {{ score }}/100
          </span>
        </div>
      </div>
    </template>
  </UPopover>
  <span
    v-else
    class="text-xs font-bold px-1.5 py-0.5 rounded"
    :class="colorClass"
  >
    {{ score }}
  </span>
</template>

<script setup lang="ts">
import type { HealthSignal } from '~~/shared/types/modules'

const props = defineProps<{
  score: number
  signals?: HealthSignal[]
}>()

const colorClass = computed(() => {
  if (props.score >= 70) {
    return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
  }
  if (props.score >= 40) {
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
  }
  return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
})

const passedCount = computed(() => {
  if (!props.signals) return 0
  return props.signals.filter(s => s.type === 'positive').length
})

function signalIcon(type: string): string {
  if (type === 'positive') return '✓'
  if (type === 'warning') return '○'
  return '✗'
}

function signalColor(type: string): string {
  if (type === 'positive') return 'text-green-400'
  if (type === 'warning') return 'text-yellow-400'
  return 'text-red-400'
}
</script>
