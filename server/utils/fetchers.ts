/** Attempts per request, including the first one. */
const NETWORK_ATTEMPTS = 3

/**
 * Cap per attempt. Without one a wedged connection sits for Node's default of
 * five minutes, which is how a run once hung for over an hour.
 */
const NETWORK_TIMEOUT_MS = 20_000

/**
 * A request that never got an answer, tried again.
 *
 * Only thrown errors are retried, never HTTP statuses: a 403 or a 404 is an
 * answer about the resource and belongs to the caller, while a connection that
 * failed to establish says nothing at all.
 *
 * This matters more than it looks. Measured on a bad line, four of six OSV
 * calls only succeeded on the second or third attempt, and each lost one was
 * silently read as "no vulnerability data" - fifteen points off a stranger's
 * module because of our own connection.
 */
export async function fetchWithRetry(url: string, init: RequestInit = {}): Promise<Response> {
  let lastError: unknown

  for (let attempt = 1; attempt <= NETWORK_ATTEMPTS; attempt++) {
    try {
      return await fetch(url, { ...init, signal: AbortSignal.timeout(NETWORK_TIMEOUT_MS) })
    }
    catch (err) {
      lastError = err
      // A second apart, not milliseconds: what fails here is the first
      // connection to a host after an idle spell, and that takes a few seconds
      // to come up on a weak line. Once one is open, undici keeps it and the
      // rest of the run is fast.
      if (attempt < NETWORK_ATTEMPTS) await sleep(attempt * 1000)
    }
  }

  throw lastError
}

/**
 * Generic GitHub API fetch with auth and error handling
 */
export async function ghFetch<T>(url: string, token?: string): Promise<T | null> {
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'nuxt-care',
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetchWithRetry(url, { headers })
    if (!res.ok) {
      const body = await res.text()
      console.warn(`GitHub fetch failed: ${url} - ${res.status} ${res.statusText}`)
      console.warn(`Response: ${body}`)
      console.warn(`Rate Limit Remaining: ${res.headers.get('x-ratelimit-remaining')}`)
      return null
    }
    return res.json() as Promise<T>
  }
  catch (err) {
    console.error(`GitHub fetch error: ${url}`, err)
    return null
  }
}

/**
 * Fetch GitHub repository info
 */
export async function fetchGitHubRepo(repoPath: string, token?: string): Promise<GitHubRepoInfo | null> {
  const res = await ghFetch<GitHubRepoResponse>(
    `https://api.github.com/repos/${repoPath}`,
    token,
  )
  if (!res) return null

  return {
    fullName: res.full_name,
    defaultBranch: res.default_branch,
    stars: res.stargazers_count,
    forks: res.forks_count,
    openIssues: res.open_issues_count,
    archived: res.archived,
    pushedAt: res.pushed_at,
    topics: res.topics,
    license: res.license?.spdx_id || null,
  }
}

/**
 * Fetch GitHub releases and check for Nuxt 4 mentions
 */
export async function fetchGitHubReleases(repoPath: string, token?: string): Promise<ReleaseInfo | null> {
  const releases = await ghFetch<GitHubReleaseResponse[]>(
    `https://api.github.com/repos/${repoPath}/releases?per_page=5`,
    token,
  )
  if (!releases?.length) return null

  const latest = releases[0]
  if (!latest) return null

  const nuxt4Mentioned = releases.some(r =>
    /nuxt\s*4|nuxt4/i.test(r.body || '') || /nuxt\s*4|nuxt4/i.test(r.name || ''),
  )

  return {
    tag: latest?.tag_name,
    date: latest?.published_at,
    daysSince: daysSince(latest!.published_at),
    nuxt4Mentioned,
  }
}

/**
 * Fetch contributors from commit history (last year)
 */
export async function fetchContributors(repoPath: string, token?: string): Promise<ContributorsInfo | null> {
  const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
  const commits = await ghFetch<GitHubCommitResponse[]>(
    `https://api.github.com/repos/${repoPath}/commits?since=${since}&per_page=100`,
    token,
  )
  if (!commits?.length) return null

  const authors = new Set<string>()
  for (const c of commits) {
    if (c.author?.login) {
      authors.add(c.author.login)
    }
  }

  return {
    commitsLastYear: commits.length,
    uniqueContributors: authors.size,
    contributors: Array.from(authors).slice(0, 5),
  }
}

/**
 * Fetch GitHub Actions workflow runs (CI status)
 */
export async function fetchCIStatus(repoPath: string, defaultBranch: string, token?: string): Promise<CIStatusInfo | null> {
  const runs = await ghFetch<GitHubWorkflowRunsResponse>(
    `https://api.github.com/repos/${repoPath}/actions/runs?branch=${defaultBranch}&per_page=1`,
    token,
  )
  if (!runs?.workflow_runs?.length) return null

  const latest = runs.workflow_runs[0]
  if (!latest) return null
  return {
    hasCI: true,
    lastRunConclusion: latest.conclusion as 'success' | 'failure' | 'cancelled' | null,
    lastRunDate: latest.updated_at,
    workflowName: latest.name,
  }
}

/**
 * Fetch commits since last release (pending commits)
 */
export async function fetchPendingCommits(repoPath: string, lastReleaseDate: string | null, token?: string): Promise<PendingCommitsInfo | null> {
  if (!lastReleaseDate) return null

  const commits = await ghFetch<GitHubCommitResponse[]>(
    `https://api.github.com/repos/${repoPath}/commits?since=${lastReleaseDate}&per_page=100`,
    token,
  )
  if (!commits?.length) return { total: 0, nonChore: 0, commits: [] }

  // Filter out chore/docs/style/ci commits (conventional commit prefixes)
  const chorePatterns = /^(chore|docs|style|ci|build|test)(\(.+\))?:/i
  const nonChoreCommits = commits.filter((c) => {
    const msg = c.commit?.message || ''
    return !chorePatterns.test(msg)
  })

  return {
    total: commits.length,
    nonChore: nonChoreCommits.length,
    commits: nonChoreCommits.slice(0, 5).map(c => ({
      sha: c.sha.slice(0, 7),
      message: (c.commit?.message || '').split('\n')[0]?.slice(0, 80) || '',
      date: c.commit?.author?.date || '',
    })),
  }
}

/**
 * Fetch npm package info
 */
export async function fetchNpmInfo(pkg: string): Promise<NpmInfo | null> {
  try {
    // Registry and downloads in parallel, but not tied together: they are two
    // different hosts, and the download count is an info signal worth zero
    // points. Inside a plain Promise.all one hiccup on api.npmjs.org rejects
    // the whole thing, and the module loses its publish date, its types and
    // its tests - 42 points - over a number nobody scores.
    const [registryRes, downloadsRes] = await Promise.all([
      fetchWithRetry(`https://registry.npmjs.org/${encodeURIComponent(pkg)}`),
      fetchWithRetry(`https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(pkg)}`)
        .catch((err) => {
          console.warn(`[npm] ${pkg}: downloads unavailable (${err instanceof Error ? err.message : String(err)})`)
          return null
        }),
    ])

    if (!registryRes.ok) {
      console.warn(`[npm] ${pkg}: registry answered ${registryRes.status}`)
      return null
    }

    const data = await registryRes.json() as {
      'name': string
      'dist-tags'?: { latest?: string }
      'versions'?: Record<string, {
        /** Where npm actually records a deprecation. */
        deprecated?: string
        peerDependencies?: Record<string, string>
        devDependencies?: Record<string, string>
        keywords?: string[]
        types?: string
        typings?: string
        exports?: Record<string, unknown>
        scripts?: Record<string, string>
        dist?: {
          unpackedSize?: number
          fileCount?: number
        }
      }>
      'time'?: Record<string, string>
      'deprecated'?: string
    }

    // Parse downloads (weekly)
    let downloads: number | null = null
    if (downloadsRes?.ok) {
      const dlData = await downloadsRes.json() as { downloads?: number }
      downloads = dlData.downloads ?? null
    }

    const latest = data['dist-tags']?.latest
    const latestInfo = latest ? data.versions?.[latest] : null
    const time = data.time || {}

    // Check for TypeScript support
    const devDeps = latestInfo?.devDependencies || {}
    const exports = latestInfo?.exports

    // Check exports for type declarations (modern packages)
    const exportsHasTypes = exports && Object.values(exports).some((exp) => {
      if (typeof exp === 'object' && exp !== null && 'types' in exp) return true
      if (typeof exp === 'string' && /\.d\.[mc]?ts$/.test(exp)) return true
      return false
    })

    const hasTypes = !!(
      latestInfo?.types // "types" field
      || latestInfo?.typings // "typings" field (legacy)
      || exportsHasTypes // exports with "types" condition
      || devDeps.typescript // typescript in devDeps
      || devDeps['vue-tsc'] // vue-tsc = Vue + TypeScript
      || devDeps['@nuxt/module-builder'] // Nuxt module builder uses TypeScript
      || devDeps['nuxt-module-build'] // Alternative module builder
    )

    // Check for tests (scripts + test frameworks in devDeps)
    const scripts = latestInfo?.scripts || {}
    const hasTests = detectHasTests(scripts, devDeps)

    return {
      name: data.name,
      latestVersion: latest || '',
      lastPublish: time[latest || ''] || time.modified || '',
      daysSincePublish: latest && time[latest] ? daysSince(time[latest]) : null,
      peerDeps: latestInfo?.peerDependencies || null,
      keywords: latestInfo?.keywords || [],
      // npm records a deprecation on the version, not on the package: the
      // top level field is empty in every real case we checked, which is why
      // the -50 penalty in calculateHealth() had never once fired.
      deprecated: latestInfo?.deprecated || data.deprecated || null,
      hasTypes,
      hasTests,
      unpackedSize: latestInfo?.dist?.unpackedSize || null,
      downloads,
    }
  }
  catch (err) {
    console.warn(`[npm] ${pkg}: ${err instanceof Error ? err.message : String(err)}`)
    return null
  }
}

/**
 * Detect if package has tests based on scripts and devDependencies
 */
export function detectHasTests(
  scripts: Record<string, string>,
  devDeps: Record<string, string>,
): boolean {
  // Check for test scripts (test, test:unit, test:e2e, test:types, etc.)
  const testScriptKeys = Object.keys(scripts).filter(key =>
    /^test(:|$)/i.test(key) || key === 'vitest' || key === 'jest',
  )

  for (const key of testScriptKeys) {
    const script = scripts[key]
    // Skip placeholder scripts
    if (script === 'echo "Error: no test specified" && exit 1') continue
    if (script === 'echo "No tests yet"') continue
    if (script && /^echo\s+["']?no\s+test/i.test(script)) continue
    // Has a real test script
    return true
  }

  // Check for test frameworks in devDependencies
  const testFrameworks = [
    'vitest',
    'jest',
    'mocha',
    'ava',
    'tap',
    'tape',
    '@nuxt/test-utils',
    '@vue/test-utils',
    'playwright',
    '@playwright/test',
    'cypress',
    'puppeteer',
    'jasmine',
    'uvu',
    'c8', // coverage tool often indicates tests
    'nyc', // coverage tool
  ]

  for (const framework of testFrameworks) {
    if (devDeps[framework]) return true
  }

  return false
}

/**
 * Fetch full npm packument (all versions metadata)
 */
export async function fetchNpmPackument(pkg: string): Promise<NpmPackument | null> {
  try {
    const res = await fetchWithRetry(`https://registry.npmjs.org/${encodeURIComponent(pkg)}`)
    if (!res.ok) return null
    return res.json() as Promise<NpmPackument>
  }
  catch {
    return null
  }
}

/**
 * Extract version info from packument
 */
export function extractVersionInfo(packument: NpmPackument, version: string): VersionInfo | null {
  const versionData = packument.versions[version]
  if (!versionData) return null

  const time = packument.time[version]
  const devDeps = versionData.devDependencies || {}
  const exports = versionData.exports

  // Check exports for type declarations
  const exportsHasTypes = exports && Object.values(exports).some((exp) => {
    if (typeof exp === 'object' && exp !== null && 'types' in exp) return true
    if (typeof exp === 'string' && /\.d\.[mc]?ts$/.test(exp)) return true
    return false
  })

  const hasTypes = !!(
    versionData.types
    || versionData.typings
    || exportsHasTypes
    || devDeps.typescript
    || devDeps['vue-tsc']
    || devDeps['@nuxt/module-builder']
    || devDeps['nuxt-module-build']
  )

  const scripts = versionData.scripts || {}
  const hasTests = detectHasTests(scripts, devDeps)

  // Parse nuxt compatibility from peerDeps
  const peerDeps = versionData.peerDependencies || null
  let nuxtCompat: CompatAnalysis | null = null

  if (peerDeps?.nuxt) {
    const raw = peerDeps.nuxt
    nuxtCompat = {
      raw,
      supports3: /(\^3|>=3|>=2.*<4|\*|3\.)/.test(raw),
      supports4: /(\^4|>=4|>=3[^<]*$|\*)/.test(raw) && !/<4/.test(raw),
    }
  }

  return {
    deprecated: versionData.deprecated || null,
    publishedAt: time || null,
    daysSincePublish: time ? daysSince(time) : null,
    hasTests,
    hasTypes,
    peerDeps,
    nuxtCompat,
  }
}

/**
 * Fetch vulnerabilities for a specific version from OSV API
 */
export async function fetchVulnerabilitiesForVersion(pkg: string, version: string): Promise<VulnerabilityInfo | null> {
  try {
    const res = await fetchWithRetry('https://api.osv.dev/v1/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        package: { name: pkg, ecosystem: 'npm' },
        version, // Specific version!
      }),
    })

    if (!res.ok) {
      console.warn(`[osv] ${pkg}@${version}: answered ${res.status}`)
      return null
    }

    const data = await res.json() as OsvResponse
    const vulns = data.vulns || []

    let critical = 0
    let high = 0
    let medium = 0
    let low = 0

    const mapped = vulns.slice(0, 10).map((v) => {
      let severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN' = 'UNKNOWN'

      const cvss = v.severity?.find(s => s.type === 'CVSS_V3')
      if (cvss) {
        const score = parseFloat(cvss.score)
        if (score >= 9.0) severity = 'CRITICAL'
        else if (score >= 7.0) severity = 'HIGH'
        else if (score >= 4.0) severity = 'MEDIUM'
        else severity = 'LOW'
      }
      else if (v.database_specific?.severity) {
        const sev = v.database_specific.severity.toUpperCase()
        if (sev === 'CRITICAL') severity = 'CRITICAL'
        else if (sev === 'HIGH') severity = 'HIGH'
        else if (sev === 'MODERATE' || sev === 'MEDIUM') severity = 'MEDIUM'
        else if (sev === 'LOW') severity = 'LOW'
      }

      if (severity === 'CRITICAL') critical++
      else if (severity === 'HIGH') high++
      else if (severity === 'MEDIUM') medium++
      else if (severity === 'LOW') low++

      return {
        id: v.id,
        summary: v.summary || v.id,
        severity,
      }
    })

    return {
      count: vulns.length,
      critical,
      high,
      medium,
      low,
      vulnerabilities: mapped,
    }
  }
  catch (err) {
    console.warn(`[osv] ${pkg}@${version}: ${err instanceof Error ? err.message : String(err)}`)
    return null
  }
}

/**
 * Check if repo has actual test files (.test., .spec., __tests__/)
 */
export async function fetchHasTestFiles(repoPath: string, defaultBranch: string, token?: string): Promise<TestFilesInfo | null> {
  // Use GitHub Tree API to get file list (recursive, but truncated at 100k entries)
  const tree = await ghFetch<GitHubTreeResponse>(
    `https://api.github.com/repos/${repoPath}/git/trees/${defaultBranch}?recursive=1`,
    token,
  )

  if (!tree?.tree) return null

  const testPatterns = /\.(test|spec)\.(ts|js|tsx|jsx|mts|mjs)$|__tests__\/|\/tests?\/.*\.(ts|js|tsx|jsx)$/i
  const testFiles = tree.tree.filter(f => f.type === 'blob' && testPatterns.test(f.path))

  return {
    hasTestFiles: testFiles.length > 0,
    testFileCount: testFiles.length,
    sampleFiles: testFiles.slice(0, 5).map(f => f.path),
  }
}

// Helper functions
export function daysSince(date: string): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
}

export function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

export function cleanRepoPath(repo: string): string | null {
  if (!repo) return null
  const clean = repo.split('#')[0]?.split('/').slice(0, 2).join('/')
  return clean?.split('/').length === 2 ? clean : null
}
