<template>
  <div class="flex gap-3">
    <img
      :src="`https://github.com/${user}.png?size=64`"
      :alt="user"
      class="w-7 h-7 rounded-full shrink-0 mt-0.5 bg-neutral-200 dark:bg-neutral-800"
      loading="lazy"
    >

    <div class="min-w-0 flex-1">
      <div class="flex items-baseline gap-2 mb-1">
        <span class="text-sm font-medium text-neutral-800 dark:text-neutral-200">{{ user }}</span>
        <span class="text-xs text-neutral-400">{{ formatDate(at) }}</span>
        <UBadge
          v-if="highlight"
          color="warning"
          variant="subtle"
          size="sm"
          class="ml-auto"
        >
          on hold
        </UBadge>
      </div>

      <div
        class="rounded-lg rounded-tl-none px-3 py-2 break-words"
        :class="highlight
          ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-neutral-800 dark:text-neutral-200'
          : 'bg-neutral-100 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300'"
      >
        <slot>
          <ReviewCommentBody
            v-if="body"
            :body="body"
          />
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  user: string
  at: string
  body?: string
  /** Marks the comment that put the submission on hold. */
  highlight?: boolean
}>()
</script>
