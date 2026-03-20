<template>
  <div>
    <div
      v-if="loading"
      class="h-40 flex items-center justify-center text-sm text-neutral-500"
    >
      Loading history...
    </div>
    <div
      v-else-if="!history || history.snapshots.length < 2"
      class="h-20 flex items-center justify-center text-sm text-neutral-500"
    >
      <div class="text-center">
        <UIcon
          name="i-lucide-chart-line"
          class="w-5 h-5 mb-1 opacity-50"
        />
        <p>Collecting trend data...</p>
        <p class="text-xs text-neutral-400">
          {{ history?.snapshots.length === 1 ? 'First snapshot recorded today' : 'No history yet' }}
        </p>
      </div>
    </div>
    <div v-else>
      <div class="h-44">
        <Line
          :data="chartData"
          :options="chartOptions"
        />
      </div>

      <!-- Meta summary (latest snapshot) -->
      <div
        v-if="latestMeta"
        class="mt-3 grid grid-cols-3 gap-2 text-center"
      >
        <div class="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
          <div class="text-sm font-semibold text-neutral-900 dark:text-white">
            {{ formatNumber(latestMeta.downloads) }}
          </div>
          <div class="text-[10px] text-neutral-500">
            DL/day
          </div>
        </div>
        <div class="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
          <div class="text-sm font-semibold text-neutral-900 dark:text-white">
            {{ latestMeta.version || '-' }}
          </div>
          <div class="text-[10px] text-neutral-500">
            Version
          </div>
        </div>
        <div class="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
          <div class="text-sm font-semibold text-neutral-900 dark:text-white">
            {{ formatNumber(latestMeta.stars) }}
          </div>
          <div class="text-[10px] text-neutral-500">
            Stars
          </div>
        </div>
      </div>

      <!-- Latest change -->
      <div
        v-if="latestDiff"
        class="mt-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 space-y-1"
      >
        <div class="flex items-center gap-2 text-sm">
          <UIcon
            :name="latestDiff.newScore > latestDiff.oldScore ? 'i-lucide-trending-up' : 'i-lucide-trending-down'"
            class="w-4 h-4"
            :class="latestDiff.newScore > latestDiff.oldScore ? 'text-green-600' : 'text-red-600'"
          />
          <span class="font-medium">
            {{ latestDiff.oldScore }} → {{ latestDiff.newScore }}
          </span>
          <span class="text-neutral-500 text-xs">{{ latestDiff.date }}</span>
        </div>
        <div
          v-for="change in latestDiff.changes.slice(0, 5)"
          :key="change.signal"
          class="flex items-center gap-2 text-xs pl-6"
        >
          <span
            class="w-1.5 h-1.5 rounded-full"
            :class="change.newPoints > change.oldPoints ? 'bg-green-500' : 'bg-red-500'"
          />
          <span class="text-neutral-600 dark:text-neutral-400">
            {{ signalLabel(change.signal) }}
          </span>
          <span class="text-neutral-400">
            {{ change.oldPoints }} → {{ change.newPoints }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Line } from 'vue-chartjs'
import type { ChartData, ChartOptions } from 'chart.js'
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip, Legend)

const props = defineProps<{
  moduleName: string
}>()

const loading = ref(true)
const history = ref<ModuleHistory | null>(null)
const latestDiff = ref<ModuleDiff | null>(null)

const latestMeta = computed(() => {
  if (!history.value || history.value.snapshots.length === 0) return null
  return history.value.snapshots[history.value.snapshots.length - 1]!.meta
})

const hasDownloads = computed(() => {
  if (!history.value) return false
  return history.value.snapshots.some(s => s.meta.downloads && s.meta.downloads > 0)
})

const chartData = computed(() => {
  if (!history.value) return { labels: [], datasets: [] }

  const snapshots = history.value.snapshots
  const currentScore = snapshots[snapshots.length - 1]?.score ?? 0

  const chartResult: ChartData<'line'> = {
    labels: snapshots.map(s => s.date.slice(5)), // MM-DD
    datasets: [
      {
        label: 'Score',
        data: snapshots.map(s => s.score),
        borderColor: scoreColor(currentScore),
        backgroundColor: scoreColorAlpha(currentScore),
        fill: true,
        tension: 0.3,
        pointRadius: snapshots.length > 30 ? 0 : 3,
        pointHoverRadius: 5,
        borderWidth: 2,
        yAxisID: 'y',
      },
      ...(hasDownloads.value
        ? [{
            label: 'Daily Downloads',
            data: snapshots.map(s => s.meta.downloads ?? 0),
            borderColor: 'rgba(99,102,241,0.6)',
            backgroundColor: 'rgba(99,102,241,0.05)',
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 4,
            borderWidth: 1.5,
            borderDash: [4, 2] as number[],
            yAxisID: 'y1',
          }]
        : []),
    ],
  }

  return chartResult
})

const chartOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: {
    legend: {
      display: hasDownloads.value,
      position: 'top' as const,
      labels: { boxWidth: 10, padding: 8, font: { size: 10 } },
    },
    tooltip: {
      callbacks: {
        title: (items: Array<{ dataIndex: number }>) => {
          const idx = items[0]?.dataIndex
          if (idx == null || !history.value) return ''
          return history.value.snapshots[idx]?.date ?? ''
        },
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 10 }, maxTicksLimit: 7 },
    },
    y: {
      min: 0,
      max: 100,
      position: 'left' as const,
      grid: { color: 'rgba(128,128,128,0.1)' },
      ticks: { font: { size: 10 }, stepSize: 25 },
    },
    ...(hasDownloads.value
      ? {
          y1: {
            position: 'right' as const,
            grid: { display: false },
            ticks: {
              font: { size: 9 },
              callback: (v: number | string) => {
                const n = Number(v)
                return n >= 1000 ? `${Math.round(n / 1000)}K` : String(n)
              },
            },
          },
        }
      : {}),
  },
}))

function scoreColor(score: number): string {
  if (score >= 90) return '#22c55e'
  if (score >= 70) return '#84cc16'
  if (score >= 40) return '#eab308'
  return '#ef4444'
}

function scoreColorAlpha(score: number): string {
  if (score >= 90) return 'rgba(34,197,94,0.1)'
  if (score >= 70) return 'rgba(132,204,22,0.1)'
  if (score >= 40) return 'rgba(234,179,8,0.1)'
  return 'rgba(239,68,68,0.1)'
}

const SIGNAL_LABELS: Record<string, string> = {
  'deprecated': 'Deprecated',
  'archived': 'Archived',
  'vulns-penalty': 'Vulnerabilities',
  'security': 'Security',
  'trust': 'Trust',
  'tests': 'Tests',
  'types': 'TypeScript',
  'license': 'License',
  'ci': 'CI',
  'freshness': 'Freshness',
  'pending': 'Pending',
  'nuxt4': 'Nuxt 4',
}

function signalLabel(key: string): string {
  return SIGNAL_LABELS[key] || key
}

async function fetchHistory() {
  loading.value = true
  try {
    const [historyData, diffData] = await Promise.all([
      $fetch<ModuleHistory>(`/api/v1/history`, { params: { module: props.moduleName, days: 90 } }),
      $fetch<{ moduleName: string, diff: ModuleDiff | null }>(`/api/v1/history`, { params: { module: props.moduleName, diff: 'true' } }),
    ])
    history.value = historyData
    latestDiff.value = diffData.diff
  }
  catch {
    history.value = null
    latestDiff.value = null
  }
  finally {
    loading.value = false
  }
}

watch(() => props.moduleName, () => {
  if (props.moduleName) fetchHistory()
}, { immediate: true })
</script>
