<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    <!-- Nuxt 4 Readiness -->
    <div class="p-4 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
      <h3 class="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
        Nuxt 4 Readiness
      </h3>
      <div class="h-40">
        <Doughnut
          :data="nuxt4Data"
          :options="doughnutOptions"
        />
      </div>
    </div>

    <!-- Security Status -->
    <div class="p-4 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
      <h3 class="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
        Security Status
      </h3>
      <div class="h-40">
        <Doughnut
          :data="securityData"
          :options="doughnutOptions"
        />
      </div>
    </div>

    <!-- Health Distribution -->
    <div class="p-4 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
      <h3 class="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
        Health Distribution
      </h3>
      <div class="h-40">
        <Bar
          :data="healthData"
          :options="barOptions"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Doughnut, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js'
import type { ModuleData } from '~~/shared/types/modules'
import { getCompatStatus } from '~/composables/useModuleFilters'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const props = defineProps<{
  modules: ModuleData[]
}>()

// Nuxt 4 Readiness
const nuxt4Data = computed(() => {
  const confirmed = props.modules.filter(m => getCompatStatus(m) === 'nuxt4').length
  const partial = props.modules.filter(m => getCompatStatus(m) === 'nuxt3').length
  const unknown = props.modules.filter(m => getCompatStatus(m) === 'unknown').length

  return {
    labels: ['Nuxt 4', 'Nuxt 3 only', 'Unknown'],
    datasets: [{
      data: [confirmed, partial, unknown],
      backgroundColor: ['#22c55e', '#3b82f6', '#94a3b8'],
      borderWidth: 0,
    }],
  }
})

// Security Status
const securityData = computed(() => {
  const clean = props.modules.filter(m => m.vulnerabilities?.count === 0).length
  const lowMed = props.modules.filter(m =>
    m.vulnerabilities && m.vulnerabilities.count > 0
    && m.vulnerabilities.critical === 0 && m.vulnerabilities.high === 0,
  ).length
  const criticalHigh = props.modules.filter(m =>
    m.vulnerabilities && (m.vulnerabilities.critical > 0 || m.vulnerabilities.high > 0),
  ).length
  const noData = props.modules.filter(m => !m.vulnerabilities).length

  return {
    labels: ['Clean', 'Low/Med', 'Critical/High', 'No Data'],
    datasets: [{
      data: [clean, lowMed, criticalHigh, noData],
      backgroundColor: ['#22c55e', '#eab308', '#ef4444', '#94a3b8'],
      borderWidth: 0,
    }],
  }
})

// Health Distribution
const healthData = computed(() => {
  const score90 = props.modules.filter(m => m.health.score >= 90).length
  const score70 = props.modules.filter(m => m.health.score >= 70 && m.health.score < 90).length
  const score40 = props.modules.filter(m => m.health.score >= 40 && m.health.score < 70).length
  const scoreLow = props.modules.filter(m => m.health.score < 40).length

  return {
    labels: ['90+', '70-89', '40-69', '<40'],
    datasets: [{
      data: [score90, score70, score40, scoreLow],
      backgroundColor: ['#22c55e', '#84cc16', '#eab308', '#ef4444'],
      borderWidth: 0,
      borderRadius: 4,
    }],
  }
})

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '60%',
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        boxWidth: 12,
        padding: 8,
        font: { size: 11 },
      },
    },
  },
}

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  plugins: {
    legend: { display: false },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 10 } },
    },
    y: {
      grid: { display: false },
      ticks: { font: { size: 11 } },
    },
  },
}
</script>
