/**
 * Generic GitHub API fetch with auth and error handling
 */
export async function ghFetch<T>(url: string, token?: string): Promise<T | null> {
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'nuxamine',
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(url, { headers })
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
  const nuxt4Mentioned = releases.some(r =>
    /nuxt\s*4|nuxt4/i.test(r.body || '') || /nuxt\s*4|nuxt4/i.test(r.name || ''),
  )

  return {
    tag: latest.tag_name,
    date: latest.published_at,
    daysSince: daysSince(latest.published_at),
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
      message: (c.commit?.message || '').split('\n')[0].slice(0, 80),
      date: c.commit?.author?.date || '',
    })),
  }
}

/**
 * Fetch npm package info
 */
export async function fetchNpmInfo(pkg: string): Promise<NpmInfo | null> {
  try {
    // Fetch registry info and downloads in parallel
    const [registryRes, downloadsRes] = await Promise.all([
      fetch(`https://registry.npmjs.org/${encodeURIComponent(pkg)}`),
      fetch(`https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(pkg)}`),
    ])

    if (!registryRes.ok) return null

    const data = await registryRes.json() as {
      'name': string
      'dist-tags'?: { latest?: string }
      'versions'?: Record<string, {
        peerDependencies?: Record<string, string>
        devDependencies?: Record<string, string>
        keywords?: string[]
        types?: string
        typings?: string
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
    if (downloadsRes.ok) {
      const dlData = await downloadsRes.json() as { downloads?: number }
      downloads = dlData.downloads ?? null
    }

    const latest = data['dist-tags']?.latest
    const latestInfo = latest ? data.versions?.[latest] : null
    const time = data.time || {}

    // Check for TypeScript support
    // - types/typings field = exports type declarations
    // - typescript in devDeps = written in TypeScript (common for Nuxt modules using module-builder)
    const devDeps = latestInfo?.devDependencies || {}
    const hasTypes = !!(
      latestInfo?.types
      || latestInfo?.typings
      || devDeps.typescript
      || devDeps['@types/node']
    )

    // Check for test script
    const scripts = latestInfo?.scripts || {}
    const hasTests = !!(scripts.test && scripts.test !== 'echo "Error: no test specified" && exit 1')

    return {
      name: data.name,
      latestVersion: latest || '',
      lastPublish: time[latest || ''] || time.modified || '',
      daysSincePublish: latest && time[latest] ? daysSince(time[latest]) : null,
      peerDeps: latestInfo?.peerDependencies || null,
      keywords: latestInfo?.keywords || [],
      deprecated: data.deprecated || null,
      hasTypes,
      hasTests,
      unpackedSize: latestInfo?.dist?.unpackedSize || null,
      downloads,
    }
  }
  catch {
    return null
  }
}

/**
 * Fetch vulnerabilities from OSV API
 */
export async function fetchVulnerabilities(pkg: string): Promise<VulnerabilityInfo | null> {
  try {
    const res = await fetch('https://api.osv.dev/v1/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        package: { name: pkg, ecosystem: 'npm' },
      }),
    })

    if (!res.ok) return null

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
  catch {
    return null
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
  const clean = repo.split('#')[0].split('/').slice(0, 2).join('/')
  return clean.split('/').length === 2 ? clean : null
}
