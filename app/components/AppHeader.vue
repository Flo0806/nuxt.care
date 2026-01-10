<template>
  <header class="flex items-center justify-between mb-6">
    <div class="flex items-center gap-4">
      <img
        src="/images/nuxamine-logo.png"
        alt="Nuxamine Logo"
        class="h-12 w-12"
      >
      <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">
        Nuxamine
      </h1>
    </div>
    <div class="flex items-center gap-4">
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

defineProps<{
  syncStatus?: SyncMeta | null
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
