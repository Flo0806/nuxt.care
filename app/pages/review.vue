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

      <p
        v-if="data?.meta.lastRun"
        class="text-xs text-neutral-400 mb-4"
      >
        {{ data.total }} submissions, last checked {{ formatRelative(data.meta.lastRun) }}
      </p>

      <div
        v-if="status === 'pending'"
        class="py-16 text-center text-sm text-neutral-500"
      >
        Loading...
      </div>

      <div
        v-else-if="error"
        class="py-16 text-center text-sm text-red-500"
      >
        Could not load the submissions.
      </div>

      <div
        v-else-if="!data?.entries.length"
        class="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 py-16 text-center"
      >
        <p class="text-neutral-600 dark:text-neutral-400">
          The cache is empty.
        </p>
        <p class="text-sm text-neutral-500 mt-1">
          Fill it with <code class="font-mono">POST /api/review/run</code>.
        </p>
      </div>

      <ReviewList
        v-else
        :entries="data.entries"
      />

      <AppFooter />
    </div>
  </main>
</template>

<script setup lang="ts">
const { data, status, error } = await useFetch('/api/review/prs')

useHead({
  title: 'Modules in review - nuxt.care',
})
</script>
