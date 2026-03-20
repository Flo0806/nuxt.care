import { fetchNpmPackument, extractVersionInfo, fetchVulnerabilitiesForVersion } from '../../utils/fetchers'

// POST /api/v1/history-backfill
// Backfills history using real version-specific scores (npm + vulns)
// Results can be deleted via DELETE /api/v1/history-backfill?module=fonts

const BACKFILL_MODULES = ['fonts', 'hints', 'a11y', 'vorm']
const BACKFILL_DAYS = 10

interface NpmDownloadDay {
  day: string
  downloads: number
}

interface NpmRangeResponse {
  downloads: NpmDownloadDay[]
  package: string
}

export default defineEventHandler(async (_event) => {
  const modules = await kv.get<ModuleData[]>('modules:all')
  if (!modules) {
    throw createError({ statusCode: 500, message: 'No module data available. Run sync first.' })
  }

  const targets = modules.filter((m: ModuleData) => BACKFILL_MODULES.includes(m.name))
  if (targets.length === 0) {
    throw createError({ statusCode: 404, message: `None of [${BACKFILL_MODULES.join(', ')}] found in module data` })
  }

  const results: Record<string, { snapshots: number, existed: number, versions: string[] }> = {}

  for (const mod of targets) {
    const key = `history:${mod.name}`
    const existing = await kv.get<ModuleHistory>(key)
    const existingDates = new Set(existing?.snapshots.map((s: ModuleSnapshot) => s.date) || [])

    // Fetch all data upfront: packument, downloads, version timeline
    const [packument, downloads] = await Promise.all([
      fetchNpmPackument(mod.npmPackage),
      fetchDownloadRange(mod.npmPackage, BACKFILL_DAYS),
    ])

    if (!packument) {
      console.warn(`[backfill] No packument for ${mod.npmPackage}, skipping`)
      continue
    }

    // Build version timeline from packument
    const versionTimeline = Object.entries(packument.time)
      .filter(([k]) => k !== 'created' && k !== 'modified')
      .map(([version, date]) => ({ version, date: date.slice(0, 10) }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Find unique versions needed for the backfill period
    const today = new Date()
    const versionsByDay = new Map<string, string>()
    for (let i = BACKFILL_DAYS; i >= 1; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().slice(0, 10)
      if (existingDates.has(dateStr)) continue

      let latestVersion: string | null = null
      for (const entry of versionTimeline) {
        if (entry.date <= dateStr) latestVersion = entry.version
        else break
      }
      if (latestVersion) versionsByDay.set(dateStr, latestVersion)
    }

    // Fetch vulns + version info once per unique version (cache)
    const uniqueVersions = [...new Set(versionsByDay.values())]
    const vulnCache = new Map<string, VulnerabilityInfo | null>()
    const versionInfoCache = new Map<string, VersionInfo | null>()

    for (const ver of uniqueVersions) {
      const [vulns, vInfo] = await Promise.all([
        fetchVulnerabilitiesForVersion(mod.npmPackage, ver),
        Promise.resolve(extractVersionInfo(packument, ver)),
      ])
      vulnCache.set(ver, vulns)
      versionInfoCache.set(ver, vInfo)
    }

    const history: ModuleHistory = existing || {
      moduleName: mod.name,
      npmPackage: mod.npmPackage,
      snapshots: [],
    }

    let added = 0
    let skipped = 0

    for (let i = BACKFILL_DAYS; i >= 1; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().slice(0, 10)

      if (existingDates.has(dateStr)) {
        skipped++
        continue
      }

      const version = versionsByDay.get(dateStr)
      if (!version) continue

      const vInfo = versionInfoCache.get(version)
      if (!vInfo) continue

      const vulns = vulnCache.get(version)

      // Calculate daysSincePublish relative to this date (not today)
      const publishDate = packument.time[version]
      const daysSincePublish = publishDate
        ? Math.floor((date.getTime() - new Date(publishDate).getTime()) / 86400000)
        : null

      // Build score + signals using version-specific data + cached module data
      const { score, signals } = buildScoreForDate(mod, vInfo, vulns ?? null, daysSincePublish)

      const snapshot: ModuleSnapshot = {
        date: dateStr,
        score,
        signals,
        meta: {
          version,
          downloads: downloads.get(dateStr) ?? null,
          stars: mod.github?.stars ?? null,
          contributors: mod.contributors?.uniqueContributors ?? null,
          lastCommit: mod.github?.pushedAt ?? null,
          lastRelease: publishDate?.slice(0, 10) ?? mod.release?.date ?? null,
          openIssues: mod.github?.openIssues ?? null,
          pendingCommits: mod.pendingCommits?.nonChore ?? null,
          deprecated: !!vInfo.deprecated,
          archived: !!mod.github?.archived,
          vulnCount: vulns?.count ?? null,
          hasTests: vInfo.hasTests,
          hasTypes: vInfo.hasTypes,
          ciPassing: resolveCiPassing(mod),
          nuxt4Compatible: resolveNuxt4Compatible(mod, vInfo.nuxtCompat),
        },
      }

      history.snapshots.push(snapshot)
      added++
    }

    history.snapshots.sort((a, b) => a.date.localeCompare(b.date))
    await kv.set(key, history)

    results[mod.name] = { snapshots: added, existed: skipped, versions: uniqueVersions }
  }

  return {
    status: 'backfilled',
    modules: results,
    hint: 'DELETE /api/v1/history-backfill?module=xxx to remove',
  }
})

function buildScoreForDate(
  mod: ModuleData,
  vInfo: VersionInfo,
  vulns: VulnerabilityInfo | null,
  daysSincePublish: number | null,
): { score: number, signals: Record<string, { points: number, maxPoints: number }> } {
  let score = 0
  const signals: Record<string, { points: number, maxPoints: number }> = {}

  const add = (key: string, points: number, maxPoints: number) => {
    score += points
    signals[key] = { points, maxPoints }
  }

  // Penalties
  if (vInfo.deprecated) add('deprecated', -50, 0)
  if (mod.github?.archived) add('archived', -30, 0)

  const { critical = 0, high = 0 } = vulns || {}
  if (critical > 0) add('vulns-penalty', -40, 0)
  else if (high > 0) add('vulns-penalty', -20, 0)

  // Security (15)
  if (vulns?.count === 0) add('security', 15, 15)
  else if (vulns) add('security', 0, 15)
  else add('security', 0, 15)

  // Trust (5)
  const trustMap = { 'official': 5, 'community': 3, '3rd-party': 0 } as const
  add('trust', trustMap[mod.type] || 0, 5)

  // Quality (30)
  const hasTestFiles = mod.testFiles?.hasTestFiles
  if (vInfo.hasTests && hasTestFiles) add('tests', 12, 12)
  else if (vInfo.hasTests && hasTestFiles === false) add('tests', 4, 12)
  else if (vInfo.hasTests) add('tests', 12, 12)
  else add('tests', 0, 12)

  add('types', vInfo.hasTypes ? 10 : 0, 10)
  add('license', mod.github?.license ? 5 : 0, 5)

  const ci = mod.ciStatus
  if (ci?.hasCI && ci.lastRunConclusion === 'success') add('ci', 3, 3)
  else if (ci?.hasCI && ci.lastRunConclusion === 'failure') add('ci', 0, 3)
  else add('ci', 0, 3)

  // Maintenance (35) - this is where historical dates matter!
  const pending = mod.pendingCommits?.nonChore ?? null
  const isStable = daysSincePublish != null && daysSincePublish > 365 && pending === 0
    && (mod.github?.openIssues ?? 0) < 10
    && vulns?.count === 0
    && (!ci?.hasCI || ci.lastRunConclusion === 'success')

  if (daysSincePublish == null) add('freshness', 0, 20)
  else if (daysSincePublish < 90) add('freshness', 20, 20)
  else if (daysSincePublish < 365) add('freshness', 12, 20)
  else if (isStable) add('freshness', 15, 20)
  else add('freshness', 5, 20)

  if (pending === 0) add('pending', 15, 15)
  else if (pending == null) add('pending', 0, 15)
  else if (pending <= 5) add('pending', 8, 15)
  else add('pending', 3, 15)

  // Nuxt 4 (15)
  if (vInfo.nuxtCompat?.supports4 || mod.nuxtApiCompat?.supports4) {
    add('nuxt4', 15, 15)
  }
  else {
    const n4 = [mod.topics?.hasNuxt4, mod.keywords?.hasNuxt4, mod.release?.nuxt4Mentioned].filter(Boolean).length
    if (n4 >= 2) add('nuxt4', 15, 15)
    else if (n4 === 1) add('nuxt4', 10, 15)
    else if (mod.type === 'official') add('nuxt4', 5, 15)
    else add('nuxt4', 0, 15)
  }

  return { score: Math.max(0, Math.min(100, score)), signals }
}

async function fetchDownloadRange(pkg: string, days: number): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  try {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    const startStr = start.toISOString().slice(0, 10)
    const endStr = end.toISOString().slice(0, 10)

    const res = await fetch(`https://api.npmjs.org/downloads/range/${startStr}:${endStr}/${encodeURIComponent(pkg)}`)
    if (!res.ok) return map

    const data = await res.json() as NpmRangeResponse
    for (const d of data.downloads) {
      map.set(d.day, d.downloads)
    }
  }
  catch (err) {
    console.warn(`[backfill] Failed to fetch downloads for ${pkg}:`, err)
  }
  return map
}
