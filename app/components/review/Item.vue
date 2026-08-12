<template>
  <a
    :href="entry.url"
    target="_blank"
    rel="noopener noreferrer"
    class="flex gap-3 px-4 py-3 border-b border-l-2 border-neutral-200 dark:border-neutral-800 last:border-b-0 hover:bg-neutral-50 dark:hover:bg-neutral-900"
    :class="marked
      ? 'border-l-primary-500 bg-primary-50/60 dark:bg-primary-950/30'
      : 'border-l-transparent'"
    @click="$emit('mark', entry.number)"
  >
    <span class="text-xs font-mono text-neutral-400 pt-0.5 w-12 shrink-0">#{{ entry.number }}</span>

    <span class="flex-1 min-w-0">
      <span class="flex items-center gap-2 flex-wrap">
        <span class="text-sm text-neutral-900 dark:text-white truncate">
          {{ moduleName ?? entry.title }}
        </span>
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
      </span>

      <span
        v-if="npmPackage"
        class="block truncate text-xs font-mono text-neutral-500"
      >
        {{ npmPackage }}
      </span>

      <span class="flex items-center gap-x-3 gap-y-1 flex-wrap mt-1 text-xs text-neutral-500 dark:text-neutral-400">
        <span
          v-for="fact in facts"
          :key="fact.text"
          class="flex items-center gap-1"
          :class="fact.tone"
        >
          <UIcon
            :name="fact.icon"
            class="w-3.5 h-3.5 shrink-0"
          />
          {{ fact.text }}
        </span>
      </span>

      <span
        v-if="entry.hold"
        class="block mt-1.5 pl-2 border-l-2 border-neutral-300 dark:border-neutral-700 text-xs italic text-neutral-600 dark:text-neutral-400"
      >
        &ldquo;{{ entry.hold.quote }}&rdquo;
        <span class="not-italic text-neutral-400">- {{ entry.hold.by }}</span>
      </span>
    </span>

    <span class="flex flex-col items-end gap-1 shrink-0">
      <span class="flex items-center gap-1.5">
        <img
          v-if="entry.authorAvatar"
          :src="entry.authorAvatar"
          :alt="entry.author"
          class="w-5 h-5 rounded-full"
          loading="lazy"
        >
        <span class="text-xs text-neutral-500 hidden sm:inline max-w-28 truncate">{{ entry.author }}</span>
      </span>
      <span class="text-xs text-neutral-400">{{ formatRelative(entry.createdAt) }}</span>
    </span>
  </a>
</template>

<script setup lang="ts">
const props = defineProps<{
  entry: ReviewEntryView
  marked: boolean
}>()

defineEmits<{
  mark: [prNumber: number]
}>()

/** The yaml is stored unfiltered, so every read has to prove its own type. */
function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

const moduleName = computed(() => text(props.entry.yaml?.name))
const npmPackage = computed(() => text(props.entry.yaml?.npm))

interface Fact {
  icon: string
  text: string
  tone?: string
}

const DANGER = 'text-red-600 dark:text-red-400'
const WARN = 'text-amber-600 dark:text-amber-400'

/**
 * The few facts behind the grouping. Only what is actually known: an entry
 * that was never looked up stays silent instead of claiming a defect.
 */
const facts = computed<Fact[]>(() => {
  const { candidate, yamlError, npm, ci, conversation, waitingOn } = props.entry
  const out: Fact[] = []

  if (!candidate) out.push({ icon: 'i-lucide-file-x', text: 'no module file', tone: DANGER })
  else if (!candidate.isModulePath) out.push({ icon: 'i-lucide-folder-x', text: candidate.filename, tone: DANGER })
  if (yamlError) out.push({ icon: 'i-lucide-file-warning', text: 'yaml does not parse', tone: DANGER })

  if (npm?.deprecated) out.push({ icon: 'i-lucide-ban', text: 'deprecated on npm', tone: DANGER })
  else if (npm?.status === 'not_found') out.push({ icon: 'i-lucide-package-x', text: 'package not on npm', tone: DANGER })
  else if (npm?.status === 'invalid_name') out.push({ icon: 'i-lucide-package-x', text: 'npm field is not a package name', tone: DANGER })
  else if (npm?.lastPublish) {
    out.push({
      icon: 'i-lucide-package',
      text: `published ${formatRelative(npm.lastPublish)}`,
      tone: (npm.daysSincePublish ?? 0) > 365 ? WARN : undefined,
    })
  }

  if (ci?.conclusion === 'failure') {
    out.push({ icon: 'i-lucide-circle-x', text: ci.failedNames.join(', ') || 'checks failed', tone: DANGER })
  }
  else if (ci?.conclusion === 'success') {
    out.push({ icon: 'i-lucide-circle-check', text: 'checks green' })
  }
  else if (ci?.conclusion === 'none') {
    out.push({ icon: 'i-lucide-circle-dashed', text: 'no checks ran', tone: WARN })
  }

  const since = waitingOn === 'author'
    ? conversation?.lastMaintainerActivity
    : waitingOn === 'maintainer' ? conversation?.lastAuthorActivity : null

  if (waitingOn && since) {
    out.push({
      icon: 'i-lucide-clock',
      text: `${waitingOn === 'author' ? 'author' : 'we'} owe a reply since ${formatRelative(since)}`,
      tone: WARN,
    })
  }

  return out
})
</script>
