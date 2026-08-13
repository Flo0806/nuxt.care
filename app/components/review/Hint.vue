<template>
  <p class="flex items-start gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
    <UIcon
      name="i-lucide-info"
      class="w-3.5 h-3.5 shrink-0 mt-0.5 text-neutral-400"
    />
    <span><slot /></span>
  </p>
</template>

<script setup lang="ts">
// Explanation, marked as one.
//
// Grey text on its own reads like data somebody forgot to style. The icon says
// "this sentence tells you what you are looking at", which is the difference
// between reading a list and working out what a list is.
</script>
