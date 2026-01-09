<template>
  <span
    class="text-xs font-bold px-1.5 py-0.5 rounded"
    :class="colorClass"
  >
    {{ score }}
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{
  score: number
}>()

const colorClass = computed(() => {
  if (props.score >= 70) {
    return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
  }
  if (props.score >= 40) {
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
  }
  return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
})
</script>
