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

    <!-- Meta: Category + Version + TS -->
    <div class="flex items-center justify-between text-xs mb-3">
      <div class="flex items-center gap-1.5">
        <UIcon
          :name="categoryConfig.icon"
          class="w-3.5 h-3.5"
          :class="`text-${categoryConfig.color}-500`"
        />
        <span class="text-neutral-600 dark:text-neutral-400">{{ module.category }}</span>
      </div>
      <div class="flex items-center gap-1.5">
        <UTooltip
          v-if="module.npm?.hasTypes"
          text="TypeScript types included"
        >
          <span class="px-1 py-0.5 text-[10px] font-semibold rounded bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
            TS
          </span>
        </UTooltip>
        <span
          v-if="module.npm?.latestVersion"
          class="text-neutral-400"
        >
          v{{ module.npm.latestVersion }}
        </span>
      </div>
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

      <!-- Package Size -->
      <UTooltip :text="sizeTooltip">
        <div class="text-center cursor-help">
          <div class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            {{ sizeLabel }}
          </div>
          <div class="text-[10px] text-neutral-400 uppercase tracking-wide">
            Size
          </div>
        </div>
      </UTooltip>
    </div>

    <!-- Quality Row: Tests/Coverage, CI, Pending -->
    <div class="flex items-center justify-around mb-4 py-2 px-3 rounded-md bg-neutral-50 dark:bg-neutral-800/50">
      <!-- Tests -->
      <UTooltip :text="testsTooltip">
        <div class="flex items-center gap-1.5 cursor-help">
          <UIcon
            :name="hasTests ? 'i-lucide-check-circle' : 'i-lucide-x-circle'"
            class="w-4 h-4"
            :class="hasTests ? 'text-green-600' : 'text-red-600'"
          />
          <span class="text-xs font-medium text-neutral-700 dark:text-neutral-300">
            Tests
          </span>
        </div>
      </UTooltip>

      <!-- CI Status -->
      <UTooltip :text="ciTooltip">
        <div class="flex items-center gap-1.5 cursor-help">
          <UIcon
            :name="ciIcon"
            class="w-4 h-4"
            :class="ciIconColor"
          />
          <span class="text-xs font-medium text-neutral-700 dark:text-neutral-300">
            CI
          </span>
        </div>
      </UTooltip>

      <!-- Pending Commits -->
      <UPopover mode="hover">
        <div class="flex items-center gap-1.5 cursor-help">
          <span
            class="text-xs font-bold min-w-5 text-center"
            :class="pendingIconColor"
          >
            {{ pendingLabel }}
          </span>
          <span class="text-xs font-medium text-neutral-700 dark:text-neutral-300">
            Pending
          </span>
        </div>
        <template #content>
          <div class="p-3 max-w-xs">
            <template v-if="!pendingCommits">
              <p class="text-sm text-neutral-500">
                No release data
              </p>
            </template>
            <template v-else-if="pendingCommits.nonChore === 0">
              <p class="text-sm text-green-700 dark:text-green-400">
                No unreleased changes
              </p>
            </template>
            <template v-else>
              <p class="text-sm font-medium mb-2">
                <span class="text-orange-700 dark:text-orange-400">{{ pendingCommits.nonChore }}</span>
                <span class="text-neutral-500"> of {{ pendingCommits.total }} commits unreleased</span>
              </p>
              <ul class="space-y-1">
                <li
                  v-for="commit in pendingCommits.commits.slice(0, 5)"
                  :key="commit.sha"
                  class="text-xs flex gap-2"
                >
                  <code class="text-neutral-400 shrink-0">{{ commit.sha }}</code>
                  <span class="text-neutral-600 dark:text-neutral-300 truncate">{{ commit.message }}</span>
                </li>
              </ul>
              <p
                v-if="pendingCommits.nonChore > 5"
                class="text-xs text-neutral-400 mt-1"
              >
                +{{ pendingCommits.nonChore - 5 }} more...
              </p>
            </template>
          </div>
        </template>
      </UPopover>
    </div>

    <!-- Spacer -->
    <div class="grow" />

    <!-- Footer: Links + License + Badges -->
    <div class="flex items-center justify-between gap-2">
      <!-- Quick Links + License -->
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-1">
          <UTooltip text="Open on GitHub">
            <a
              :href="`https://github.com/${module.repo}`"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="`Open ${module.name} on GitHub`"
              class="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
              @click.stop
            >
              <UIcon
                name="i-lucide-github"
                class="w-4 h-4"
              />
            </a>
          </UTooltip>
          <UTooltip text="Open on npm">
            <a
              :href="`https://www.npmjs.com/package/${module.npmPackage}`"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="`Open ${module.name} on npm`"
              class="text-neutral-400 hover:text-red-500 transition-colors"
              @click.stop
            >
              <UIcon
                name="i-lucide-package"
                class="w-4 h-4"
              />
            </a>
          </UTooltip>
        </div>
        <span
          v-if="module.github?.license"
          class="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
        >
          {{ module.github.license }}
        </span>
      </div>

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
const props = defineProps<{
  module: ModuleData
  isFavorite: boolean
}>()

defineEmits<{
  'toggle-favorite': []
  'select': []
}>()

const categoryConfig = computed(() => getCategoryConfig(props.module.category))

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
  if (days < 30) return 'text-green-700 dark:text-green-400'
  if (days < 180) return 'text-neutral-800 dark:text-neutral-200'
  if (days < 365) return 'text-yellow-700 dark:text-yellow-400'
  return 'text-red-700 dark:text-red-400'
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
  if (v.count === 0) return 'text-green-700 dark:text-green-400'
  if (v.critical > 0) return 'text-red-700 dark:text-red-400'
  if (v.high > 0) return 'text-orange-700 dark:text-orange-400'
  return 'text-yellow-700 dark:text-yellow-400'
})

const sizeLabel = computed(() => {
  const size = props.module.npm?.unpackedSize
  if (!size) return '-'
  return formatBytes(size)
})

const sizeTooltip = computed(() => {
  const size = props.module.npm?.unpackedSize
  if (!size) return 'Package size not available'
  return `${formatBytes(size)} unpacked (node_modules)`
})

// Tests
const hasTests = computed(() => props.module.npm?.hasTests ?? false)
const testsTooltip = computed(() => {
  return hasTests.value
    ? 'Test script found in package.json'
    : 'No test script found'
})

// CI Status
const ciStatus = computed(() => props.module.ciStatus)
const ciIcon = computed(() => {
  if (!ciStatus.value?.hasCI) return 'i-lucide-circle-dashed'
  if (ciStatus.value.lastRunConclusion === 'success') return 'i-lucide-check-circle'
  if (ciStatus.value.lastRunConclusion === 'failure') return 'i-lucide-x-circle'
  return 'i-lucide-circle-dashed'
})
const ciIconColor = computed(() => {
  if (!ciStatus.value?.hasCI) return 'text-neutral-400'
  if (ciStatus.value.lastRunConclusion === 'success') return 'text-green-600'
  if (ciStatus.value.lastRunConclusion === 'failure') return 'text-red-600'
  return 'text-yellow-600'
})
const ciTooltip = computed(() => {
  if (!ciStatus.value?.hasCI) return 'No CI/GitHub Actions found'
  const status = ciStatus.value.lastRunConclusion === 'success' ? 'passing' : ciStatus.value.lastRunConclusion === 'failure' ? 'failing' : 'unknown'
  return `CI ${status} (${ciStatus.value.workflowName})`
})

// Pending Commits
const pendingCommits = computed(() => props.module.pendingCommits)
const pendingLabel = computed(() => {
  if (!pendingCommits.value) return '-'
  return String(pendingCommits.value.nonChore)
})
const pendingIconColor = computed(() => {
  if (!pendingCommits.value) return 'text-neutral-400'
  if (pendingCommits.value.nonChore === 0) return 'text-green-600'
  if (pendingCommits.value.nonChore <= 3) return 'text-yellow-600'
  return 'text-orange-600'
})

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

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
