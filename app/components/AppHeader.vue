<template>
  <header class="flex items-center justify-between mb-6">
    <div class="flex items-center gap-4">
      <img
        src="/images/nuxamine-logo.png"
        alt="Nuxamine Logo"
        class="h-12 w-12"
      >
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">
          Nuxamine
        </h1>
        <div class="flex items-center gap-3">
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
          <span class="text-neutral-300 dark:text-neutral-600">|</span>
          <a
            href="https://github.com/Flo0806/nuxamine"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400 hover:text-primary-500 transition-colors"
          >
            <UIcon
              name="i-lucide-star"
              class="w-3 h-3"
            />
            Star on GitHub
          </a>
        </div>
      </div>
    </div>
    <div class="flex items-center gap-4">
      <UTooltip
        v-if="criticalCount > 0"
        text="Click to show critical modules"
      >
        <button
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
          @click="$emit('show-critical')"
        >
          <UIcon
            name="i-lucide-alert-triangle"
            class="w-4 h-4"
          />
          {{ criticalCount }} Critical
        </button>
      </UTooltip>
      <span
        v-if="syncStatus?.lastSync"
        class="text-xs text-neutral-600 dark:text-neutral-400"
      >
        Updated {{ formatTimeAgo(syncStatus.lastSync) }}
      </span>
      <UBadge
        v-if="syncStatus?.isRunning"
        color="warning"
        variant="soft"
      >
        Syncing {{ syncStatus.syncedModules }}/{{ syncStatus.totalModules }}
      </UBadge>
      <UColorModeButton />
    </div>
  </header>
</template>

<script setup lang="ts">
import type { SyncMeta } from '~~/shared/types/modules'

withDefaults(defineProps<{
  syncStatus?: SyncMeta | null
  criticalCount?: number
}>(), {
  criticalCount: 0,
})

defineEmits<{
  'show-critical': []
}>()

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = Date.now()
  const diff = now - date.getTime()

  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
</script>
