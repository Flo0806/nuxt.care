<template>
  <header class="mb-6">
    <AppHeaderMobile
      :version="version"
      :stars="stars"
      :sync-status="syncStatus"
      :critical-count="criticalCount"
      @show-critical="$emit('show-critical')"
    />
    <AppHeaderDesktop
      :version="version"
      :stars="stars"
      :sync-status="syncStatus"
      :critical-count="criticalCount"
      @show-critical="$emit('show-critical')"
    />
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

const { public: { version } } = useRuntimeConfig()

const { data: repoData } = await useFetch<{ stargazers_count: number }>(
  'https://api.github.com/repos/Flo0806/nuxt.care',
  { server: false },
)

const stars = computed(() => repoData.value?.stargazers_count ?? 0)
</script>
