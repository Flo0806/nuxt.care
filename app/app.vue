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
  title: 'Nuxamine',
  titleTemplate: '%s - Nuxt Module Health Check',
  meta: [
    { name: 'description', content: 'Health-Check & Audit Tool for Nuxt Modules' },
  ],
})
</script>
