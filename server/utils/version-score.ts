import { fetchNpmPackument, extractVersionInfo, fetchVulnerabilitiesForVersion } from './fetchers'
import { scoreToStatus } from './health'

/**
 * Calculate health score for a specific npm package version
 * Combines version-specific data (npm, vulns) with cached repo data (stars, CI)
 */
export async function calculateVersionScore(
  pkg: string,
  version: string,
): Promise<VersionScoreResponse | null> {
  // Fetch npm packument (contains all versions)
  const packument = await fetchNpmPackument(pkg)
  if (!packument) return null

  const latestVersion = packument['dist-tags']?.latest
  const requestedVersion = version === 'latest' ? latestVersion : version

  if (!requestedVersion || !packument.versions[requestedVersion]) {
    return null
  }

  // Extract version-specific info
  const versionInfo = extractVersionInfo(packument, requestedVersion)
  if (!versionInfo) return null

  // Fetch vulnerabilities for this specific version
  const vulnerabilities = await fetchVulnerabilitiesForVersion(pkg, requestedVersion)

  // Try to get cached module data for repo-level info
  const allModules = await kv.get<ModuleData[]>('modules:all')
  const cachedModule = allModules?.find((m: ModuleData) => m.npmPackage === pkg)

  // Build repo info from cache
  const repoInfo: RepoInfo | null = cachedModule
    ? {
        stars: cachedModule.github?.stars || 0,
        archived: cachedModule.github?.archived || false,
        license: cachedModule.github?.license || null,
        ciPassing: cachedModule.ciStatus?.lastRunConclusion === 'success'
          ? true
          : cachedModule.ciStatus?.lastRunConclusion === 'failure'
            ? false
            : null,
        contributors: cachedModule.contributors?.uniqueContributors || 0,
      }
    : null

  // Calculate score for this version
  const score = calculateHealthForVersion(versionInfo, vulnerabilities, repoInfo, cachedModule)

  // Calculate latest score for comparison (if not already latest)
  let latestScore: number | null = null
  let latestStatus: ModuleStatus | null = null
  let latestVersionInfoData: VersionInfo | null = null
  let latestVulnerabilities: VulnerabilityInfo | null = null

  if (latestVersion && requestedVersion !== latestVersion) {
    latestVersionInfoData = extractVersionInfo(packument, latestVersion)
    latestVulnerabilities = await fetchVulnerabilitiesForVersion(pkg, latestVersion)

    if (latestVersionInfoData) {
      latestScore = calculateHealthForVersion(latestVersionInfoData, latestVulnerabilities, repoInfo, cachedModule)
      latestStatus = scoreToStatus(latestScore)
    }
  }

  const isLatest = requestedVersion === latestVersion
  const status = scoreToStatus(score)

  // Determine recommendation
  const recommendation = getRecommendation(versionInfo, vulnerabilities, isLatest, score, latestScore)

  return {
    name: cachedModule?.name || pkg.split('/').pop() || pkg,
    npm: pkg,
    version: requestedVersion,
    latestVersion: latestVersion || requestedVersion,
    isLatest,
    score,
    latestScore,
    status,
    latestStatus,
    signals: buildSignals(versionInfo, vulnerabilities, repoInfo, cachedModule),
    versionInfo,
    vulnerabilities,
    latestVulnerabilities,
    latestVersionInfo: latestVersionInfoData,
    recommendation,
    repoInfo,
  }
}

/**
 * Calculate health score for a specific version
 * Adapted from health.ts but version-aware
 */
function calculateHealthForVersion(
  versionInfo: VersionInfo,
  vulns: VulnerabilityInfo | null,
  repoInfo: RepoInfo | null,
  cachedModule: ModuleData | null | undefined,
): number {
  let score = 0

  // Penalties
  if (versionInfo.deprecated) score -= 50
  if (repoInfo?.archived) score -= 30

  const { critical = 0, high = 0 } = vulns || {}
  if (critical > 0) score -= 40
  else if (high > 0) score -= 20

  // Security (15)
  if (vulns?.count === 0) score += 15

  // Trust (5) - from cached module type
  const trustMap = { 'official': 5, 'community': 3, '3rd-party': 0 } as const
  score += trustMap[cachedModule?.type || '3rd-party'] || 0

  // Quality (30)
  // Tests: combine version devDeps with cached test files info
  const hasTestTools = versionInfo.hasTests
  const hasTestFiles = cachedModule?.testFiles?.hasTestFiles
  if (hasTestTools && hasTestFiles) score += 12
  else if (hasTestTools && hasTestFiles === false) score += 4
  else if (hasTestTools) score += 12 // No testFiles info yet
  if (versionInfo.hasTypes) score += 10
  if (repoInfo?.license) score += 5
  if (repoInfo?.ciPassing === true) score += 3

  // Maintenance (35)
  const days = versionInfo.daysSincePublish

  // Freshness (20)
  if (days == null) score += 0
  else if (days < 90) score += 20
  else if (days < 365) score += 12
  else score += 5

  // Pending commits (15) - use cached data
  const pending = cachedModule?.pendingCommits?.nonChore ?? null
  if (pending === 0) score += 15
  else if (pending == null) score += 0
  else if (pending <= 5) score += 8
  else score += 3

  // Nuxt 4 (15)
  if (versionInfo.nuxtCompat?.supports4) {
    score += 15
  }
  else if (cachedModule?.nuxtApiCompat?.supports4) {
    score += 15
  }
  else {
    const n4Signals = [
      cachedModule?.topics?.hasNuxt4,
      cachedModule?.keywords?.hasNuxt4,
      cachedModule?.release?.nuxt4Mentioned,
    ].filter(Boolean).length

    if (n4Signals >= 2) score += 15
    else if (n4Signals === 1) score += 10
    else if (cachedModule?.type === 'official') score += 5
  }

  return Math.max(0, Math.min(100, score))
}

/**
 * Build detailed signals for the response
 */
function buildSignals(
  versionInfo: VersionInfo,
  vulns: VulnerabilityInfo | null,
  repoInfo: RepoInfo | null,
  cachedModule: ModuleData | null | undefined,
): HealthSignal[] {
  const signals: HealthSignal[] = []

  const add = (key: string, type: HealthSignal['type'], msg: string, points: number, maxPoints: number) => {
    signals.push({ key, type, msg, points, maxPoints })
  }

  // Penalties
  if (versionInfo.deprecated) add('deprecated', 'negative', `Deprecated: ${versionInfo.deprecated}`, -50, 0)
  if (repoInfo?.archived) add('archived', 'negative', 'Repository archived', -30, 0)

  const { critical = 0, high = 0 } = vulns || {}
  if (critical > 0) add('vulns-penalty', 'negative', `${critical} critical vulnerabilities`, -40, 0)
  else if (high > 0) add('vulns-penalty', 'negative', `${high} high vulnerabilities`, -20, 0)

  // Security (15)
  if (vulns?.count === 0) add('security', 'positive', 'No vulnerabilities', 15, 15)
  else if (vulns) add('security', 'warning', `${vulns.count} vulnerabilities`, 0, 15)
  else add('security', 'info', 'Vulnerability status unknown', 0, 15)

  // Trust (5)
  const trustMap = { 'official': [5, 'Official Nuxt module'], 'community': [3, 'Community module'], '3rd-party': [0, '3rd-party module'] } as const
  const [trustPts, trustMsg] = trustMap[cachedModule?.type || '3rd-party'] || [0, '3rd-party module']
  add('trust', trustPts === 5 ? 'positive' : 'info', trustMsg, trustPts, 5)

  // Quality (30)
  const hasTestTools = versionInfo.hasTests
  const hasTestFiles = cachedModule?.testFiles?.hasTestFiles
  if (hasTestTools && hasTestFiles) {
    add('tests', 'positive', `Has tests (${cachedModule?.testFiles?.testFileCount} files)`, 12, 12)
  }
  else if (hasTestTools && hasTestFiles === false) {
    add('tests', 'warning', 'Test tools installed, no test files', 4, 12)
  }
  else if (hasTestTools) {
    add('tests', 'positive', 'Has tests', 12, 12)
  }
  else {
    add('tests', 'warning', 'No tests', 0, 12)
  }
  add('types', versionInfo.hasTypes ? 'positive' : 'warning', versionInfo.hasTypes ? 'TypeScript support' : 'No TypeScript', versionInfo.hasTypes ? 10 : 0, 10)
  add('license', repoInfo?.license ? 'positive' : 'warning', repoInfo?.license ? `License: ${repoInfo.license}` : 'No license', repoInfo?.license ? 5 : 0, 5)

  if (repoInfo?.ciPassing === true) add('ci', 'positive', 'CI passing', 3, 3)
  else if (repoInfo?.ciPassing === false) add('ci', 'negative', 'CI failing', 0, 3)
  else add('ci', 'info', 'No CI info', 0, 3)

  // Maintenance (35)
  const days = versionInfo.daysSincePublish
  if (days == null) add('freshness', 'warning', 'Publish date unknown', 0, 20)
  else if (days < 90) add('freshness', 'positive', `Published ${days}d ago`, 20, 20)
  else if (days < 365) add('freshness', 'info', `Published ${Math.floor(days / 30)}mo ago`, 12, 20)
  else add('freshness', 'warning', `Published ${Math.floor(days / 365)}y ago`, 5, 20)

  const pending = cachedModule?.pendingCommits?.nonChore ?? null
  if (pending === 0) add('pending', 'positive', 'All changes released', 15, 15)
  else if (pending == null) add('pending', 'info', 'Release status unknown', 0, 15)
  else add('pending', 'warning', `${pending} pending commits`, pending <= 5 ? 8 : 3, 15)

  // Nuxt 4 (15)
  if (versionInfo.nuxtCompat?.supports4) {
    add('nuxt4', 'positive', 'Nuxt 4 compatible (peerDeps)', 15, 15)
  }
  else if (cachedModule?.nuxtApiCompat?.supports4) {
    add('nuxt4', 'positive', 'Nuxt 4 compatible', 15, 15)
  }
  else {
    const n4 = [cachedModule?.topics?.hasNuxt4, cachedModule?.keywords?.hasNuxt4, cachedModule?.release?.nuxt4Mentioned].filter(Boolean).length
    if (n4 >= 2) add('nuxt4', 'positive', 'Nuxt 4 compatible', 15, 15)
    else if (n4 === 1) add('nuxt4', 'info', 'Nuxt 4 partially confirmed', 10, 15)
    else if (cachedModule?.type === 'official') add('nuxt4', 'info', 'Nuxt 4: official module', 5, 15)
    else add('nuxt4', 'warning', 'Nuxt 4 not confirmed', 0, 15)
  }

  // Info only
  if (repoInfo) {
    signals.push({ key: 'stars', type: 'info', msg: `${formatNumber(repoInfo.stars)} stars`, points: 0, maxPoints: 0 })
    if (repoInfo.contributors > 0) {
      signals.push({ key: 'contributors', type: 'info', msg: `${repoInfo.contributors} contributors`, points: 0, maxPoints: 0 })
    }
  }

  return signals
}

/**
 * Determine upgrade recommendation
 */
function getRecommendation(
  versionInfo: VersionInfo,
  vulns: VulnerabilityInfo | null,
  isLatest: boolean,
  score: number,
  latestScore: number | null,
): 'upgrade' | 'ok' | 'avoid' {
  // Avoid: deprecated or critical vulns
  if (versionInfo.deprecated) return 'avoid'
  if ((vulns?.critical || 0) > 0) return 'avoid'

  // OK: latest version with decent score
  if (isLatest && score >= 50) return 'ok'

  // Upgrade: not latest and latest is significantly better
  if (!isLatest && latestScore !== null && latestScore > score + 10) return 'upgrade'

  // Upgrade: old version (>1 year)
  if ((versionInfo.daysSincePublish || 0) > 365) return 'upgrade'

  // Upgrade: has high vulns
  if ((vulns?.high || 0) > 0) return 'upgrade'

  return 'ok'
}

/**
 * Convert full response to slim format
 */
export function toSlimResponse(full: VersionScoreResponse): VersionScoreSlim {
  return {
    name: full.name,
    npm: full.npm,
    version: full.version,
    latestVersion: full.latestVersion,
    isLatest: full.isLatest,
    score: full.score,
    latestScore: full.latestScore,
    status: full.status,
    latestStatus: full.latestStatus,
    recommendation: full.recommendation,
    // Current version details
    deprecated: !!full.versionInfo.deprecated,
    vulnCount: full.vulnerabilities?.count ?? 0,
    hasTests: full.versionInfo.hasTests,
    hasTypes: full.versionInfo.hasTypes,
    daysSincePublish: full.versionInfo.daysSincePublish,
    // Latest version details
    latestDeprecated: full.latestVersionInfo ? !!full.latestVersionInfo.deprecated : null,
    latestVulnCount: full.latestVulnerabilities?.count ?? null,
    latestHasTests: full.latestVersionInfo?.hasTests ?? null,
    latestHasTypes: full.latestVersionInfo?.hasTypes ?? null,
    // Repo-level info
    ciPassing: full.repoInfo?.ciPassing ?? null,
  }
}

const formatNumber = (n: number) => n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : String(n)
