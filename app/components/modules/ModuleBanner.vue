<template>
  <div
    v-if="newestModules.length || popularModules.length"
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
          :class="cardClass(index)"
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

const newClasses = [
  'bg-emerald-100 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 hover:border-emerald-400',
  'bg-emerald-100 dark:bg-emerald-950/35 border-emerald-300 dark:border-emerald-700 hover:border-emerald-400',
  'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400',
  'bg-emerald-50 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-800 hover:border-emerald-300',
  'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 hover:border-emerald-300',
  'bg-emerald-50/60 dark:bg-emerald-950/15 border-emerald-200/80 dark:border-emerald-800/80 hover:border-emerald-300',
  'bg-emerald-50/50 dark:bg-emerald-950/12 border-emerald-200/70 dark:border-emerald-800/70 hover:border-emerald-300',
  'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200/60 dark:border-emerald-800/60 hover:border-emerald-300',
  'bg-emerald-50/30 dark:bg-emerald-950/8 border-emerald-200/50 dark:border-emerald-800/50 hover:border-emerald-300',
  'bg-emerald-50/20 dark:bg-emerald-950/5 border-emerald-200/40 dark:border-emerald-800/40 hover:border-emerald-300',
]

const popularClasses = [
  'bg-blue-100 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 hover:border-blue-400',
  'bg-blue-100 dark:bg-blue-950/35 border-blue-300 dark:border-blue-700 hover:border-blue-400',
  'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 hover:border-blue-400',
  'bg-blue-50 dark:bg-blue-950/25 border-blue-200 dark:border-blue-800 hover:border-blue-300',
  'bg-blue-50/80 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 hover:border-blue-300',
  'bg-blue-50/60 dark:bg-blue-950/15 border-blue-200/80 dark:border-blue-800/80 hover:border-blue-300',
  'bg-blue-50/50 dark:bg-blue-950/12 border-blue-200/70 dark:border-blue-800/70 hover:border-blue-300',
  'bg-blue-50/40 dark:bg-blue-950/10 border-blue-200/60 dark:border-blue-800/60 hover:border-blue-300',
  'bg-blue-50/30 dark:bg-blue-950/8 border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300',
  'bg-blue-50/20 dark:bg-blue-950/5 border-blue-200/40 dark:border-blue-800/40 hover:border-blue-300',
]

function cardClass(index: number): string {
  const classes = mode.value === 'new' ? newClasses : popularClasses
  return classes[Math.min(index, classes.length - 1)] ?? classes[0]
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
