<template>
  <div class="space-y-6">
    <section
      v-for="group in groups"
      :key="group.key"
      class="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden"
    >
      <header class="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <h2 class="text-sm font-semibold text-neutral-900 dark:text-white">
          {{ group.label }}
        </h2>
        <span class="text-xs text-neutral-500">{{ group.entries.length }}</span>
      </header>

      <ReviewItem
        v-for="entry in group.entries"
        :key="entry.number"
        :entry="entry"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  entries: ReviewEntry[]
}>()

interface ReviewGroup {
  key: string
  label: string
  entries: ReviewEntry[]
}

// Single group for now. This is the seam where the triage buckets go once an
// entry carries a verdict, so the markup below does not have to change.
const groups = computed<ReviewGroup[]>(() => [
  { key: 'all', label: 'Open submissions', entries: props.entries },
])
</script>
