<template>
  <div class="hidden sm:flex items-center justify-between">
    <!-- Left: Logo + Title + Links -->
    <div class="flex items-center gap-4">
      <NuxtLink
        to="/"
        class="shrink-0 transition-opacity hover:opacity-80"
        aria-label="Go to homepage"
      >
        <img
          src="/images/nuxt.care-logo.svg"
          alt="nuxt.care Logo"
          class="h-12 w-12"
        >
      </NuxtLink>
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <NuxtLink
            to="/"
            class="transition-colors hover:text-primary-500"
          >
            nuxt.care
          </NuxtLink>
          <UBadge
            color="primary"
            variant="subtle"
            size="xs"
          >
            v{{ version }}
          </UBadge>
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
          <button
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer"
            :class="hasStarred
              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:text-yellow-600'"
            :disabled="starLoading"
            @click="$emit('star')"
          >
            <UIcon
              :name="starLoading ? 'i-lucide-loader-2' : 'i-lucide-star'"
              class="w-3.5 h-3.5"
              :class="{ 'fill-current': hasStarred && !starLoading, 'animate-spin': starLoading }"
            />
            {{ hasStarred ? 'Starred' : 'Star' }}
            <UBadge
              color="neutral"
              variant="subtle"
              size="xs"
            >
              {{ stars }}
            </UBadge>
          </button>
        </div>
      </div>
    </div>

    <!-- Right: Actions -->
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
      <UTooltip text="Connect your AI via MCP">
        <button
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors cursor-pointer"
          @click="mcpOpen = true"
        >
          <UIcon
            name="i-lucide-bot"
            class="w-3.5 h-3.5"
          />
          MCP
        </button>
      </UTooltip>
      <McpConnectDialog v-model:open="mcpOpen" />
      <UTooltip text="View source on GitHub">
        <a
          href="https://github.com/Flo0806/nuxt.care"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View source on GitHub"
          class="inline-flex items-center justify-center w-8 h-8 rounded-md text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <UIcon
            name="i-simple-icons-github"
            class="w-5 h-5"
          />
        </a>
      </UTooltip>
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

const mcpOpen = ref(false)

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
