<template>
  <div class="rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-950/20 p-6 mb-6">
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h2 class="text-lg font-bold text-neutral-900 dark:text-white mb-1">
          Your modules
        </h2>
        <p class="text-sm text-neutral-600 dark:text-neutral-400">
          <template v-if="ownedCount > 0">
            You maintain <span class="font-semibold text-neutral-900 dark:text-white">{{ ownedCount }}</span> module{{ ownedCount === 1 ? '' : 's' }}<span v-if="contributorCount">
              and contribute to <span class="font-semibold text-neutral-900 dark:text-white">{{ contributorCount }}</span> more</span>.
          </template>
          <template v-else>
            You contribute to <span class="font-semibold text-neutral-900 dark:text-white">{{ contributorCount }}</span> module{{ contributorCount === 1 ? '' : 's' }}.
          </template>
        </p>
      </div>
      <div class="flex items-center gap-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-neutral-900 dark:text-white tabular-nums">
            {{ avgScore }}
          </div>
          <div class="text-xs text-neutral-500 uppercase tracking-wider">
            Ø Score
          </div>
        </div>
        <UIcon
          v-if="potentialAvg > avgScore"
          name="i-lucide-arrow-right"
          class="w-5 h-5 text-neutral-400"
        />
        <div
          v-if="potentialAvg > avgScore"
          class="text-center"
        >
          <div class="text-2xl font-bold text-primary-500 tabular-nums">
            {{ potentialAvg }}
          </div>
          <div class="text-xs text-primary-600 dark:text-primary-400 uppercase tracking-wider">
            Potential
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-2 mt-4 pt-4 border-t border-primary-200 dark:border-primary-800">
      <UButton
        :to="blueskyUrl"
        target="_blank"
        color="neutral"
        variant="ghost"
        size="xs"
        icon="i-simple-icons-bluesky"
      >
        Share on Bluesky
      </UButton>
      <UButton
        color="neutral"
        variant="ghost"
        size="xs"
        :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
        @click="copyShareText"
      >
        {{ copied ? 'Copied' : 'Copy' }}
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MaintainerModule } from '~/composables/useMaintainerModules'

const props = defineProps<{
  entries: MaintainerModule[]
}>()

const ownedCount = computed(() => props.entries.filter(e => e.role === 'owner').length)
const contributorCount = computed(() => props.entries.filter(e => e.role === 'contributor').length)

const avgScore = computed(() => {
  if (!props.entries.length) return 0
  const sum = props.entries.reduce((s, e) => s + (e.module.health?.score ?? 0), 0)
  return Math.round(sum / props.entries.length)
})

const potentialAvg = computed(() => {
  if (!props.entries.length) return 0
  const sum = props.entries.reduce((s, e) => s + potentialScore(e.module), 0)
  return Math.round(sum / props.entries.length)
})

const shareText = computed(() => {
  const moduleCount = props.entries.length
  const moduleWord = moduleCount === 1 ? 'Nuxt module' : 'Nuxt modules'
  return `I'm maintaining ${moduleCount} ${moduleWord} at ${avgScore.value}/100 avg on nuxt.care.`
})

const blueskyUrl = computed(() =>
  `https://bsky.app/intent/compose?text=${encodeURIComponent(`${shareText.value} https://nuxt.care`)}`,
)

const copied = ref(false)
async function copyShareText() {
  try {
    await navigator.clipboard.writeText(`${shareText.value} https://nuxt.care`)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
  catch { /* ignore */ }
}
</script>
