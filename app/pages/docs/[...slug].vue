<script lang="ts" setup>
const route = useRoute()

const { data: page } = await useAsyncData(route.path, () => {
  return queryCollection('content').path(route.path).first()
})

const { data: navigation } = await useAsyncData('docs-nav', async () => {
  const docs = await queryCollection('content').all()
  return docs.sort((a, b) => (a.navigation?.order ?? 99) - (b.navigation?.order ?? 99))
})
</script>

<template>
  <main class="min-h-screen bg-neutral-50 dark:bg-neutral-950">
    <div class="container mx-auto px-4 py-8">
      <AppHeader />

      <div class="flex gap-8">
        <aside class="w-56 shrink-0">
          <nav class="sticky top-8">
            <NuxtLink
              to="/"
              class="inline-flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary-500 mb-6"
            >
              <UIcon
                name="i-lucide-arrow-left"
                class="w-4 h-4"
              />
              Back to App
            </NuxtLink>
            <h2 class="font-semibold text-sm uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-3">
              Documentation
            </h2>
            <ul class="space-y-1">
              <li
                v-for="item in navigation"
                :key="item.path"
              >
                <NuxtLink
                  :to="item.path"
                  class="block px-3 py-2 rounded-md text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  exact-active-class="bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                >
                  {{ item.title }}
                </NuxtLink>
              </li>
            </ul>
          </nav>
        </aside>

        <article class="flex-1 min-w-0 max-w-3xl prose prose-neutral dark:prose-invert">
          <ContentRenderer
            v-if="page"
            :value="page"
          />
          <div v-else>
            <h1>Page Not Found</h1>
            <NuxtLink to="/docs">
              Back to docs
            </NuxtLink>
          </div>
        </article>
      </div>

      <AppFooter />
    </div>
  </main>
</template>
