<template>
  <div class="flex gap-3">
    <dt class="w-28 shrink-0 text-neutral-400 capitalize">
      {{ label }}
    </dt>
    <dd
      class="min-w-0 break-words text-neutral-700 dark:text-neutral-300"
      :class="{ 'font-mono text-xs': mono }"
    >
      {{ value }}
    </dd>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: string
  mono?: boolean
}>()
</script>
