<template>
  <div class="sm:hidden">
    <!-- Top row: Logo + Title + Links | Version -->
    <div class="flex items-start justify-between gap-2 mb-2">
      <div class="flex items-center gap-3">
        <img
          src="/images/nuxt.care-logo.svg"
          alt="nuxt.care Logo"
          class="h-10 w-10"
        >
        <div class="flex items-center gap-2 flex-wrap">
          <h1 class="text-xl font-bold text-neutral-900 dark:text-white">
            nuxt.care
          </h1>
          <NuxtLink
            to="/docs"
            class="inline-flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400 hover:text-primary-500 transition-colors"
          >
            <UIcon
              name="i-lucide-book-open"
              class="w-3 h-3"
            />
            Docs
          </NuxtLink>
          <button
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium transition-colors cursor-pointer"
            :class="hasStarred
              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'"
            :disabled="starLoading"
            :aria-label="starLoading ? 'Loading star status' : hasStarred ? `Unstar repository, ${stars} stars` : `Star repository, ${stars} stars`"
            :aria-pressed="isLoggedIn ? hasStarred : undefined"
            @click="$emit('star')"
          >
            <UIcon
              :name="starLoading ? 'i-lucide-loader-2' : 'i-lucide-star'"
              class="w-3 h-3"
              :class="{ 'fill-current': hasStarred && !starLoading, 'animate-spin': starLoading }"
            />
            {{ stars }}
          </button>
        </div>
      </div>
      <UBadge
        color="primary"
        variant="subtle"
        size="xs"
        class="shrink-0"
      >
        v{{ version }}
      </UBadge>
    </div>

    <!-- Actions row -->
    <div class="flex items-center gap-2 flex-wrap">
      <UTooltip
        v-if="criticalCount > 0"
        text="Click to show critical modules"
      >
        <button
          class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
          @click="$emit('show-critical')"
        >
          <UIcon
            name="i-lucide-alert-triangle"
            class="w-4 h-4"
          />
          {{ criticalCount }} Critical
        </button>
      </UTooltip>
      <UBadge
        v-if="syncStatus?.isRunning"
        color="warning"
        variant="soft"
        size="xs"
      >
        Syncing {{ syncStatus.syncedModules }}/{{ syncStatus.totalModules }}
      </UBadge>
      <div class="flex-1" />
      <UTooltip text="Sponsor this project">
        <a
          href="https://github.com/sponsors/Flo0806"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center justify-center w-8 h-8 rounded-md text-pink-500 hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-colors"
        >
          <UIcon
            name="i-lucide-heart"
            class="w-5 h-5"
          />
        </a>
      </UTooltip>
      <AuthButton />
      <UColorModeButton />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SyncMeta } from '~~/shared/types/modules'

defineProps<{
  version: string
  stars: number
  hasStarred: boolean
  starLoading: boolean
  isLoggedIn: boolean
  syncStatus?: SyncMeta | null
  criticalCount: number
}>()

defineEmits<{
  'show-critical': []
  'star': []
}>()
</script>
