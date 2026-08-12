<template>
  <a
    :href="entry.url"
    target="_blank"
    rel="noopener noreferrer"
    class="flex items-center gap-3 px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 last:border-b-0 hover:bg-neutral-50 dark:hover:bg-neutral-900"
  >
    <span class="text-xs font-mono text-neutral-400 w-12 shrink-0">#{{ entry.number }}</span>

    <span class="flex-1 min-w-0">
      <span class="block truncate text-sm text-neutral-900 dark:text-white">
        {{ moduleName ?? entry.title }}
      </span>
      <span
        v-if="npmPackage"
        class="block truncate text-xs font-mono text-neutral-500"
      >
        {{ npmPackage }}
      </span>
    </span>

    <UBadge
      v-for="flag in flags"
      :key="flag"
      color="error"
      variant="subtle"
      size="sm"
    >
      {{ flag }}
    </UBadge>

    <UBadge
      v-if="entry.draft"
      color="neutral"
      variant="subtle"
      size="sm"
    >
      draft
    </UBadge>

    <span class="flex items-center gap-1.5 shrink-0">
      <img
        v-if="entry.authorAvatar"
        :src="entry.authorAvatar"
        :alt="entry.author"
        class="w-5 h-5 rounded-full"
        loading="lazy"
      >
      <span class="text-xs text-neutral-500 hidden sm:inline">{{ entry.author }}</span>
    </span>

    <span class="text-xs text-neutral-400 w-20 text-right shrink-0">
      {{ formatRelative(entry.createdAt) }}
    </span>
  </a>
</template>

<script setup lang="ts">
const props = defineProps<{
  entry: ReviewEntry
}>()

/** The yaml is stored unfiltered, so every read has to prove its own type. */
function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

const moduleName = computed(() => text(props.entry.yaml?.name))
const npmPackage = computed(() => text(props.entry.yaml?.npm))

// Defects that make the submission ineffective. Not a triage bucket yet, just
// what is visible from the file itself.
const flags = computed(() => {
  const { candidate, yamlError } = props.entry
  const out: string[] = []
  if (!candidate) out.push('no module file')
  else if (!candidate.isModulePath) out.push('wrong path')
  if (yamlError) out.push('invalid yaml')
  return out
})
</script>
