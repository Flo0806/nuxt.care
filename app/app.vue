<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </UApp>
</template>

<script setup lang="ts">
useHead({
  htmlAttrs: {
    lang: 'en',
  },
  title: 'nuxt.care',
  titleTemplate: '%s | nuxt.care',
  meta: [
    { name: 'description', content: 'Health-Check & Audit Tool for Nuxt Modules' },
  ],
})
</script>
