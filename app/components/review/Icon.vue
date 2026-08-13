<template>
  <img
    v-if="url && !failed"
    :src="url"
    :alt="`${name} icon`"
    class="object-contain shrink-0 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
    :class="sizeClass"
    loading="lazy"
    @error="failed = true"
  >
  <span
    v-else
    class="shrink-0 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
    :class="sizeClass"
  >
    <UIcon
      name="i-lucide-package"
      :class="size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5'"
    />
  </span>
</template>

<script setup lang="ts">
// The module icon of a submission.
//
// It is read from a commit that is not merged, so a missing file is normal
// rather than an error. Both places that show one need the same fallback, so
// the handling lives here instead of twice.

const props = defineProps<{
  entry: ReviewEntryView
  size?: 'sm' | 'lg'
}>()

const url = computed(() => reviewIconUrl(props.entry))
const name = computed(() => yamlText(props.entry.yaml, 'name') ?? props.entry.title)

const sizeClass = computed(() =>
  props.size === 'lg'
    ? 'w-12 h-12 rounded-lg p-1.5'
    : 'w-7 h-7 rounded-md p-1')

const failed = ref(false)
watch(() => props.entry.number, () => {
  failed.value = false
})
</script>
