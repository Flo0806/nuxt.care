<template>
  <header class="mb-6">
    <AppHeaderMobile
      :version="version"
      :stars="stars"
      :has-starred="hasStarred"
      :star-loading="starLoading"
      :is-logged-in="isLoggedIn"
      :sync-status="syncStatus"
      :critical-count="criticalCount"
      @show-critical="$emit('show-critical')"
      @star="handleStar"
    />
    <AppHeaderDesktop
      :version="version"
      :stars="stars"
      :has-starred="hasStarred"
      :star-loading="starLoading"
      :is-logged-in="isLoggedIn"
      :sync-status="syncStatus"
      :critical-count="criticalCount"
      @show-critical="$emit('show-critical')"
      @star="handleStar"
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
const { isLoggedIn } = useAuth()

const REPO = 'Flo0806/nuxt.care'

const stars = ref(0)
const hasStarred = ref(false)
const starLoading = ref(true)

onMounted(async () => {
  try {
    const data = await $fetch<{ stargazers_count: number }>(`https://api.github.com/repos/${REPO}`)
    stars.value = data.stargazers_count

    if (isLoggedIn.value) {
      const { starred } = await $fetch<{ starred: boolean }>(`/api/stars/${REPO}`)
      hasStarred.value = starred
    }
  }
  catch { /* ignore */ }
  finally {
    starLoading.value = false
  }
})

async function handleStar() {
  if (!isLoggedIn.value) {
    window.open(`https://github.com/${REPO}`, '_blank')
    return
  }
  starLoading.value = true
  try {
    const { starred } = await $fetch<{ starred: boolean }>(`/api/stars/${REPO}`, { method: 'POST' })
    hasStarred.value = starred
    stars.value += starred ? 1 : -1
  }
  catch { /* ignore */ }
  finally {
    starLoading.value = false
  }
}
</script>
