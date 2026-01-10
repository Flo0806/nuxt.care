<template>
  <USlideover
    v-model:open="isOpen"
    :title="module?.name || 'Module Details'"
    :description="module?.description || 'Module information'"
    :ui="{ width: 'max-w-lg' }"
  >
    <template #content>
      <div
        v-if="module"
        class="flex flex-col h-full"
      >
        <!-- Header -->
        <div class="p-6 border-b border-neutral-200 dark:border-neutral-800">
          <div class="flex items-start justify-between gap-4 mb-2">
            <div class="flex items-center gap-3">
              <button
                :aria-label="isFavorite ? 'Remove from favorites' : 'Add to favorites'"
                class="text-neutral-400 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400 transition-colors"
                :class="{ 'text-red-500 dark:text-red-400': isFavorite }"
                @click="$emit('toggle-favorite', module.name)"
              >
                <UIcon
                  name="i-lucide-heart"
                  class="w-5 h-5"
                  :class="{ 'fill-current': isFavorite }"
                />
              </button>
              <h2 class="text-xl font-bold text-neutral-900 dark:text-white">
                {{ module.name }}
              </h2>
            </div>
            <ModulesScoreBadge
              :score="module.health.score"
              :signals="module.health.signals"
              class="text-sm"
            />
          </div>
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            {{ module.description }}
          </p>
          <div class="flex items-center gap-2 mt-3 text-xs text-neutral-500">
            <span>{{ module.category }}</span>
            <span>•</span>
            <span>{{ module.type }}</span>
            <span
              v-if="module.npm?.latestVersion"
            >• v{{ module.npm.latestVersion }}</span>
            <span v-if="module.github?.license">• {{ module.github.license }}</span>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-4">
          <!-- Quick Stats -->
          <div class="grid grid-cols-4 gap-4 p-4 rounded-lg bg-neutral-100 dark:bg-neutral-800">
            <div class="text-center">
              <div class="text-lg font-bold text-neutral-900 dark:text-white">
                {{ formatNumber(module.nuxtApiStats?.downloads) }}
              </div>
              <div class="text-xs text-neutral-500">
                Downloads
              </div>
            </div>
            <div class="text-center">
              <div class="text-lg font-bold text-neutral-900 dark:text-white">
                {{ formatNumber(module.github?.stars) }}
              </div>
              <div class="text-xs text-neutral-500">
                Stars
              </div>
            </div>
            <div class="text-center">
              <div class="text-lg font-bold text-neutral-900 dark:text-white">
                {{ module.contributors?.uniqueContributors ?? '-' }}
              </div>
              <div class="text-xs text-neutral-500">
                Contributors
              </div>
            </div>
            <div class="text-center">
              <div
                class="text-lg font-bold"
                :class="activityColor"
              >
                {{ activityLabel }}
              </div>
              <div class="text-xs text-neutral-500">
                Activity
              </div>
            </div>
          </div>

          <!-- Compatibility -->
          <UAccordion
            :items="[{ label: 'Compatibility', slot: 'compat', defaultOpen: true }]"
          >
            <template #compat>
              <div class="space-y-2 text-sm">
                <div class="flex items-center gap-2">
                  <UIcon
                    :name="compatStatus === 'nuxt4' ? 'i-lucide-check-circle' : 'i-lucide-help-circle'"
                    :class="compatStatus === 'nuxt4' ? 'text-green-500' : 'text-neutral-400'"
                    class="w-4 h-4"
                  />
                  <span>Nuxt 4: {{ compatStatus === 'nuxt4' ? 'Supported' : compatStatus === 'nuxt3' ? 'Not confirmed' : 'Unknown' }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <UIcon
                    :name="compatStatus !== 'unknown' ? 'i-lucide-check-circle' : 'i-lucide-help-circle'"
                    :class="compatStatus !== 'unknown' ? 'text-green-500' : 'text-neutral-400'"
                    class="w-4 h-4"
                  />
                  <span>Nuxt 3: {{ compatStatus !== 'unknown' ? 'Supported' : 'Unknown' }}</span>
                </div>
                <div
                  v-if="module.nuxtApiCompat?.raw"
                  class="text-xs text-neutral-500 mt-2"
                >
                  Raw constraint: <code class="px-1 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded">{{ module.nuxtApiCompat.raw }}</code>
                </div>
                <div
                  v-if="module.topics?.all?.length"
                  class="flex flex-wrap gap-1 mt-2"
                >
                  <UBadge
                    v-for="topic in module.topics.all.slice(0, 8)"
                    :key="topic"
                    color="neutral"
                    variant="subtle"
                    size="xs"
                  >
                    {{ topic }}
                  </UBadge>
                </div>
              </div>
            </template>
          </UAccordion>

          <!-- Health Signals -->
          <UAccordion
            :items="[{ label: 'Health Signals', slot: 'health', defaultOpen: true }]"
          >
            <template #health>
              <div class="space-y-2">
                <div
                  v-for="(signal, i) in module.health.signals"
                  :key="i"
                  class="flex items-center gap-2 text-sm"
                >
                  <UIcon
                    :name="signalIcon(signal.type)"
                    :class="signalColor(signal.type)"
                    class="w-4 h-4"
                  />
                  <span>{{ signal.msg }}</span>
                </div>
                <div
                  v-if="!module.health.signals.length"
                  class="text-sm text-neutral-500"
                >
                  No specific signals detected.
                </div>
              </div>
            </template>
          </UAccordion>

          <!-- Maintenance -->
          <UAccordion
            :items="[{ label: 'Maintenance', slot: 'maintenance' }]"
          >
            <template #maintenance>
              <div class="space-y-3 text-sm">
                <div
                  v-if="module.github?.pushedAt"
                  class="flex justify-between"
                >
                  <span class="text-neutral-500">Last commit</span>
                  <span>{{ formatDate(module.github.pushedAt) }}</span>
                </div>
                <div
                  v-if="module.release"
                  class="flex justify-between"
                >
                  <span class="text-neutral-500">Last release</span>
                  <span>{{ module.release.tag }} ({{ module.release.daysSince }}d ago)</span>
                </div>
                <div
                  v-if="module.npm?.lastPublish"
                  class="flex justify-between"
                >
                  <span class="text-neutral-500">npm publish</span>
                  <span>{{ formatDate(module.npm.lastPublish) }}</span>
                </div>
                <div
                  v-if="module.contributors?.commitsLastYear"
                  class="flex justify-between"
                >
                  <span class="text-neutral-500">Commits (12mo)</span>
                  <span>{{ module.contributors.commitsLastYear }}</span>
                </div>
                <div v-if="module.contributors?.contributors?.length">
                  <span class="text-neutral-500 block mb-1">Top contributors</span>
                  <div class="flex flex-wrap gap-1">
                    <UBadge
                      v-for="c in module.contributors.contributors"
                      :key="c"
                      color="neutral"
                      variant="subtle"
                      size="xs"
                    >
                      {{ c }}
                    </UBadge>
                  </div>
                </div>
                <div v-if="module.maintainers?.length">
                  <span class="text-neutral-500 block mb-1">Maintainers</span>
                  <div class="flex flex-wrap gap-1">
                    <UBadge
                      v-for="m in module.maintainers"
                      :key="m"
                      color="primary"
                      variant="subtle"
                      size="xs"
                    >
                      {{ m }}
                    </UBadge>
                  </div>
                </div>
              </div>
            </template>
          </UAccordion>

          <!-- GitHub Details -->
          <UAccordion
            v-if="module.github"
            :items="[{ label: 'GitHub', slot: 'github' }]"
          >
            <template #github>
              <div class="space-y-3 text-sm">
                <div class="flex justify-between">
                  <span class="text-neutral-500">Repository</span>
                  <span>{{ module.github.fullName }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-neutral-500">Stars</span>
                  <span>{{ module.github.stars?.toLocaleString() }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-neutral-500">Forks</span>
                  <span>{{ module.github.forks?.toLocaleString() }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-neutral-500">Open Issues</span>
                  <span>{{ module.github.openIssues?.toLocaleString() }}</span>
                </div>
                <div
                  v-if="module.github.archived"
                  class="flex items-center gap-2 text-red-500"
                >
                  <UIcon
                    name="i-lucide-archive"
                    class="w-4 h-4"
                  />
                  <span>This repository is archived</span>
                </div>
              </div>
            </template>
          </UAccordion>

          <!-- npm Details -->
          <UAccordion
            v-if="module.npm"
            :items="[{ label: 'npm', slot: 'npm' }]"
          >
            <template #npm>
              <div class="space-y-3 text-sm">
                <div class="flex justify-between">
                  <span class="text-neutral-500">Package</span>
                  <span>{{ module.npm.name }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-neutral-500">Version</span>
                  <span>{{ module.npm.latestVersion }}</span>
                </div>
                <div
                  v-if="module.npm.peerDeps && Object.keys(module.npm.peerDeps).length"
                >
                  <span class="text-neutral-500 block mb-1">Peer Dependencies</span>
                  <div class="space-y-1">
                    <div
                      v-for="(version, pkg) in module.npm.peerDeps"
                      :key="pkg"
                      class="flex justify-between text-xs"
                    >
                      <code>{{ pkg }}</code>
                      <span class="text-neutral-400">{{ version }}</span>
                    </div>
                  </div>
                </div>
                <div
                  v-if="module.npm.deprecated"
                  class="p-2 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                >
                  <strong>Deprecated:</strong> {{ module.npm.deprecated }}
                </div>
              </div>
            </template>
          </UAccordion>

          <!-- Vulnerabilities -->
          <UAccordion
            :items="[{ label: vulnAccordionLabel, slot: 'vulns', defaultOpen: hasVulnerabilities }]"
          >
            <template #vulns>
              <div class="space-y-3 text-sm">
                <template v-if="module.vulnerabilities">
                  <div
                    v-if="module.vulnerabilities.count === 0"
                    class="flex items-center gap-2 text-green-600 dark:text-green-400"
                  >
                    <UIcon
                      name="i-lucide-shield-check"
                      class="w-5 h-5"
                    />
                    <span>No known vulnerabilities found</span>
                  </div>
                  <template v-else>
                    <!-- Summary -->
                    <div
                      class="flex items-center gap-4 p-3 rounded-lg"
                      :class="vulnSummaryBg"
                    >
                      <div
                        v-if="module.vulnerabilities.critical > 0"
                        class="text-center"
                      >
                        <div class="text-lg font-bold text-red-600 dark:text-red-400">
                          {{ module.vulnerabilities.critical }}
                        </div>
                        <div class="text-[10px] text-red-500 uppercase">
                          Critical
                        </div>
                      </div>
                      <div
                        v-if="module.vulnerabilities.high > 0"
                        class="text-center"
                      >
                        <div class="text-lg font-bold text-orange-600 dark:text-orange-400">
                          {{ module.vulnerabilities.high }}
                        </div>
                        <div class="text-[10px] text-orange-500 uppercase">
                          High
                        </div>
                      </div>
                      <div
                        v-if="module.vulnerabilities.medium > 0"
                        class="text-center"
                      >
                        <div class="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                          {{ module.vulnerabilities.medium }}
                        </div>
                        <div class="text-[10px] text-yellow-500 uppercase">
                          Medium
                        </div>
                      </div>
                      <div
                        v-if="module.vulnerabilities.low > 0"
                        class="text-center"
                      >
                        <div class="text-lg font-bold text-neutral-600 dark:text-neutral-400">
                          {{ module.vulnerabilities.low }}
                        </div>
                        <div class="text-[10px] text-neutral-500 uppercase">
                          Low
                        </div>
                      </div>
                    </div>

                    <!-- List -->
                    <div class="space-y-2">
                      <div
                        v-for="vuln in module.vulnerabilities.vulnerabilities"
                        :key="vuln.id"
                        class="p-2 rounded border"
                        :class="vulnBorderColor(vuln.severity)"
                      >
                        <div class="flex items-center justify-between gap-2 mb-1">
                          <a
                            :href="`https://osv.dev/vulnerability/${vuln.id}`"
                            target="_blank"
                            class="font-mono text-xs text-primary-600 dark:text-primary-400 hover:underline"
                          >
                            {{ vuln.id }}
                          </a>
                          <UBadge
                            :color="vulnBadgeColor(vuln.severity)"
                            variant="subtle"
                            size="xs"
                          >
                            {{ vuln.severity }}
                          </UBadge>
                        </div>
                        <p class="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">
                          {{ vuln.summary }}
                        </p>
                      </div>
                    </div>
                  </template>
                </template>
                <div
                  v-else
                  class="text-neutral-500"
                >
                  No vulnerability data available
                </div>
              </div>
            </template>
          </UAccordion>
        </div>

        <!-- Footer Links -->
        <div class="p-4 border-t border-neutral-200 dark:border-neutral-800 flex gap-2">
          <UButton
            v-if="module.repo"
            color="neutral"
            variant="soft"
            size="sm"
            :to="`https://github.com/${module.repo}`"
            target="_blank"
          >
            <UIcon
              name="i-lucide-github"
              class="w-4 h-4"
            />
            GitHub
          </UButton>
          <UButton
            v-if="module.npmPackage"
            color="neutral"
            variant="soft"
            size="sm"
            :to="`https://www.npmjs.com/package/${module.npmPackage}`"
            target="_blank"
          >
            <UIcon
              name="i-lucide-package"
              class="w-4 h-4"
            />
            npm
          </UButton>
          <UButton
            color="neutral"
            variant="soft"
            size="sm"
            :to="`https://nuxt.com/modules/${module.name}`"
            target="_blank"
          >
            <UIcon
              name="i-lucide-external-link"
              class="w-4 h-4"
            />
            Nuxt
          </UButton>
        </div>
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import type { ModuleData } from '~~/shared/types/modules'
import { getCompatStatus } from '~/composables/useModuleFilters'

const props = defineProps<{
  module: ModuleData | null
  isFavorite: boolean
}>()

const isOpen = defineModel<boolean>('open', { default: false })

defineEmits<{
  'toggle-favorite': [moduleName: string]
}>()

const compatStatus = computed(() => {
  if (!props.module) return 'unknown'
  return getCompatStatus(props.module)
})

const daysSincePush = computed(() => {
  if (!props.module?.github?.pushedAt) return null
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

const activityColor = computed(() => {
  const days = daysSincePush.value
  if (days === null) return 'text-neutral-800 dark:text-neutral-200'
  if (days < 30) return 'text-green-600 dark:text-green-400'
  if (days < 180) return 'text-neutral-800 dark:text-neutral-200'
  if (days < 365) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
})

function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) return '-'
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`
  return String(num)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString()
}

function signalIcon(type: string): string {
  if (type === 'positive') return 'i-lucide-check-circle'
  if (type === 'warning') return 'i-lucide-alert-triangle'
  return 'i-lucide-x-circle'
}

function signalColor(type: string): string {
  if (type === 'positive') return 'text-green-500'
  if (type === 'warning') return 'text-yellow-500'
  return 'text-red-500'
}

const hasVulnerabilities = computed(() => {
  return (props.module?.vulnerabilities?.count ?? 0) > 0
})

const vulnSummaryBg = computed(() => {
  const v = props.module?.vulnerabilities
  if (!v) return 'bg-neutral-100 dark:bg-neutral-800'
  if (v.critical > 0) return 'bg-red-50 dark:bg-red-900/20'
  if (v.high > 0) return 'bg-orange-50 dark:bg-orange-900/20'
  if (v.medium > 0) return 'bg-yellow-50 dark:bg-yellow-900/20'
  return 'bg-neutral-100 dark:bg-neutral-800'
})

const vulnAccordionLabel = computed(() => {
  const count = props.module?.vulnerabilities?.count
  if (count === undefined || count === null) return 'Security'
  if (count === 0) return 'Security'
  return `Security (${count} issues)`
})

function vulnBorderColor(severity: string): string {
  if (severity === 'CRITICAL') return 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10'
  if (severity === 'HIGH') return 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/10'
  if (severity === 'MEDIUM') return 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/10'
  return 'border-neutral-300 dark:border-neutral-700'
}

function vulnBadgeColor(severity: string): string {
  if (severity === 'CRITICAL') return 'error'
  if (severity === 'HIGH') return 'warning'
  if (severity === 'MEDIUM') return 'warning'
  return 'neutral'
}
</script>
