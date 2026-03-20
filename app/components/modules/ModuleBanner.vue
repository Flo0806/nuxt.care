<template>
  <div
    v-if="displayModules.length"
    class="mb-6"
  >
    <!-- Header with toggle -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <UIcon
          :name="mode === 'new' ? 'i-lucide-sparkles' : 'i-lucide-trending-up'"
          class="w-4 h-4 text-primary-500"
        />
        <span class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          {{ mode === 'new' ? 'Recently Published' : 'Most Popular' }}
        </span>
      </div>
      <button
        class="text-xs text-neutral-500 hover:text-primary-500 transition-colors flex items-center gap-1"
        @click="toggleMode"
      >
        <UIcon
          :name="mode === 'new' ? 'i-lucide-trending-up' : 'i-lucide-sparkles'"
          class="w-3 h-3"
        />
        {{ mode === 'new' ? 'Most Popular' : 'Recently Published' }}
      </button>
    </div>

    <!-- Carousel -->
    <UCarousel
      :items="displayModules"
      :ui="{
        item: 'basis-56 ps-3',
        prev: 'sm:start-8 sm:invisible sm:group-hover:visible',
        next: 'sm:end-8 sm:invisible sm:group-hover:visible',
        container: 'ms-0',
      }"
      class="group"
      loop
      align="start"
      arrows
      :prev="{ variant: 'solid', size: 'xs' }"
      :next="{ variant: 'solid', size: 'xs' }"
    >
      <template #default="{ item, index }">
        <button
          class="w-full h-full p-3 rounded-lg border transition-colors text-left"
          :class="mode === 'new'
            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600'
            : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600'"
          @click="$emit('select', item)"
        >
          <!-- Rank + Name + Score -->
          <div class="flex items-center gap-2 mb-1.5">
            <span
              class="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white shrink-0"
              :class="index < 3 ? 'bg-primary-500' : 'bg-neutral-400 dark:bg-neutral-600'"
            >
              {{ index + 1 }}
            </span>
            <span class="text-sm font-semibold text-neutral-900 dark:text-white truncate min-w-0">
              {{ item.name }}
            </span>
            <ModulesScoreBadge
              :score="item.health.score"
              :signals="item.health.signals"
              class="text-xs shrink-0 ml-auto"
            />
          </div>

          <p class="text-xs text-neutral-500 line-clamp-1 mb-2">
            {{ item.description }}
          </p>

          <div class="flex items-center gap-2 text-[10px] text-neutral-400">
            <span
              v-if="mode === 'new' && item.npm?.lastPublish"
              class="flex items-center gap-0.5"
            >
              <UIcon
                name="i-lucide-clock"
                class="w-3 h-3"
              />
              {{ formatRelative(item.npm.lastPublish) }}
            </span>
            <span
              v-if="mode === 'popular' && item.npm?.downloads"
              class="flex items-center gap-0.5"
            >
              <UIcon
                name="i-lucide-download"
                class="w-3 h-3"
              />
              {{ formatNumber(item.npm.downloads) }}/w
            </span>
            <span
              v-if="item.github?.stars"
              class="flex items-center gap-0.5"
            >
              <UIcon
                name="i-lucide-star"
                class="w-3 h-3"
              />
              {{ formatNumber(item.github.stars) }}
            </span>
            <UBadge
              v-if="item.type === 'official'"
              color="primary"
              variant="subtle"
              size="xs"
            >
              Official
            </UBadge>
          </div>
        </button>
      </template>
    </UCarousel>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modules: ModuleData[]
}>()

defineEmits<{
  select: [mod: ModuleData]
}>()

const mode = ref<'new' | 'popular'>('new')

function toggleMode() {
  mode.value = mode.value === 'new' ? 'popular' : 'new'
}

const newestModules = computed(() => {
  return [...props.modules]
    .filter(m => m.npm?.lastPublish)
    .sort((a, b) => new Date(b.npm!.lastPublish).getTime() - new Date(a.npm!.lastPublish).getTime())
    .slice(0, 10)
})

const popularModules = computed(() => {
  return [...props.modules]
    .sort((a, b) => (b.npm?.downloads ?? 0) - (a.npm?.downloads ?? 0))
    .slice(0, 10)
})

const displayModules = computed(() => {
  return mode.value === 'new' ? newestModules.value : popularModules.value
})
</script>
