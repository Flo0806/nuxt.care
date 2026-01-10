<script setup lang="ts">
defineProps<{
  type?: 'info' | 'warning' | 'error' | 'success'
}>()
</script>

<template>
  <div :class="['callout', `callout-${type || 'info'}`]">
    <slot />
  </div>
</template>
