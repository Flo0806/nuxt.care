<template>
  <USlideover
    v-model:open="isOpen"
    :title="module?.name || 'Module Details'"
    :description="module?.description || 'Module information'"
    :ui="{ content: 'max-w-xl' }"
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
                class="text-neutral-400 hover:text-red-700 dark:text-neutral-500 dark:hover:text-red-400 transition-colors"
                :class="{ 'text-red-700 dark:text-red-400': isFavorite }"
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
          <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
            {{ module.description }}
          </p>
          <!-- Meta Badges -->
          <div class="flex flex-wrap items-center gap-2">
            <!-- Category -->
            <div class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-600 dark:text-neutral-400">
              <UIcon
                :name="getCategoryConfig(module.category).icon"
                class="w-3 h-3"
              />
              {{ module.category }}
            </div>
            <!-- Official -->
            <UBadge
              v-if="module.type === 'official'"
              color="primary"
              variant="subtle"
              size="xs"
            >
              Official
            </UBadge>
            <!-- TypeScript -->
            <UBadge
              v-if="module.npm?.hasTypes"
              color="info"
              variant="subtle"
              size="xs"
            >
              <UIcon
                name="i-lucide-file-code"
                class="w-3 h-3 mr-0.5"
              />
              TypeScript
            </UBadge>
            <!-- Version -->
            <span
              v-if="module.npm?.latestVersion"
              class="text-xs text-neutral-500"
            >
              v{{ module.npm.latestVersion }}
            </span>
            <!-- License -->
            <span
              v-if="module.github?.license"
              class="text-xs px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
            >
              {{ module.github.license }}
            </span>
            <!-- Package Size -->
            <UTooltip
              v-if="module.npm?.unpackedSize"
              :text="`${formatBytes(module.npm.unpackedSize)} unpacked`"
            >
              <span class="text-xs px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 cursor-help">
                {{ formatBytes(module.npm.unpackedSize) }}
              </span>
            </UTooltip>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- Quick Stats -->
          <div class="grid grid-cols-4 gap-4 p-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
            <div class="text-center">
              <div class="text-lg font-bold text-neutral-900 dark:text-white">
                {{ formatNumber(module.npm?.downloads) }}
              </div>
              <div class="text-xs text-neutral-500">
                DL/week
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

          <!-- Divider -->
          <div class="border-t border-neutral-200 dark:border-neutral-700" />

          <!-- Quality: Tests, CI, Pending -->
          <div class="space-y-3">
            <h3 class="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <UIcon
                name="i-lucide-activity"
                class="w-4 h-4 text-primary-500"
              />
              Quality
            </h3>
            <div class="grid grid-cols-3 gap-3">
              <!-- Tests -->
              <div class="p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
                <div class="flex items-center gap-2 mb-1">
                  <UIcon
                    :name="module.npm?.hasTests ? 'i-lucide-check-circle' : 'i-lucide-x-circle'"
                    class="w-4 h-4"
                    :class="module.npm?.hasTests ? 'text-green-700' : 'text-red-700'"
                  />
                  <span class="text-sm font-medium">Tests</span>
                </div>
                <p class="text-xs text-neutral-500">
                  {{ module.npm?.hasTests ? 'Test script found' : 'No test script' }}
                </p>
              </div>

              <!-- CI Status -->
              <div class="p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
                <div class="flex items-center gap-2 mb-1">
                  <UIcon
                    :name="ciIcon"
                    class="w-4 h-4"
                    :class="ciColor"
                  />
                  <span class="text-sm font-medium">CI</span>
                </div>
                <p class="text-xs text-neutral-500">
                  {{ ciLabel }}
                </p>
                <a
                  v-if="module.ciStatus?.hasCI && module.repo"
                  :href="`https://github.com/${module.repo}/actions`"
                  target="_blank"
                  class="text-xs text-primary-500 hover:underline"
                  @click.stop
                >
                  View Actions →
                </a>
              </div>

              <!-- Pending -->
              <div class="p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
                <div class="flex items-center gap-2 mb-1">
                  <span
                    class="text-sm font-bold"
                    :class="pendingColor"
                  >
                    {{ pendingLabel }}
                  </span>
                  <span class="text-sm font-medium">Pending</span>
                </div>
                <p class="text-xs text-neutral-500">
                  {{ pendingSubtext }}
                </p>
              </div>
            </div>

            <!-- Pending Commits List -->
            <div
              v-if="module.pendingCommits && module.pendingCommits.nonChore > 0"
              class="p-3 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10"
            >
              <p class="text-xs font-medium text-orange-700 dark:text-orange-400 mb-2">
                Unreleased commits ({{ module.pendingCommits.nonChore }} of {{ module.pendingCommits.total }}):
              </p>
              <div class="space-y-1 max-h-32 overflow-y-auto">
                <a
                  v-for="commit in module.pendingCommits.commits"
                  :key="commit.sha"
                  :href="`https://github.com/${module.repo}/commit/${commit.sha}`"
                  target="_blank"
                  class="flex items-center gap-2 p-1.5 rounded hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                  @click.stop
                >
                  <code class="text-xs text-primary-600 dark:text-primary-400 shrink-0 font-mono">{{ commit.sha }}</code>
                  <span class="text-xs text-neutral-700 dark:text-neutral-300 truncate flex-1">{{ commit.message }}</span>
                  <span class="text-[10px] text-neutral-400 shrink-0">{{ formatDateShort(commit.date) }}</span>
                </a>
              </div>
              <a
                v-if="module.repo && module.release"
                :href="`https://github.com/${module.repo}/compare/${module.release.tag}...HEAD`"
                target="_blank"
                class="mt-2 text-xs text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1"
                @click.stop
              >
                <UIcon
                  name="i-lucide-git-compare"
                  class="w-3 h-3"
                />
                View full diff on GitHub
              </a>
            </div>
          </div>

          <!-- Divider -->
          <div class="border-t border-neutral-200 dark:border-neutral-700" />

          <!-- Install Commands -->
          <div class="space-y-3">
            <h3 class="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <UIcon
                name="i-lucide-terminal"
                class="w-4 h-4 text-primary-500"
              />
              Install
            </h3>
            <div class="space-y-1.5">
              <div
                v-for="cmd in installCommands"
                :key="cmd.pm"
                class="flex items-center gap-2"
              >
                <code
                  class="flex-1 text-xs px-3 py-2 rounded font-mono"
                  :class="cmd.recommended
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 ring-1 ring-primary-200 dark:ring-primary-800'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'"
                >
                  {{ cmd.command }}
                  <span
                    v-if="cmd.recommended"
                    class="ml-2 text-[10px] uppercase text-primary-500"
                  >recommended</span>
                </code>
                <UTooltip :text="copiedPm === cmd.pm ? 'Copied!' : 'Copy'">
                  <UButton
                    :color="cmd.recommended ? 'primary' : 'neutral'"
                    variant="ghost"
                    size="xs"
                    :icon="copiedPm === cmd.pm ? 'i-lucide-check' : 'i-lucide-copy'"
                    @click="copyCommand(cmd.pm, cmd.command)"
                  />
                </UTooltip>
              </div>
            </div>
          </div>

          <!-- Divider -->
          <div class="border-t border-neutral-200 dark:border-neutral-700" />

          <!-- Details Accordions -->
          <div class="space-y-2">
            <h3 class="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2 mb-3">
              <UIcon
                name="i-lucide-info"
                class="w-4 h-4 text-primary-500"
              />
              Details
            </h3>

            <!-- Compatibility -->
            <UAccordion
              :items="[{ label: 'Compatibility', slot: 'compat', defaultOpen: true }]"
            >
              <template #compat>
                <div class="space-y-2 text-sm">
                  <div class="flex items-center gap-2">
                    <UIcon
                      :name="compatStatus === 'nuxt4' ? 'i-lucide-check-circle' : 'i-lucide-help-circle'"
                      :class="compatStatus === 'nuxt4' ? 'text-green-700' : 'text-neutral-400'"
                      class="w-4 h-4"
                    />
                    <span>Nuxt 4: {{ compatStatus === 'nuxt4' ? 'Supported' : compatStatus === 'nuxt3' ? 'Not confirmed' : 'Unknown' }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <UIcon
                      :name="compatStatus !== 'unknown' ? 'i-lucide-check-circle' : 'i-lucide-help-circle'"
                      :class="compatStatus !== 'unknown' ? 'text-green-700' : 'text-neutral-400'"
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
                    class="flex items-center gap-2 text-red-700"
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
                      class="flex items-center gap-2 text-green-700 dark:text-green-400"
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
                          <div class="text-lg font-bold text-red-700 dark:text-red-400">
                            {{ module.vulnerabilities.critical }}
                          </div>
                          <div class="text-[10px] text-red-700 uppercase">
                            Critical
                          </div>
                        </div>
                        <div
                          v-if="module.vulnerabilities.high > 0"
                          class="text-center"
                        >
                          <div class="text-lg font-bold text-orange-700 dark:text-orange-400">
                            {{ module.vulnerabilities.high }}
                          </div>
                          <div class="text-[10px] text-orange-700 uppercase">
                            High
                          </div>
                        </div>
                        <div
                          v-if="module.vulnerabilities.medium > 0"
                          class="text-center"
                        >
                          <div class="text-lg font-bold text-yellow-700 dark:text-yellow-400">
                            {{ module.vulnerabilities.medium }}
                          </div>
                          <div class="text-[10px] text-yellow-700 uppercase">
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

// Install commands
const installCommands = computed(() => {
  const name = props.module?.name || ''
  const pkg = props.module?.npmPackage || ''
  return [
    { pm: 'nuxt', command: `npx nuxt module add ${name}`, recommended: true },
    { pm: 'pnpm', command: `pnpm add ${pkg}`, recommended: false },
    { pm: 'npm', command: `npm install ${pkg}`, recommended: false },
    { pm: 'yarn', command: `yarn add ${pkg}`, recommended: false },
  ]
})

const copiedPm = ref<string | null>(null)

async function copyCommand(pm: string, command: string) {
  await navigator.clipboard.writeText(command)
  copiedPm.value = pm
  setTimeout(() => {
    copiedPm.value = null
  }, 2000)
}

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
  if (days < 30) return 'text-green-700 dark:text-green-400'
  if (days < 180) return 'text-neutral-800 dark:text-neutral-200'
  if (days < 365) return 'text-yellow-700 dark:text-yellow-400'
  return 'text-red-700 dark:text-red-400'
})

function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) return '-'
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`
  return String(num)
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString()
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getDate()}.${d.getMonth() + 1}`
}

// CI Status
const ciIcon = computed(() => {
  const ci = props.module?.ciStatus
  if (!ci?.hasCI) return 'i-lucide-circle-dashed'
  if (ci.lastRunConclusion === 'success') return 'i-lucide-check-circle'
  if (ci.lastRunConclusion === 'failure') return 'i-lucide-x-circle'
  return 'i-lucide-circle-dashed'
})

const ciColor = computed(() => {
  const ci = props.module?.ciStatus
  if (!ci?.hasCI) return 'text-neutral-400'
  if (ci.lastRunConclusion === 'success') return 'text-green-700'
  if (ci.lastRunConclusion === 'failure') return 'text-red-700'
  return 'text-yellow-700'
})

const ciLabel = computed(() => {
  const ci = props.module?.ciStatus
  if (!ci?.hasCI) return 'No CI detected'
  if (ci.lastRunConclusion === 'success') return `Passing (${ci.workflowName})`
  if (ci.lastRunConclusion === 'failure') return `Failing (${ci.workflowName})`
  return `Unknown (${ci.workflowName})`
})

// Pending Commits
const pendingLabel = computed(() => {
  const p = props.module?.pendingCommits
  if (!p) return '-'
  return String(p.nonChore)
})

const pendingColor = computed(() => {
  const p = props.module?.pendingCommits
  if (!p) return 'text-neutral-400'
  if (p.nonChore === 0) return 'text-green-700'
  if (p.nonChore <= 3) return 'text-yellow-700'
  return 'text-orange-700'
})

const pendingSubtext = computed(() => {
  const p = props.module?.pendingCommits
  if (!p) return 'No release data'
  if (p.nonChore === 0) return 'All changes released'
  return `${p.total - p.nonChore} chore commits filtered`
})

function signalIcon(type: string): string {
  if (type === 'positive') return 'i-lucide-check-circle'
  if (type === 'warning') return 'i-lucide-alert-triangle'
  return 'i-lucide-x-circle'
}

function signalColor(type: string): string {
  if (type === 'positive') return 'text-green-700'
  if (type === 'warning') return 'text-yellow-700'
  return 'text-red-700'
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

type BadgeColor = 'success' | 'primary' | 'secondary' | 'info' | 'warning' | 'error' | 'neutral'

function vulnBadgeColor(severity: string): BadgeColor {
  if (severity === 'CRITICAL') return 'error'
  if (severity === 'HIGH') return 'warning'
  if (severity === 'MEDIUM') return 'warning'
  return 'neutral'
}
</script>
