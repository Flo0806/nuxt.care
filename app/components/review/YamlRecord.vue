<template>
  <dl class="divide-y divide-neutral-200 dark:divide-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
    <div
      v-for="field in fields"
      :key="field.key"
      class="flex gap-3 px-3 py-2 text-sm odd:bg-neutral-50/60 dark:odd:bg-neutral-900/40"
    >
      <dt
        class="w-32 shrink-0 font-mono text-xs pt-0.5"
        :class="field.common
          ? 'text-neutral-400'
          : 'text-amber-600 dark:text-amber-400'"
        :title="field.common ? undefined : 'Not a field the other submissions use'"
      >
        {{ field.key }}
      </dt>

      <dd class="min-w-0 flex-1 text-neutral-700 dark:text-neutral-300 break-words">
        <!-- The icon field is the one you can verify against the PR itself -->
        <span
          v-if="field.key === 'icon' && field.text"
          class="flex items-center gap-2 flex-wrap"
        >
          <img
            v-if="iconUrl && !iconFailed"
            :src="iconUrl"
            :alt="field.text"
            class="w-5 h-5 object-contain bg-white dark:bg-neutral-800 rounded"
            loading="lazy"
            @error="iconFailed = true"
          >
          <span class="font-mono text-xs">{{ field.text }}</span>
          <UBadge
            :color="iconShipped ? 'neutral' : 'warning'"
            variant="subtle"
            size="sm"
          >
            {{ iconShipped ? 'added by this PR' : 'not in this PR' }}
          </UBadge>
        </span>

        <!-- repo carries branch and subdirectory on top of the path -->
        <span
          v-else-if="field.key === 'repo' && repo"
          class="flex items-center gap-2 flex-wrap"
        >
          <a
            :href="repo.url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary-600 dark:text-primary-400 hover:underline"
          >{{ repo.path }}</a>
          <span
            v-if="repo.branch || repo.subdir"
            class="font-mono text-xs text-neutral-400"
          >{{ [repo.branch, repo.subdir].filter(Boolean).join(' / ') }}</span>
        </span>

        <span
          v-else-if="field.maintainers"
          class="flex flex-wrap gap-1.5"
        >
          <a
            v-for="maintainer in field.maintainers"
            :key="maintainer.label"
            :href="maintainer.href ?? undefined"
            :target="maintainer.href ? '_blank' : undefined"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs"
            :class="maintainer.href ? 'hover:underline text-primary-600 dark:text-primary-400' : ''"
          >{{ maintainer.label }}</a>
        </span>

        <span v-else-if="field.nested?.length">
          <span
            v-for="row in field.nested"
            :key="row.key"
            class="block"
          >
            <span class="font-mono text-xs text-neutral-400">{{ row.key }}:</span>
            {{ row.value }}
          </span>
        </span>

        <a
          v-else-if="field.href"
          :href="field.href"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary-600 dark:text-primary-400 hover:underline"
        >{{ field.text }}</a>

        <span
          v-else-if="field.text === ''"
          class="italic text-neutral-400"
        >empty</span>

        <span v-else>{{ field.text }}</span>
      </dd>
    </div>
  </dl>
</template>

<script setup lang="ts">
const props = defineProps<{
  entry: ReviewEntryView
}>()

/**
 * Fields the other submissions use. Observed across the open pull requests,
 * not read from a schema, so this only tells you what is unusual - never that
 * something is wrong.
 */
const COMMON_FIELDS = [
  'name',
  'description',
  'repo',
  'npm',
  'category',
  'type',
  'github',
  'website',
  'icon',
  'learn_more',
  'maintainers',
  'compatibility',
]

interface MaintainerChip {
  label: string
  href: string | null
}

interface NestedRow {
  key: string
  value: string
}

const repo = computed(() => parseRepoField(yamlText(props.entry.yaml, 'repo')))
const iconUrl = computed(() => reviewIconUrl(props.entry))
const iconFailed = ref(false)

/** Whether the file the icon field names is actually part of this PR. */
const iconShipped = computed(() => {
  const icon = yamlText(props.entry.yaml, 'icon')
  return !!icon && props.entry.otherFiles.includes(`icons/${icon}`)
})

watch(() => props.entry.number, () => {
  iconFailed.value = false
})

function href(key: string, value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null

  if (['github', 'website', 'learn_more'].includes(key)) {
    return /^https?:\/\//i.test(value) ? value : null
  }
  // A package name only, never the npmjs.com URL some submissions put here.
  if (key === 'npm' && props.entry.npm?.status === 'ok') {
    return `https://www.npmjs.com/package/${value}`
  }
  return null
}

function maintainerChips(value: unknown): MaintainerChip[] | null {
  if (!Array.isArray(value)) return null

  return value.map((item) => {
    if (typeof item === 'string') return { label: item, href: null }
    if (!item || typeof item !== 'object') return { label: String(item), href: null }

    const record = item as Record<string, unknown>
    const login = typeof record.github === 'string' ? record.github : null
    const name = typeof record.name === 'string' ? record.name : null

    return {
      label: name ?? login ?? 'unknown',
      href: login ? `https://github.com/${login}` : null,
    }
  })
}

function nestedRows(value: unknown): NestedRow[] | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null

  return Object.entries(value as Record<string, unknown>)
    .map(([key, nested]) => ({
      key,
      value: typeof nested === 'object' && nested !== null
        ? JSON.stringify(nested)
        : String(nested),
    }))
    // `requires: {}` is what autofix writes when there is nothing to require.
    .filter(row => row.value !== '{}')
}

function asText(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

// Object.entries keeps the order the yaml was written in, so the box reads
// like the file rather than like our idea of the file.
const fields = computed(() =>
  Object.entries(props.entry.yaml ?? {}).map(([key, value]) => ({
    key,
    common: COMMON_FIELDS.includes(key),
    text: asText(value),
    href: href(key, value),
    maintainers: key === 'maintainers' ? maintainerChips(value) : null,
    nested: key === 'maintainers' ? null : nestedRows(value),
  })),
)
</script>
