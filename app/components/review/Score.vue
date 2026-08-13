<template>
  <div>
    <div class="flex items-center gap-4">
      <div
        class="flex flex-col items-center justify-center w-20 h-20 rounded-xl shrink-0"
        :class="toneClass"
      >
        <span class="text-2xl font-bold leading-none">{{ analysis.score }}</span>
        <span class="text-[10px] uppercase tracking-wide opacity-70 mt-1">of 100</span>
      </div>

      <div class="min-w-0">
        <p class="text-sm font-medium text-neutral-900 dark:text-white capitalize">
          {{ status }}
        </p>
        <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          Scored like a listed module, so this is what it would show in the
          registry today.
        </p>
        <p class="text-xs text-neutral-400 mt-1">
          analysed {{ formatRelative(analysis.analysedAt) }}
        </p>
      </div>
    </div>

    <ul class="mt-4 space-y-1">
      <li
        v-for="signal in scored"
        :key="signal.key"
        class="flex items-center gap-2 text-sm"
      >
        <UIcon
          :name="signalIcon(signal)"
          class="w-4 h-4 shrink-0"
          :class="signalTone(signal)"
        />
        <span
          class="flex-1 min-w-0 truncate"
          :class="signal.type === 'info' ? 'text-neutral-400' : 'text-neutral-600 dark:text-neutral-400'"
        >{{ signal.msg }}</span>
        <span
          class="text-xs tabular-nums shrink-0 text-neutral-400"
        >
          {{ signal.points }}/{{ signal.maxPoints }}
        </span>
      </li>
    </ul>

    <ul
      v-if="notes.length"
      class="mt-2 space-y-1"
    >
      <li
        v-for="signal in notes"
        :key="signal.key"
        class="flex items-center gap-2 text-xs text-neutral-400"
      >
        <UIcon
          name="i-lucide-info"
          class="w-3.5 h-3.5 shrink-0"
        />
        {{ signal.msg }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
// The score of a submission, with the reasons for it.
//
// The number alone is what a listed module needs, because there the question
// is "how is it doing". For a submission the question is "what would this cost
// once it is in", and the answer is the breakdown, so that gets the room.

const props = defineProps<{
  analysis: ReviewAnalysis
}>()

const status = computed(() => scoreToStatus(props.analysis.score))

/**
 * Signals that carry points, real shortfalls first and unknowns last.
 *
 * An `info` signal means the criterion could not be established, which is not
 * the same as failing it. Ranking those with the actual defects would push the
 * gaps in our own data to the top and read like a verdict on the module.
 */
const scored = computed(() =>
  [...props.analysis.signals]
    .filter(signal => signal.maxPoints > 0)
    .sort((a, b) => {
      const unknown = Number(a.type === 'info') - Number(b.type === 'info')
      if (unknown) return unknown
      return (b.maxPoints - b.points) - (a.maxPoints - a.points)
    }))

/** Penalties and pure information carry no maximum. */
const notes = computed(() =>
  props.analysis.signals.filter(signal => signal.maxPoints === 0))

const toneClass = computed(() => {
  const score = props.analysis.score
  if (score >= 90) return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
  if (score >= 70) return 'bg-lime-100 text-lime-700 dark:bg-lime-900/50 dark:text-lime-300'
  if (score >= 40) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
  return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
})

// Colour follows the signal's own type, never the points. Zero points can mean
// "failed" or "could not be established", and calling the second one a defect
// blames the module for a gap in our data.
function signalIcon(signal: HealthSignal): string {
  switch (signal.type) {
    case 'positive':
      return 'i-lucide-circle-check'
    case 'negative':
      return 'i-lucide-circle-x'
    case 'warning':
      return 'i-lucide-circle-alert'
    default:
      return 'i-lucide-circle-help'
  }
}

function signalTone(signal: HealthSignal): string {
  switch (signal.type) {
    case 'positive':
      return 'text-green-600 dark:text-green-400'
    case 'negative':
      return 'text-red-600 dark:text-red-400'
    case 'warning':
      return 'text-amber-600 dark:text-amber-400'
    default:
      return 'text-neutral-400'
  }
}
</script>
