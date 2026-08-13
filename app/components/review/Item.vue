<template>
  <div
    class="flex gap-3 px-4 py-3 border-b border-l-2 border-neutral-200 dark:border-neutral-800 last:border-b-0 hover:bg-neutral-50 dark:hover:bg-neutral-900"
    :class="marked
      ? 'border-l-primary-500 bg-primary-50/60 dark:bg-primary-950/30'
      : 'border-l-transparent'"
  >
    <button
      type="button"
      class="flex flex-1 gap-3 min-w-0 text-left cursor-pointer"
      @click="$emit('select', entry)"
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
    </button>

    <div class="flex flex-col items-end gap-1 shrink-0">
      <div class="flex items-center gap-1.5">
        <img
          v-if="entry.authorAvatar"
          :src="entry.authorAvatar"
          :alt="entry.author"
          class="w-5 h-5 rounded-full"
          loading="lazy"
        >
        <span class="text-xs text-neutral-500 hidden sm:inline max-w-28 truncate">{{ entry.author }}</span>
        <a
          :href="entry.url"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="`Open pull request ${entry.number} on GitHub`"
          class="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          @click.stop="$emit('mark', entry.number)"
        >
          <UIcon
            name="i-lucide-external-link"
            class="w-3.5 h-3.5"
          />
        </a>
      </div>
      <span class="text-xs text-neutral-400">{{ formatRelative(entry.createdAt) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  entry: ReviewEntryView
  marked: boolean
}>()

defineEmits<{
  select: [entry: ReviewEntryView]
  mark: [prNumber: number]
}>()

const moduleName = computed(() => yamlText(props.entry.yaml, 'name'))
const npmPackage = computed(() => yamlText(props.entry.yaml, 'npm'))
const facts = computed(() => reviewFacts(props.entry))
</script>
