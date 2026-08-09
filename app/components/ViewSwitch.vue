<template>
  <nav
    class="mb-6 inline-flex items-center gap-1 p-1 rounded-lg bg-neutral-100 dark:bg-neutral-900"
    aria-label="View"
  >
    <NuxtLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      :aria-current="isActive(item.to) ? 'page' : undefined"
      class="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
      :class="isActive(item.to)
        ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'"
    >
      <UIcon
        :name="item.icon"
        class="w-4 h-4"
      />
      {{ item.label }}
      <UBadge
        v-if="item.count != null"
        color="neutral"
        variant="subtle"
        size="xs"
      >
        {{ item.count }}
      </UBadge>
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
const props = defineProps<{
  /** Number of modules currently in review - omitted until the data is available */
  reviewCount?: number
}>()

const route = useRoute()

const items = computed(() => [
  { to: '/', label: 'Modules', icon: 'i-lucide-package', count: undefined as number | undefined },
  { to: '/review', label: 'In Review', icon: 'i-lucide-git-pull-request', count: props.reviewCount },
])

function isActive(to: string): boolean {
  return route.path === to
}
</script>
