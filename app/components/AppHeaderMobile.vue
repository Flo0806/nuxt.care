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
          <a
            href="https://github.com/Flo0806/nuxt.care"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400 hover:text-primary-500 transition-colors"
          >
            <UIcon
              name="i-lucide-star"
              class="w-3 h-3"
            />
            <UBadge
              color="neutral"
              variant="subtle"
              size="xs"
            >
              {{ stars }}
            </UBadge>
          </a>
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
  syncStatus?: SyncMeta | null
  criticalCount: number
}>()

defineEmits<{
  'show-critical': []
}>()
</script>
