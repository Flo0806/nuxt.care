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

      <ReviewProgress
        v-if="runStatus?.isRunning"
        :meta="runStatus"
      />

      <!--
        Only the very first load empties the page. `status` is pending while
        reloading too, and swapping the list out then would tear down the open
        detail and build it again, which reads as the slideover flickering.
      -->
      <div
        v-if="status === 'pending' && !data"
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
        :last-run="data.meta.lastRun"
        @refreshed="refresh"
      />

      <AppFooter />
    </div>
  </main>
</template>

<script setup lang="ts">
const { data, status, error, refresh } = await useFetch('/api/review/prs')

// Small endpoint on purpose: the list is around 190 KB, and polling that every
// five seconds to read two numbers would be wasteful. It also resets a lock
// left behind by a run whose process died.
const { data: runStatus, refresh: refreshStatus } = await useFetch('/api/review/status', {
  key: 'review-status',
})

// Same shape as the module page: poll while a run is going, and read the
// entries once more when it finishes.
const wasRunning = ref(runStatus.value?.isRunning ?? false)
let interval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  interval = setInterval(async () => {
    const before = wasRunning.value
    await refreshStatus()

    const running = runStatus.value?.isRunning ?? false
    if (before && !running) await refresh()

    wasRunning.value = running
  }, 5000)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})

useHead({
  title: 'Modules in review - nuxt.care',
})
</script>
