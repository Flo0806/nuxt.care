<template>
  <main class="min-h-screen bg-neutral-50 dark:bg-neutral-950">
    <div class="container mx-auto px-4 py-8">
      <AppHeader />

      <UButton
        to="/"
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="ghost"
        size="sm"
        class="mb-4"
      >
        Back
      </UButton>

      <div
        v-if="!isLoggedIn"
        class="text-center py-16"
      >
        <UIcon
          name="i-lucide-lock"
          class="w-12 h-12 mx-auto text-neutral-400 mb-4"
        />
        <h1 class="text-xl font-bold text-neutral-900 dark:text-white mb-2">
          Sign in to see your maintainer dashboard
        </h1>
        <p class="text-neutral-500 mb-6">
          Log in with GitHub to see health scores and action hints for the modules you maintain.
        </p>
        <UButton
          color="primary"
          icon="i-lucide-github"
          @click="() => { login() }"
        >
          Sign in with GitHub
        </UButton>
      </div>

      <div v-else-if="pending">
        <div class="text-neutral-500 py-8">
          Loading your modules...
        </div>
      </div>

      <div
        v-else-if="!entries.length"
        class="text-center py-16"
      >
        <UIcon
          name="i-lucide-package-search"
          class="w-12 h-12 mx-auto text-neutral-400 mb-4"
        />
        <h1 class="text-xl font-bold text-neutral-900 dark:text-white mb-2">
          No modules found
        </h1>
        <p class="text-neutral-500">
          We couldn't find any Nuxt modules where you're an owner or contributor.
        </p>
      </div>

      <template v-else>
        <MaintainerHero :entries="entries" />

        <div
          v-if="ownedModules.length"
          class="mb-8"
        >
          <h2 class="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3 flex items-center gap-2">
            <UIcon
              name="i-lucide-crown"
              class="w-4 h-4 text-primary-500"
            />
            Your modules ({{ ownedModules.length }})
          </h2>
          <div class="grid gap-3">
            <MaintainerModuleCard
              v-for="entry in ownedModules"
              :key="entry.module.name"
              :entry="entry"
            />
          </div>
        </div>

        <div v-if="contributorModules.length">
          <h2 class="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3 flex items-center gap-2">
            <UIcon
              name="i-lucide-users"
              class="w-4 h-4 text-neutral-500"
            />
            You contribute to ({{ contributorModules.length }})
          </h2>
          <div class="grid gap-3">
            <MaintainerModuleCard
              v-for="entry in contributorModules"
              :key="entry.module.name"
              :entry="entry"
            />
          </div>
        </div>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import type { ModuleData } from '~~/shared/types/modules'
import type { MaintainerModule } from '~/composables/useMaintainerModules'

useHead({ title: 'Maintainer Dashboard' })

const { isLoggedIn, login } = useAuth()

const { data: modules, pending } = await useFetch<ModuleData[]>('/api/modules', {
  key: 'modules',
  server: false,
})

const { maintainerModules, ownedModules: rawOwned, contributorModules: rawContrib } = useMaintainerModules(modules)

function byPotentialGain(a: MaintainerModule, b: MaintainerModule) {
  const gainA = potentialScore(a.module) - (a.module.health?.score ?? 0)
  const gainB = potentialScore(b.module) - (b.module.health?.score ?? 0)
  return gainB - gainA
}

const ownedModules = computed(() => [...rawOwned.value].sort(byPotentialGain))
const contributorModules = computed(() => [...rawContrib.value].sort(byPotentialGain))
const entries = maintainerModules
</script>
