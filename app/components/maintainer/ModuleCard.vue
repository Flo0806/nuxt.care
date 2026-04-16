<template>
  <div
    class="rounded-lg p-4 bg-white dark:bg-neutral-900 transition-all relative overflow-hidden"
    :class="isPerfect
      ? 'perfect-card border border-amber-300 dark:border-amber-500/40 shadow-[0_0_20px_rgba(251,191,36,0.15)]'
      : 'border border-neutral-200 dark:border-neutral-800'"
  >
    <div class="flex items-start justify-between gap-3 mb-3">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 flex-wrap">
          <a
            v-if="repoUrl"
            :href="repoUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="font-semibold text-neutral-900 dark:text-white truncate hover:text-primary-500 transition-colors inline-flex items-center gap-1"
          >
            {{ entry.module.name }}
            <UIcon
              name="i-lucide-external-link"
              class="w-3 h-3 text-neutral-400"
            />
          </a>
          <h3
            v-else
            class="font-semibold text-neutral-900 dark:text-white truncate"
          >
            {{ entry.module.name }}
          </h3>
          <UBadge
            v-if="entry.role === 'contributor'"
            color="neutral"
            variant="soft"
            size="xs"
          >
            Contributor
          </UBadge>
          <UBadge
            v-else
            color="primary"
            variant="soft"
            size="xs"
          >
            Owner
          </UBadge>
          <UTooltip
            v-if="isPerfect"
            text="Perfect — nothing left to improve on this one. Keep it up!"
          >
            <UIcon
              name="i-lucide-award"
              class="w-4 h-4 text-amber-400"
            />
          </UTooltip>
        </div>
        <p class="text-xs text-neutral-500 truncate mt-0.5">
          {{ entry.module.npmPackage }}
        </p>
        <p
          v-if="entry.module.description"
          class="text-sm text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-2"
        >
          {{ entry.module.description }}
        </p>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <ModulesScoreBadge
          :score="entry.module.health.score"
          :signals="entry.module.health.signals"
        />
        <UIcon
          v-if="potential > entry.module.health.score"
          name="i-lucide-trending-up"
          class="w-4 h-4 text-primary-500"
        />
      </div>
    </div>

    <UAlert
      v-if="isDeprecated"
      icon="i-lucide-alert-triangle"
      color="error"
      variant="subtle"
      title="Deprecated on npm"
      description="The first action below restores up to 50 points."
      class="mb-3"
    />
    <UAlert
      v-else-if="isArchived"
      icon="i-lucide-archive"
      color="warning"
      variant="subtle"
      title="Archived on GitHub"
      description="The first action below restores up to 30 points."
      class="mb-3"
    />

    <div
      v-if="hints.length"
      class="space-y-2"
    >
      <div class="flex items-center justify-between text-xs text-neutral-500">
        <span>Potential: <span class="font-semibold text-primary-500">{{ potential }}/100</span></span>
        <span>{{ hints.length }} {{ hints.length === 1 ? 'action' : 'actions' }}</span>
      </div>
      <ul class="space-y-1.5">
        <li
          v-for="hint in hints"
          :key="hint.key"
          class="text-sm p-2 rounded bg-neutral-50 dark:bg-neutral-800/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          :class="hasDetails(hint) ? 'cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800' : ''"
          :role="hasDetails(hint) ? 'button' : undefined"
          :tabindex="hasDetails(hint) ? 0 : undefined"
          :aria-expanded="hasDetails(hint) ? expanded.has(hint.key) : undefined"
          @click="hasDetails(hint) && toggleExpanded(hint.key)"
          @keydown.enter.prevent="hasDetails(hint) && toggleExpanded(hint.key)"
          @keydown.space.prevent="hasDetails(hint) && toggleExpanded(hint.key)"
        >
          <div class="flex items-center gap-2">
            <span class="shrink-0 text-xs font-mono font-bold text-primary-500">+{{ hint.gain }}</span>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5">
                <span class="font-medium text-neutral-900 dark:text-white">{{ hint.title }}</span>
                <a
                  v-if="hint.docsUrl"
                  :href="hint.docsUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-neutral-400 hover:text-primary-500"
                  @click.stop
                >
                  <UIcon
                    name="i-lucide-external-link"
                    class="w-3 h-3"
                  />
                </a>
              </div>
              <p class="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                {{ hint.description }}
              </p>
            </div>
            <UIcon
              v-if="hasDetails(hint)"
              :name="expanded.has(hint.key) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
              class="shrink-0 w-4 h-4 text-neutral-400"
            />
          </div>
          <div
            v-if="expanded.has(hint.key) && hasDetails(hint)"
            class="mt-3 ml-6 space-y-3 text-xs"
            @click.stop
          >
            <p
              v-if="hint.details"
              class="text-neutral-600 dark:text-neutral-400"
            >
              {{ hint.details }}
            </p>
            <div
              v-if="hint.snippets?.length"
              class="space-y-2"
            >
              <div
                v-for="(snippet, i) in hint.snippets"
                :key="i"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="text-neutral-500 font-medium">{{ snippet.label }}</span>
                  <button
                    class="text-neutral-400 hover:text-primary-500 flex items-center gap-1 text-xs"
                    @click="copySnippet(hint.key + ':' + i, snippet.code)"
                  >
                    <UIcon
                      :name="copiedSnippet === hint.key + ':' + i ? 'i-lucide-check' : 'i-lucide-copy'"
                      class="w-3 h-3"
                    />
                    {{ copiedSnippet === hint.key + ':' + i ? 'Copied' : 'Copy' }}
                  </button>
                </div>
                <pre class="p-2 rounded bg-neutral-900 dark:bg-black text-neutral-100 overflow-x-auto font-mono text-[11px] leading-relaxed">{{ snippet.code }}</pre>
              </div>
            </div>
            <ul
              v-if="hint.links?.length"
              class="space-y-1"
            >
              <li
                v-for="(link, i) in hint.links"
                :key="i"
              >
                <a
                  :href="link.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1"
                >
                  <UIcon
                    name="i-lucide-external-link"
                    class="w-3 h-3"
                  />
                  {{ link.label }}
                </a>
              </li>
            </ul>
          </div>
        </li>
      </ul>
    </div>
    <div
      v-else
      class="text-sm text-neutral-500 flex items-center gap-2"
    >
      <UIcon
        name="i-lucide-check-circle"
        class="w-4 h-4 text-green-500"
      />
      Nothing to improve — score at max for this module.
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MaintainerModule } from '~/composables/useMaintainerModules'
import type { ActionHint } from '~/utils/actionHints'

const props = defineProps<{
  entry: MaintainerModule
}>()

const expanded = ref(new Set<string>())
function toggleExpanded(key: string) {
  if (expanded.value.has(key)) expanded.value.delete(key)
  else expanded.value.add(key)
  expanded.value = new Set(expanded.value)
}

function hasDetails(hint: ActionHint): boolean {
  return !!(hint.details || hint.snippets?.length || hint.links?.length)
}

const copiedSnippet = ref<string | null>(null)
async function copySnippet(id: string, code: string) {
  try {
    await navigator.clipboard.writeText(code)
    copiedSnippet.value = id
    setTimeout(() => {
      if (copiedSnippet.value === id) copiedSnippet.value = null
    }, 2000)
  }
  catch { /* ignore */ }
}

const hints = computed(() => getActionHints(props.entry.module))
const potential = computed(() => potentialScore(props.entry.module))

const repoUrl = computed(() => {
  const fullName = props.entry.module.github?.fullName
  return fullName ? `https://github.com/${fullName}` : null
})

const isArchived = computed(() => props.entry.module.github?.archived === true)
const isDeprecated = computed(() => !!props.entry.module.npm?.deprecated)
const isPerfect = computed(() => hints.value.length === 0 && !isArchived.value && !isDeprecated.value)
</script>

<style scoped>
.perfect-card {
  transition: transform 0.4s cubic-bezier(0.2, 0, 0, 1),
              border-color 0.4s ease,
              box-shadow 0.4s ease;
}

.perfect-card:hover {
  transform: translateY(-2px);
  border-color: rgb(252 211 77);
  box-shadow: 0 10px 30px -10px rgba(251, 191, 36, 0.35),
              0 0 20px rgba(251, 191, 36, 0.15);
}

.perfect-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: -120%;
  width: 120%;
  height: 100%;
  background:
    linear-gradient(
      100deg,
      transparent 46%,
      rgba(255, 255, 255, 0.55) 50%,
      transparent 54%
    ),
    linear-gradient(
      100deg,
      transparent 0%,
      rgba(251, 191, 36, 0) 15%,
      rgba(251, 191, 36, 0.45) 50%,
      rgba(251, 191, 36, 0) 85%,
      transparent 100%
    );
  transform: skewX(-20deg);
  pointer-events: none;
}

.perfect-card:hover::after {
  left: 120%;
  transition: left 1.6s cubic-bezier(0.22, 1, 0.36, 1);
}
</style>
