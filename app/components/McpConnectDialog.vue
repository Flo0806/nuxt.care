<template>
  <UModal v-model:open="isOpen">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon
          name="i-lucide-bot"
          class="w-5 h-5 text-primary-500"
        />
        <span class="font-semibold">Connect your AI to nuxt.care</span>
      </div>
    </template>

    <template #body>
      <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
        Add nuxt.care as an MCP server so your AI can search, evaluate, and integrate Nuxt modules.
      </p>

      <!-- Tabs -->
      <div class="flex gap-1 mb-4">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
          :class="activeTab === tab.id
            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
            : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Config snippet -->
      <div class="relative">
        <pre class="p-4 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-mono overflow-x-auto"><code>{{ activeConfig }}</code></pre>
        <button
          class="absolute bottom-2 right-1 p-1.5 rounded-md bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 hover:border-primary-300 transition-colors cursor-pointer top-1 flex align-center justify-center h-7"
          @click="copyConfig"
        >
          <UIcon
            :name="copied ? 'i-lucide-check' : 'i-lucide-copy'"
            class="w-3.5 h-3.5"
            :class="copied ? 'text-green-500' : 'text-neutral-500'"
          />
        </button>
      </div>

      <!-- Instructions -->
      <div class="mt-4 text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
        <p v-if="activeTab === 'claude'">
          Run this command in your terminal, then restart Claude Code
        </p>
        <p v-else-if="activeTab === 'cursor'">
          Paste into <code class="px-1 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded">.cursor/mcp.json</code> in your project root
        </p>
        <p v-else-if="activeTab === 'copilot'">
          Paste into <code class="px-1 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded">.vscode/mcp.json</code> in your project root
        </p>
        <p v-else>
          Use this URL in any MCP-compatible AI tool
        </p>
      </div>

      <!-- Available tools -->
      <div class="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
        <p class="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          Your AI will have access to:
        </p>
        <div class="space-y-1.5">
          <div
            v-for="tool in tools"
            :key="tool.name"
            class="flex items-start gap-2 text-xs"
          >
            <UIcon
              :name="tool.icon"
              class="w-3.5 h-3.5 text-primary-500 mt-0.5 shrink-0"
            />
            <div>
              <span class="font-medium text-neutral-700 dark:text-neutral-300">{{ tool.name }}</span>
              <span class="text-neutral-500"> – {{ tool.description }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const isOpen = defineModel<boolean>('open', { default: false })

const activeTab = ref<'claude' | 'cursor' | 'copilot' | 'other'>('claude')
const copied = ref(false)

const MCP_URL = 'https://nuxt.care/api/mcp'

const tabs = [
  { id: 'claude' as const, label: 'Claude Code' },
  { id: 'cursor' as const, label: 'Cursor' },
  { id: 'copilot' as const, label: 'Copilot' },
  { id: 'other' as const, label: 'Other' },
]

const configs = {
  claude: `claude mcp add --transport http nuxt-care ${MCP_URL}`,
  cursor: JSON.stringify({
    mcpServers: {
      'nuxt-care': {
        url: MCP_URL,
      },
    },
  }, null, 2),
  copilot: JSON.stringify({
    servers: {
      'nuxt-care': {
        type: 'http',
        url: MCP_URL,
      },
    },
  }, null, 2),
  other: MCP_URL,
}

const activeConfig = computed(() => configs[activeTab.value])

const tools = [
  { name: 'module_search', description: 'Find modules by keyword', icon: 'i-lucide-search' },
  { name: 'module_health', description: 'Evaluate module quality & safety', icon: 'i-lucide-heart-pulse' },
  { name: 'module_context', description: 'Get setup instructions & README', icon: 'i-lucide-book-open' },
]

async function copyConfig() {
  await navigator.clipboard.writeText(activeConfig.value)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}
</script>
