<template>
  <article
    class="h-full flex flex-col p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 cursor-pointer hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
    @click="$emit('select')"
  >
    <!-- Header: Favorite + Name + Score -->
    <div class="flex items-center gap-2 mb-2">
      <button
        :aria-label="isFavorite ? 'Remove from favorites' : 'Add to favorites'"
        class="shrink-0 text-neutral-400 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400 transition-colors"
        :class="{ 'text-red-500 dark:text-red-400': isFavorite }"
        @click.stop="$emit('toggle-favorite')"
      >
        <UIcon
          :name="isFavorite ? 'i-lucide-heart' : 'i-lucide-heart'"
          class="w-4 h-4"
          :class="{ 'fill-current': isFavorite }"
        />
      </button>
      <span class="text-base font-bold text-neutral-900 dark:text-white truncate flex-1">
        {{ module.name }}
      </span>
      <ModulesScoreBadge
        :score="module.health.score"
        :signals="module.health.signals"
      />
    </div>

    <!-- Divider -->
    <div class="border-b border-neutral-100 dark:border-neutral-800 mb-3" />

    <!-- Meta: Category + Version -->
    <div class="flex items-center justify-between text-xs text-neutral-400 mb-3">
      <span>{{ module.category }}</span>
      <span v-if="module.npm?.latestVersion">
        v{{ module.npm.latestVersion }}
      </span>
    </div>

    <!-- Stats Row -->
    <div class="flex items-center justify-between mb-4">
      <!-- Downloads -->
      <UTooltip text="npm Downloads">
        <div class="text-center cursor-help">
          <div class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            {{ formatNumber(module.nuxtApiStats?.downloads) }}
          </div>
          <div class="text-[10px] text-neutral-400 uppercase tracking-wide">
            DL
          </div>
        </div>
      </UTooltip>

      <!-- Stars -->
      <UTooltip text="GitHub Stars">
        <div class="text-center cursor-help">
          <div class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            {{ formatNumber(module.github?.stars) }}
          </div>
          <div class="text-[10px] text-neutral-400 uppercase tracking-wide">
            Stars
          </div>
        </div>
      </UTooltip>

      <!-- Contributors -->
      <UTooltip text="Active contributors (last year)">
        <div class="text-center cursor-help">
          <div class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            {{ module.contributors?.uniqueContributors ?? '-' }}
          </div>
          <div class="text-[10px] text-neutral-400 uppercase tracking-wide">
            Devs
          </div>
        </div>
      </UTooltip>

      <!-- Activity -->
      <UTooltip :text="activityTooltip">
        <div class="text-center cursor-help">
          <div
            class="text-sm font-semibold"
            :class="activityColor"
          >
            {{ activityLabel }}
          </div>
          <div class="text-[10px] text-neutral-400 uppercase tracking-wide">
            Active
          </div>
        </div>
      </UTooltip>

      <!-- Vulnerabilities -->
      <UTooltip :text="vulnTooltip">
        <div class="text-center cursor-help">
          <div
            class="text-sm font-semibold"
            :class="vulnColor"
          >
            {{ vulnLabel }}
          </div>
          <div class="text-[10px] text-neutral-400 uppercase tracking-wide">
            Vulns
          </div>
        </div>
      </UTooltip>
    </div>

    <!-- Spacer -->
    <div class="grow" />

    <!-- Footer: License + Badges -->
    <div class="flex items-center justify-between gap-2">
      <!-- License -->
      <span
        v-if="module.github?.license"
        class="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
      >
        {{ module.github.license }}
      </span>
      <span v-else />

      <!-- Status Badges (fixed order) -->
      <div class="flex flex-wrap justify-end gap-1">
        <UBadge
          v-for="badge in badges"
          :key="badge.label"
          :color="badge.color"
          variant="subtle"
          size="xs"
        >
          {{ badge.label }}
        </UBadge>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { ModuleData } from '~~/shared/types/modules'

const props = defineProps<{
  module: ModuleData
  isFavorite: boolean
}>()

defineEmits<{
  'toggle-favorite': []
  'select': []
}>()

const daysSincePush = computed(() => {
  if (!props.module.github?.pushedAt) return null
  const pushed = new Date(props.module.github.pushedAt)
  return Math.floor((Date.now() - pushed.getTime()) / (1000 * 60 * 60 * 24))
})

const activityLabel = computed(() => {
  const days = daysSincePush.value
  if (days === null) return '-'
  if (days < 7) return 'Now'
  if (days < 30) return `${days}d`
  if (days < 365) return `${Math.floor(days / 30)}mo`
  return `${Math.floor(days / 365)}y`
})

const activityTooltip = computed(() => {
  if (!props.module.github?.pushedAt) return 'Last commit unknown'
  const date = new Date(props.module.github.pushedAt)
  return `Last commit: ${date.toLocaleDateString()}`
})

const activityColor = computed(() => {
  const days = daysSincePush.value
  if (days === null) return 'text-neutral-800 dark:text-neutral-200'
  if (days < 30) return 'text-green-600 dark:text-green-400'
  if (days < 180) return 'text-neutral-800 dark:text-neutral-200'
  if (days < 365) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
})

const vulnLabel = computed(() => {
  const v = props.module.vulnerabilities
  if (!v) return '-'
  if (v.count === 0) return '0'
  return String(v.count)
})

const vulnTooltip = computed(() => {
  const v = props.module.vulnerabilities
  if (!v) return 'No vulnerability data'
  if (v.count === 0) return 'No known vulnerabilities'
  const parts: string[] = []
  if (v.critical > 0) parts.push(`${v.critical} critical`)
  if (v.high > 0) parts.push(`${v.high} high`)
  if (v.medium > 0) parts.push(`${v.medium} medium`)
  if (v.low > 0) parts.push(`${v.low} low`)
  return `${v.count} vulnerabilities: ${parts.join(', ')}`
})

const vulnColor = computed(() => {
  const v = props.module.vulnerabilities
  if (!v) return 'text-neutral-800 dark:text-neutral-200'
  if (v.count === 0) return 'text-green-600 dark:text-green-400'
  if (v.critical > 0) return 'text-red-600 dark:text-red-400'
  if (v.high > 0) return 'text-orange-600 dark:text-orange-400'
  return 'text-yellow-600 dark:text-yellow-400'
})

const isStale = computed(() => {
  const days = daysSincePush.value
  return days !== null && days > 180 && days < 365
})

const compatStatus = computed((): 'nuxt4' | 'nuxt3' | 'unknown' => {
  const hasNuxt4 = props.module.nuxtApiCompat?.supports4
    || props.module.topics?.hasNuxt4
    || props.module.keywords?.hasNuxt4
  if (hasNuxt4) return 'nuxt4'

  const hasNuxt3 = props.module.nuxtApiCompat?.supports3
    || props.module.topics?.hasNuxt3
    || props.module.keywords?.hasNuxt3
  if (hasNuxt3) return 'nuxt3'

  return 'unknown'
})

const badges = computed(() => {
  const list: Array<{ label: string, color: string }> = []

  // Type
  if (props.module.type === 'official') {
    list.push({ label: 'Official', color: 'primary' })
  }

  // Compat
  if (compatStatus.value === 'nuxt4') {
    list.push({ label: 'Nuxt 4', color: 'success' })
  }
  else if (compatStatus.value === 'nuxt3') {
    list.push({ label: 'Nuxt 3', color: 'info' })
  }
  else {
    list.push({ label: 'Compat?', color: 'neutral' })
  }

  // Warnings
  if (isStale.value) {
    list.push({ label: 'Stale', color: 'warning' })
  }
  if (props.module.github?.archived) {
    list.push({ label: 'Archived', color: 'error' })
  }
  if (props.module.npm?.deprecated) {
    list.push({ label: 'Deprecated', color: 'error' })
  }

  // Vulnerabilities
  const v = props.module.vulnerabilities
  if (v && v.critical > 0) {
    list.push({ label: `${v.critical} Critical`, color: 'error' })
  }
  else if (v && v.high > 0) {
    list.push({ label: `${v.high} High`, color: 'warning' })
  }

  return list
})

function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) return '-'
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`
  return String(num)
}
</script>
