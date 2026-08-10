<template>
  <a
    :href="pr.html_url"
    target="_blank"
    rel="noopener noreferrer"
    class="flex items-center gap-3 px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 last:border-b-0 hover:bg-neutral-50 dark:hover:bg-neutral-900"
  >
    <span class="text-xs font-mono text-neutral-400 w-12 shrink-0">#{{ pr.number }}</span>

    <span class="flex-1 min-w-0 truncate text-sm text-neutral-900 dark:text-white">
      {{ pr.title }}
    </span>

    <UBadge
      v-if="pr.draft"
      color="neutral"
      variant="subtle"
      size="sm"
    >
      draft
    </UBadge>

    <UBadge
      v-for="label in pr.labels"
      :key="label.name"
      color="primary"
      variant="subtle"
      size="sm"
    >
      {{ label.name }}
    </UBadge>

    <span
      v-if="pr.user"
      class="flex items-center gap-1.5 shrink-0"
    >
      <img
        :src="pr.user.avatar_url"
        :alt="pr.user.login"
        class="w-5 h-5 rounded-full"
        loading="lazy"
      >
      <span class="text-xs text-neutral-500 hidden sm:inline">{{ pr.user.login }}</span>
    </span>

    <span class="text-xs text-neutral-400 w-20 text-right shrink-0">
      {{ formatRelative(pr.created_at) }}
    </span>
  </a>
</template>

<script setup lang="ts">
defineProps<{
  pr: GitHubPullRequestResponse
}>()
</script>
