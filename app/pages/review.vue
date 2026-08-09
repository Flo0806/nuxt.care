<template>
  <main class="min-h-screen bg-neutral-50 dark:bg-neutral-950">
    <div class="container mx-auto px-4 py-8">
      <AppHeader />

      <ViewSwitch />

      <div class="mb-6">
        <h1 class="text-xl font-bold text-neutral-900 dark:text-white">
          Modules in review
        </h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Modules submitted to
          <a
            href="https://github.com/nuxt/modules/pulls"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary-500 hover:underline"
          >nuxt/modules</a>
          that are not merged yet - analysed before they land in the registry.
        </p>
      </div>

      <!-- Placeholder until the review API exists -->
      <div class="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 py-16 text-center">
        <UIcon
          name="i-lucide-git-pull-request"
          class="w-10 h-10 mx-auto text-neutral-400 mb-3"
        />
        <p class="text-neutral-600 dark:text-neutral-400">
          The review data is not wired up yet.
        </p>
        <p class="text-sm text-neutral-500 dark:text-neutral-500 mt-1">
          Next step: the analysis core that scores a module without relying on the synced cache.
        </p>
      </div>

      <AppFooter />
    </div>
  </main>
</template>

<script setup lang="ts">
useHead({
  title: 'Modules in review - nuxt.care',
})
</script>
