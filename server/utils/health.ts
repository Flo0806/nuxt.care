import { daysSince } from './fetchers'

/**
 * Risk/Quality Score for Nuxt Modules (max 100)
 *
 * PENALTIES: Deprecated(-50), Archived(-30), Critical vulns(-40), High vulns(-20)
 * SECURITY(15): No vulnerabilities
 * TRUST(5): Official=5, Community=3, 3rd-party=0
 * QUALITY(30): Tests=12, TypeScript=10, License=5, CI=3
 * MAINTENANCE(35): Freshness=20, Release status=15
 * NUXT4(15): 2+ signals=15, 1 signal=10, Official=5
 */
export function calculateHealth(data: ModuleData): HealthScore {
  let score = 0
  const signals: HealthSignal[] = []

  const add = (type: HealthSignal['type'], msg: string, points: number, maxPoints: number) => {
    score += points
    signals.push({ type, msg, points, maxPoints })
  }

  const info = (msg: string) => signals.push({ type: 'info', msg, points: 0, maxPoints: 0 })

  // Penalties
  if (data.npm?.deprecated) add('negative', 'Deprecated', -50, 0)
  if (data.github?.archived) add('negative', 'Archived', -30, 0)

  const { critical = 0, high = 0 } = data.vulnerabilities || {}
  if (critical > 0) add('negative', `${critical} critical vulnerabilities`, -40, 0)
  else if (high > 0) add('negative', `${high} high vulnerabilities`, -20, 0)

  // Security (15)
  if (data.vulnerabilities?.count === 0) add('positive', 'No vulnerabilities', 15, 15)
  else if (data.vulnerabilities) add('warning', 'Has vulnerabilities', 0, 15)
  else add('info', 'Vulnerability status unknown', 0, 15)

  // Trust (5)
  const trustMap = { 'official': [5, 'Official Nuxt module'], 'community': [3, 'Community module'], '3rd-party': [0, '3rd-party module'] } as const
  const [trustPts, trustMsg] = trustMap[data.type] || [0, '3rd-party module']
  add(trustPts === 5 ? 'positive' : 'info', trustMsg, trustPts, 5)

  // Quality (30)
  add(data.npm?.hasTests ? 'positive' : 'warning', data.npm?.hasTests ? 'Has tests' : 'No tests', data.npm?.hasTests ? 12 : 0, 12)
  add(data.npm?.hasTypes ? 'positive' : 'warning', data.npm?.hasTypes ? 'TypeScript support' : 'No TypeScript', data.npm?.hasTypes ? 10 : 0, 10)
  add(data.github?.license ? 'positive' : 'warning', data.github?.license ? `License: ${data.github.license}` : 'No license', data.github?.license ? 5 : 0, 5)

  const ci = data.ciStatus
  if (ci?.hasCI && ci.lastRunConclusion === 'success') add('positive', 'CI passing', 3, 3)
  else if (ci?.hasCI && ci.lastRunConclusion === 'failure') add('negative', 'CI failing', 0, 3)
  else add('info', 'No CI', 0, 3)

  // Maintenance (35)
  const days = data.npm?.daysSincePublish
  const pending = data.pendingCommits?.nonChore ?? null
  const activity = data.github?.pushedAt ? daysSince(data.github.pushedAt) : null

  // Stable & Done exception
  const isStable = days != null && days > 365 && pending === 0
    && (data.github?.openIssues ?? 0) < 10
    && data.vulnerabilities?.count === 0
    && (!ci?.hasCI || ci.lastRunConclusion === 'success')

  // Freshness (20)
  if (days == null) add('warning', 'Publish date unknown', 0, 20)
  else if (days < 90) add('positive', `Published ${days}d ago`, 20, 20)
  else if (days < 365) add('info', `Published ${Math.floor(days / 30)}mo ago`, 12, 20)
  else if (isStable) add('info', `Stable (${Math.floor(days / 365)}y, mature)`, 15, 20)
  else add('warning', `Published ${Math.floor(days / 365)}y ago`, 5, 20)

  // Pending commits (15)
  if (pending === 0) add('positive', 'All changes released', 15, 15)
  else if (pending == null) add('info', 'Release status unknown', 0, 15)
  else if (activity != null && activity < 90) add('info', `${pending} pending (active)`, 8, 15)
  else if (activity != null && activity > 365) add('negative', `${pending} pending (abandoned)`, 0, 15)
  else add('warning', `${pending} pending`, 3, 15)

  // NUXT 4 (15)
  // Official compat declaration is authoritative - full points if declared
  if (data.nuxtApiCompat?.supports4) {
    add('positive', 'Nuxt 4 compatible', 15, 15)
  }
  else {
    // Fall back to secondary signals (topics, keywords, release notes)
    const n4 = [data.topics?.hasNuxt4, data.keywords?.hasNuxt4, data.release?.nuxt4Mentioned].filter(Boolean).length
    if (n4 >= 2) add('positive', 'Nuxt 4 compatible', 15, 15)
    else if (n4 === 1) add('info', 'Nuxt 4 partially confirmed', 10, 15)
    else if (data.type === 'official') add('info', 'Nuxt 4: official module', 5, 15)
    else add('warning', 'Nuxt 4 not confirmed', 0, 15)
  }

  // Info only
  const dl = data.npm?.downloads || 0
  const stars = data.github?.stars || 0
  const contribs = data.contributors?.uniqueContributors || 0

  info(`${fmt(dl)} downloads`)
  info(`${fmt(stars)} stars`)
  if (contribs > 0) info(`${contribs} contributor${contribs > 1 ? 's' : ''}`)

  return { score: Math.max(0, Math.min(100, score)), signals }
}

const fmt = (n: number) => n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : String(n)
