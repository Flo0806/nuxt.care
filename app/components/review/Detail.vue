<template>
  <USlideover
    v-model:open="isOpen"
    :title="title"
    :description="description"
    :ui="{ content: 'max-w-2xl' }"
  >
    <template #content>
      <div
        v-if="entry"
        class="flex flex-col h-full overflow-y-auto divide-y divide-neutral-200 dark:divide-neutral-800"
      >
        <!-- Identity: what module is this, and where does it live -->
        <header class="p-6 bg-neutral-50 dark:bg-neutral-900/50">
          <button
            class="sm:hidden flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 mb-3 -ml-1"
            @click="isOpen = false"
          >
            <UIcon
              name="i-lucide-chevron-left"
              class="w-4 h-4"
            />
            Back to list
          </button>

          <div class="flex items-start gap-4">
            <ReviewIcon
              :entry="entry"
              size="lg"
            />

            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-3">
                <h2 class="text-xl font-semibold text-neutral-900 dark:text-white break-words">
                  {{ title }}
                </h2>
                <UBadge
                  :color="bucketColor"
                  variant="subtle"
                  class="shrink-0"
                >
                  {{ bucketLabel }}
                </UBadge>
              </div>

              <p
                v-if="description"
                class="mt-1 text-sm text-neutral-600 dark:text-neutral-400"
              >
                {{ description }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 mt-4 text-sm">
            <UIcon
              name="i-lucide-git-pull-request"
              class="w-4 h-4 text-neutral-400 shrink-0"
            />
            <a
              :href="entry.url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary-600 dark:text-primary-400 hover:underline"
            >
              #{{ entry.number }}
            </a>
            <span class="text-neutral-500 truncate">{{ entry.title }}</span>
          </div>

          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-neutral-500">
            <span class="flex items-center gap-1.5">
              <img
                v-if="entry.authorAvatar"
                :src="entry.authorAvatar"
                :alt="entry.author"
                class="w-4 h-4 rounded-full"
                loading="lazy"
              >
              {{ entry.author }}
            </span>
            <span>opened {{ formatRelative(entry.createdAt) }}</span>
            <span>updated {{ formatRelative(entry.updatedAt) }}</span>
            <span
              v-if="refreshedIndividually"
              class="flex items-center gap-1 text-primary-600 dark:text-primary-400"
            >
              <UIcon
                name="i-lucide-refresh-cw"
                class="w-3.5 h-3.5"
              />
              refreshed {{ formatRelative(entry.fetchedAt) }}, newer than the list
            </span>
            <UButton
              v-if="isAdmin"
              size="xs"
              color="neutral"
              variant="subtle"
              icon="i-lucide-refresh-cw"
              :loading="refreshing"
              :disabled="refreshing"
              @click="refresh"
            >
              {{ refreshing ? 'Reading GitHub...' : 'Force refresh' }}
            </UButton>
            <UBadge
              v-if="entry.draft"
              color="neutral"
              variant="subtle"
              size="sm"
            >
              draft
            </UBadge>
            <UBadge
              v-for="label in entry.labels"
              :key="label"
              color="neutral"
              variant="subtle"
              size="sm"
            >
              {{ label }}
            </UBadge>
          </div>

          <p
            v-if="refreshError"
            class="mt-2 text-xs text-red-600 dark:text-red-400"
          >
            {{ refreshError }}
          </p>
        </header>

        <section
          v-if="entry.analysis"
          class="p-6"
        >
          <h3 class="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-3">
            Estimated score
          </h3>
          <ReviewScore :analysis="entry.analysis" />
        </section>

        <!-- Why it sits in this group -->
        <section class="p-6">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-1">
            Why here
          </h3>
          <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
            {{ bucketHint }}
          </p>
          <ul class="space-y-1.5">
            <li
              v-for="fact in facts"
              :key="fact.text"
              class="flex items-start gap-2 text-sm"
              :class="fact.tone ?? 'text-neutral-600 dark:text-neutral-400'"
            >
              <UIcon
                :name="fact.icon"
                class="w-4 h-4 shrink-0 mt-0.5"
              />
              <span class="break-words">{{ fact.text }}</span>
            </li>
          </ul>
        </section>

        <section class="p-6">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-3">
            Submitted record
          </h3>

          <dl class="text-sm space-y-1 mb-4">
            <ReviewDetailRow
              label="File"
              :value="`${entry.candidate?.filename ?? 'none'} (${entry.candidate?.status ?? '-'})`"
              mono
            />
            <ReviewDetailRow
              v-if="entry.otherFiles.length"
              label="Other files"
              :value="entry.otherFiles.join(', ')"
              mono
            />
            <ReviewDetailRow
              v-if="entry.yamlError"
              label="Parse error"
              :value="entry.yamlError ?? ''"
              mono
            />
          </dl>

          <ReviewYamlRecord
            v-if="entry.yaml"
            :entry="entry"
          />
        </section>

        <section class="p-6">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-3">
            Ownership
          </h3>

          <div
            v-if="entry.duplicate"
            class="flex items-start gap-2 mb-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-sm text-red-700 dark:text-red-300"
          >
            <UIcon
              name="i-lucide-copy"
              class="w-4 h-4 shrink-0 mt-0.5"
            />
            <span>
              Already in the registry as
              <strong>{{ entry.duplicate.name }}</strong>
              ({{ entry.duplicate.npmPackage }}), matched by
              {{ entry.duplicate.match === 'npm' ? 'package name' : 'repository' }}.
            </span>
          </div>

          <dl class="text-sm space-y-1">
            <ReviewDetailRow
              label="Submitted by"
              :value="entry.ownership.prAuthor"
            />
            <ReviewDetailRow
              label="Repo owner"
              :value="ownershipText(entry.ownership.repoOwner, entry.ownership.authorIsRepoOwner)"
            />
            <ReviewDetailRow
              label="npm maintainers"
              :value="ownershipText(
                entry.ownership.npmMaintainers.join(', ') || null,
                entry.ownership.authorIsNpmMaintainer,
              )"
            />
          </dl>
        </section>

        <section
          v-if="entry.npm"
          class="p-6"
        >
          <h3 class="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-3">
            npm
          </h3>
          <dl class="text-sm space-y-1">
            <ReviewDetailRow
              label="Status"
              :value="entry.npm.status"
            />
            <ReviewDetailRow
              v-if="entry.npm.latestVersion"
              label="Latest"
              :value="entry.npm.latestVersion"
              mono
            />
            <ReviewDetailRow
              v-if="entry.npm.lastPublish"
              label="Published"
              :value="`${formatDate(entry.npm.lastPublish)} (${formatRelative(entry.npm.lastPublish)})`"
            />
            <ReviewDetailRow
              v-if="entry.npm.releaseCount"
              label="Releases"
              :value="String(entry.npm.releaseCount)"
            />
            <ReviewDetailRow
              v-if="entry.npm.nuxtRange"
              label="Nuxt range"
              :value="entry.npm.nuxtRange"
              mono
            />
            <ReviewDetailRow
              label="Types / tests"
              :value="`${entry.npm.hasTypes ? 'types' : 'no types'}, ${entry.npm.hasTests ? 'tests' : 'no tests'}`"
            />
            <ReviewDetailRow
              v-if="entry.npm.maintainers.length"
              label="Maintainers"
              :value="entry.npm.maintainers.join(', ')"
            />
            <ReviewDetailRow
              v-if="entry.npm.deprecated"
              label="Deprecated"
              :value="entry.npm.deprecated"
            />
          </dl>
        </section>

        <section
          v-if="entry.ci"
          class="p-6"
        >
          <h3 class="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-3">
            Checks on nuxt/modules
          </h3>

          <dl class="text-sm space-y-1 mb-4">
            <ReviewDetailRow
              label="Result"
              :value="ciResultText"
            />
            <ReviewDetailRow
              label="Commit"
              :value="entry.ci.sha.slice(0, 12)"
              mono
            />
            <ReviewDetailRow
              v-if="entry.merge"
              label="Mergeable"
              :value="mergeText"
            />
            <ReviewDetailRow
              v-if="entry.merge"
              label="Who can push"
              :value="pushText"
            />
          </dl>

          <p
            v-if="checksPending"
            class="text-sm text-neutral-400"
          >
            Loading checks...
          </p>
          <p
            v-else-if="checksFailed"
            class="text-sm text-neutral-400"
          >
            Could not read the individual checks.
          </p>
          <ul
            v-else-if="checks?.runs.length"
            class="space-y-2"
          >
            <li
              v-for="run in checks.runs"
              :key="run.name"
              class="text-sm"
            >
              <div class="flex items-start gap-2">
                <UIcon
                  :name="reviewRunIcon(run)"
                  class="w-4 h-4 shrink-0 mt-0.5"
                  :class="reviewRunTone(run)"
                />
                <div class="min-w-0 flex-1">
                  <a
                    v-if="run.url"
                    :href="run.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-neutral-700 dark:text-neutral-300 hover:underline"
                  >{{ run.name }}</a>
                  <span
                    v-else
                    class="text-neutral-700 dark:text-neutral-300"
                  >{{ run.name }}</span>

                  <span class="text-xs text-neutral-400 ml-2">
                    {{ run.status === 'completed' ? run.conclusion : run.status }}
                  </span>

                  <p
                    v-if="run.title"
                    class="text-xs text-neutral-500 dark:text-neutral-400"
                  >
                    {{ run.title }}
                  </p>
                  <ReviewCommentBody
                    v-if="run.summary"
                    :body="run.summary"
                    class="mt-1 text-neutral-500 dark:text-neutral-400"
                  />
                </div>
              </div>
            </li>
          </ul>
        </section>

        <section
          v-if="comments.length"
          class="p-6"
        >
          <h3 class="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-4">
            Maintainer comments
            <span class="text-neutral-300 dark:text-neutral-600">({{ comments.length }})</span>
          </h3>
          <div class="space-y-4">
            <ReviewComment
              v-for="(comment, index) in comments"
              :key="index"
              :user="comment.user"
              :at="comment.at"
              :body="comment.body"
              :highlight="isHold(comment)"
            />
          </div>
          <p class="mt-4 text-xs text-neutral-400">
            {{ conversationSummary }}
          </p>
        </section>

        <section class="p-6">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-3">
            Since we watch it
          </h3>

          <p
            v-if="historyPending"
            class="text-sm text-neutral-400"
          >
            Loading...
          </p>
          <p
            v-else-if="historyFailed"
            class="text-sm text-neutral-400"
          >
            Could not read the history.
          </p>
          <p
            v-else-if="!snapshots.length"
            class="text-sm text-neutral-500 dark:text-neutral-400"
          >
            Nothing has changed since this submission entered the cache
            {{ formatRelative(entry.fetchedAt) }}.
          </p>
          <ol
            v-else
            class="space-y-2"
          >
            <li
              v-for="(snapshot, index) in reversedSnapshots"
              :key="index"
              class="flex gap-3 text-sm"
            >
              <span class="w-24 shrink-0 text-xs text-neutral-400 pt-0.5">
                {{ formatDate(snapshot.replacedAt) }}
              </span>
              <span class="text-neutral-600 dark:text-neutral-400">
                {{ reviewHistoryLabel(snapshot.reason) }}
              </span>
            </li>
          </ol>

          <p class="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-400">
            {{ freshness }}
          </p>
        </section>
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
const props = defineProps<{
  entry: ReviewEntryView | null
  /** When the last full run finished, to tell an individual refresh apart. */
  lastRun?: string | null
}>()

const emit = defineEmits<{
  /** The stored entry changed, so whoever owns the list should read it again. */
  refreshed: []
}>()

const isOpen = defineModel<boolean>('open', { default: false })

const { isAdmin } = useReviewAdmin()
const refreshing = ref(false)
const refreshError = ref<string | null>(null)

/**
 * Reads this submission from GitHub again, ignoring every cache.
 *
 * Afterwards the local caches for exactly this entry are dropped and the list
 * is asked to reload, so the page cannot keep showing what we just replaced.
 */
async function refresh() {
  const entry = props.entry
  if (!entry || refreshing.value) return

  refreshing.value = true
  refreshError.value = null
  try {
    await $fetch(`/api/review/prs/${entry.number}/refresh`, { method: 'POST' })
    invalidateCheckCache(entry.headSha)
    invalidateHistoryCache(entry.number)
    emit('refreshed')
    await Promise.all([
      loadHistory(entry.number),
      loadChecks(entry.number, entry.headSha),
    ])
  }
  catch (error) {
    refreshError.value = error instanceof Error ? error.message : 'Refresh failed'
  }
  finally {
    refreshing.value = false
  }
}

const title = computed(() =>
  props.entry ? yamlText(props.entry.yaml, 'name') ?? props.entry.title : 'Submission')

const description = computed(() =>
  (props.entry ? yamlText(props.entry.yaml, 'description') : null) ?? undefined)

const conversationSummary = computed(() => {
  const conversation = props.entry?.conversation
  const replies = conversation?.authorReplies ?? 0
  const parts = [`${replies} ${replies === 1 ? 'reply' : 'replies'} from the author`]

  const requested = conversation?.changesRequested ?? 0
  if (requested) {
    parts.push(`${requested} formal change ${requested === 1 ? 'request' : 'requests'}`)
  }

  return parts.join(', ')
})

/**
 * True when this entry was read after the last full run, which only happens
 * through the force refresh. Worth saying out loud: the line above the list
 * then reports an older state than this one submission is in.
 */
const refreshedIndividually = computed(() => {
  const entry = props.entry
  if (!entry || !props.lastRun) return false
  return Date.parse(entry.fetchedAt) > Date.parse(props.lastRun)
})

/** Each source is read on its own schedule, so each carries its own age. */
const freshness = computed(() => {
  const entry = props.entry
  if (!entry) return ''

  const parts = [`files ${formatRelative(entry.fetchedAt)}`]
  if (entry.npm) parts.push(`npm ${formatRelative(entry.npm.fetchedAt)}`)
  if (entry.ci) parts.push(`checks ${formatRelative(entry.ci.fetchedAt)}`)
  if (entry.conversation) parts.push(`comments ${formatRelative(entry.conversation.fetchedAt)}`)

  return `Data read: ${parts.join(', ')}`
})

/** Spells the null out: GitHub not having decided is not the same as "no". */
const mergeText = computed(() => {
  const merge = props.entry?.merge
  if (!merge) return 'unknown'
  if (merge.mergeable === null) return 'GitHub has not worked it out yet'

  const state = merge.state ? ` (${merge.state})` : ''
  return `${merge.mergeable ? 'yes' : 'no, conflicts with main'}${state}`
})

const pushText = computed(() => {
  const canModify = props.entry?.merge?.maintainerCanModify
  if (canModify === null || canModify === undefined) return 'unknown'
  return canModify
    ? 'the author and any nuxt/modules maintainer'
    : 'only the author, maintainers are locked out'
})

const ciResultText = computed(() => {
  const ci = props.entry?.ci
  if (!ci) return 'unknown'
  if (ci.conclusion === 'none') return 'no checks ran on this commit'
  if (ci.conclusion === 'failure') return `${ci.failed} of ${ci.total} failed`
  if (ci.conclusion === 'pending') return `${ci.total} checks, still running`
  return `all ${ci.total} passed`
})

const {
  snapshots,
  pending: historyPending,
  failed: historyFailed,
  load: loadHistory,
} = useReviewHistory()

const {
  checks,
  pending: checksPending,
  failed: checksFailed,
  load: loadChecks,
} = useReviewChecks()

/** Spells out what a null actually means, instead of leaving a blank. */
function ownershipText(value: string | null, isAuthor: boolean | null): string {
  if (!value) return 'unknown'
  return isAuthor === null ? value : `${value} (${isAuthor ? 'same person' : 'different person'})`
}

/** Newest first: what happened last is what somebody wants to know. */
const reversedSnapshots = computed(() => [...snapshots.value].reverse())

// Only while the slideover is actually open, so the list never triggers it.
// The head commit is part of the key: a push moves it, and the checks that
// belong to the old one say nothing about the new one.
watch(
  () => [isOpen.value, props.entry?.number, props.entry?.headSha] as const,
  ([open, number, headSha]) => {
    if (!open || typeof number !== 'number') return
    loadHistory(number)
    loadChecks(number, headSha ?? null)
  },
  { immediate: true },
)

const bucket = computed(() =>
  REVIEW_BUCKETS.find(definition => definition.key === props.entry?.bucket))

const bucketLabel = computed(() => bucket.value?.label ?? '')
const bucketHint = computed(() => bucket.value?.hint ?? '')

/** Red for defects, amber for unknowns, neutral for the rest. */
const bucketColor = computed(() => {
  switch (props.entry?.bucket) {
    case 'broken':
    case 'dead':
    case 'ci-red':
      return 'error' as const
    case 'hold':
    case 'rotten':
    case 'unchecked':
      return 'warning' as const
    case 'ready':
      return 'success' as const
    default:
      return 'neutral' as const
  }
})

const facts = computed(() => props.entry ? reviewFacts(props.entry) : [])

const comments = computed(() => props.entry?.conversation?.maintainerComments ?? [])

/** The hold is one of these comments, so it is highlighted in place. */
function isHold(comment: ReviewComment): boolean {
  return props.entry?.hold?.at === comment.at && props.entry.hold.by === comment.user
}
</script>
