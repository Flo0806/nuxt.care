<template>
  <UAccordion
    v-model="expanded"
    type="multiple"
    :items="groups"
    :ui="{
      root: 'space-y-3',
      item: 'border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden border-b',
      trigger: 'px-4 py-3 gap-3 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800',
      body: 'p-0',
    }"
  >
    <template #default="{ item }">
      <span class="flex items-center gap-2 min-w-0">
        <span class="font-semibold text-neutral-900 dark:text-white truncate">{{ item.label }}</span>
        <UBadge
          :color="item.entries.length ? 'primary' : 'neutral'"
          variant="subtle"
          size="sm"
        >
          {{ item.entries.length }}
        </UBadge>
      </span>
    </template>

    <template #body="{ item }">
      <p class="px-4 py-2 text-xs text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800">
        {{ item.hint }}
      </p>

      <ReviewItem
        v-for="entry in item.entries"
        :key="entry.number"
        :entry="entry"
        :marked="entry.number === marked"
        @mark="mark"
        @select="open"
      />
    </template>
  </UAccordion>

  <ReviewDetail
    v-model:open="isDetailOpen"
    :entry="selected"
  />
</template>

<script setup lang="ts">
const props = defineProps<{
  entries: ReviewEntryView[]
}>()

// The view state lives here rather than in the page, so the accordion and the
// detail share one owner instead of two copies of the same refs.
const { expanded, marked, mark } = useReviewViewState()

const selected = ref<ReviewEntryView | null>(null)
const isDetailOpen = ref(false)

// The entry comes straight from the list, so opening a detail costs no
// request and going back and forth stays instant.
function open(entry: ReviewEntryView) {
  selected.value = entry
  isDetailOpen.value = true
  mark(entry.number)
}

// REVIEW_BUCKETS carries the order, so the list cannot drift from the chain
// that assigns the buckets. Empty groups are dropped: a heading with a zero
// next to it is noise, not information.
const groups = computed(() =>
  REVIEW_BUCKETS
    .map(bucket => ({
      value: bucket.key,
      label: bucket.label,
      hint: bucket.hint,
      entries: sortBucketEntries(
        props.entries.filter(entry => entry.bucket === bucket.key),
        bucket.sort,
      ),
    }))
    .filter(group => group.entries.length > 0),
)
</script>
