export interface ModuleData {
  name: string
  npmPackage: string
  repo: string
  description: string
  category: string
  type: 'official' | 'community' | '3rd-party'
  icon?: string
  maintainers: string[]

  nuxtApiCompat: CompatAnalysis | null
  nuxtApiStats: NuxtApiStats | null

  github: GitHubRepoInfo | null
  topics: TopicsAnalysis | null
  nuxt4Issues: Nuxt4Issues | null
  release: ReleaseInfo | null
  oldestIssue: OldestIssue | null
  contributors: ContributorsInfo | null
  testFiles: TestFilesInfo | null
  readme: ReadmeAnalysis | null
  ciStatus: CIStatusInfo | null
  pendingCommits: PendingCommitsInfo | null

  npm: NpmInfo | null
  keywords: KeywordsAnalysis | null
  nodeEngine: NodeEngineAnalysis | null
  deps: DepsAnalysis | null
  moduleJson: ModuleJsonInfo | null
  packageKeywords?: string[]
  vulnerabilities: VulnerabilityInfo | null

  health: HealthScore
}

export interface CompatAnalysis {
  supports4: boolean | null
  supports3: boolean | null
  raw: string | null
}

export interface NuxtApiStats {
  version: string
  downloads: number
  stars: number
  watchers: number
  forks: number
  defaultBranch: string
  publishedAt: number
  createdAt: number
}

export interface GitHubRepoInfo {
  fullName: string
  defaultBranch: string
  stars: number
  forks: number
  openIssues: number
  archived: boolean
  pushedAt: string
  topics: string[]
  license: string | null
}

export interface TopicsAnalysis {
  hasNuxt4: boolean
  hasNuxt3: boolean
  hasNuxt2: boolean
  isNuxtModule: boolean
  all: string[]
}

export interface Nuxt4Issues {
  total: number
  open: number
  closed: number
  samples: Array<{
    title: string
    state: string
    url: string
  }>
}

export interface ReleaseInfo {
  tag: string
  date: string
  daysSince: number
  nuxt4Mentioned: boolean
}

export interface OldestIssue {
  title: string
  createdAt: string
  daysSinceCreated: number
  url: string
}

export interface ContributorsInfo {
  commitsLastYear: number
  uniqueContributors: number
  contributors: string[]
}

export interface TestFilesInfo {
  hasTestFiles: boolean
  testFileCount: number
  sampleFiles: string[]
}

export interface ReadmeAnalysis {
  nuxt4Mentions: number
  nuxt3Mentions: number
  hasCompatSection: boolean
  explicitNuxt4Support: boolean
  explicitNuxt4NotSupported: boolean
}

export interface NpmInfo {
  name: string
  latestVersion: string
  lastPublish: string
  daysSincePublish: number | null
  peerDeps: Record<string, string> | null
  keywords: string[]
  deprecated: string | null
  hasTypes: boolean
  hasTests: boolean
  unpackedSize: number | null
  downloads: number | null
}

export interface CIStatusInfo {
  hasCI: boolean
  lastRunConclusion: 'success' | 'failure' | 'cancelled' | null
  lastRunDate: string
  workflowName: string
}

export interface PendingCommitsInfo {
  total: number
  nonChore: number
  commits: Array<{
    sha: string
    message: string
    date: string
  }>
}

export interface KeywordsAnalysis {
  hasNuxt4: boolean
  hasNuxt3: boolean
  all: string[]
}

export interface NodeEngineAnalysis {
  raw: string
  isAncient: boolean
  isOld: boolean
  isModern: boolean
}

export interface DepsAnalysis {
  hasVue2: boolean
  hasVue3: boolean
  vueVersion: string | null
  nuxtVersion: string | null
  hasOldDeps: boolean
  oldDeps: string[]
}

export interface ModuleJsonInfo {
  exists: boolean
  path?: string
  name?: string
  compatibility?: { nuxt?: string | number[] }
  nuxtCompat?: CompatAnalysis
}

export interface VulnerabilityInfo {
  count: number
  critical: number
  high: number
  medium: number
  low: number
  vulnerabilities: Array<{
    id: string
    summary: string
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN'
  }>
}

export interface HealthSignal {
  key: string
  type: 'positive' | 'negative' | 'warning' | 'info'
  msg: string
  points: number
  maxPoints: number
}

export interface HealthScore {
  score: number
  signals: HealthSignal[]
}

export type ModuleStatus = 'optimal' | 'stable' | 'degraded' | 'critical' | 'unknown'

export interface ModuleSlim {
  name: string
  npm: string
  score: number
  status: ModuleStatus
  lastUpdated: string | null
  badge?: string // inline SVG or data URL, only if ?badge=inline|dataurl
}

// History / Trend tracking
export interface ModuleSnapshot {
  date: string // ISO date (YYYY-MM-DD), one per day
  score: number
  signals: Record<string, { points: number, maxPoints: number }> // key = signal msg
  meta: {
    version: string | null
    downloads: number | null
    stars: number | null
    contributors: number | null
    lastCommit: string | null
    lastRelease: string | null
    openIssues: number | null
    pendingCommits: number | null
    deprecated: boolean
    archived: boolean
    vulnCount: number | null
    hasTests: boolean
    hasTypes: boolean
    ciPassing: boolean | null
    nuxt4Compatible: boolean
  }
}

export interface ModuleHistory {
  moduleName: string
  npmPackage: string
  snapshots: ModuleSnapshot[]
}

export interface ScoreChange {
  signal: string
  oldPoints: number
  newPoints: number
  maxPoints: number
}

export interface ModuleDiff {
  moduleName: string
  date: string
  oldScore: number
  newScore: number
  changes: ScoreChange[]
}

// AI context extracted from repo (crawled weekly, overwritten each run)
export interface ModuleContext {
  moduleName: string
  npmPackage: string
  readme: string | null
  docsUrl: string | null
  composables: string[]
  components: string[]
  configKey: string | null
  installCommand: string
  quickStart: string | null
  crawledAt: string
}

export interface SyncMeta {
  lastSync: string | null
  isRunning: boolean
  startedAt: string | null
  totalModules: number
  syncedModules: number
  duration: number | null
  error: string | null
}

// Version-specific score types
export interface VersionScoreResponse {
  name: string
  npm: string
  version: string
  latestVersion: string
  isLatest: boolean
  score: number
  latestScore: number | null
  status: ModuleStatus
  latestStatus: ModuleStatus | null
  signals: HealthSignal[]
  versionInfo: VersionInfo
  vulnerabilities: VulnerabilityInfo | null
  latestVulnerabilities: VulnerabilityInfo | null
  latestVersionInfo: VersionInfo | null
  recommendation: 'upgrade' | 'ok' | 'avoid'
  repoInfo: RepoInfo | null
}

export interface VersionScoreSlim {
  name: string
  npm: string
  version: string
  latestVersion: string
  isLatest: boolean
  score: number
  latestScore: number | null
  status: ModuleStatus
  latestStatus: ModuleStatus | null
  recommendation: 'upgrade' | 'ok' | 'avoid'
  // Current version details
  deprecated: boolean
  vulnCount: number
  hasTests: boolean
  hasTypes: boolean
  daysSincePublish: number | null
  // Latest version details (for comparison)
  latestDeprecated: boolean | null
  latestVulnCount: number | null
  latestHasTests: boolean | null
  latestHasTypes: boolean | null
  // Repo-level info
  ciPassing: boolean | null
}

export interface VersionInfo {
  deprecated: string | null
  publishedAt: string | null
  daysSincePublish: number | null
  hasTests: boolean
  hasTypes: boolean
  peerDeps: Record<string, string> | null
  nuxtCompat: CompatAnalysis | null
}

export interface RepoInfo {
  stars: number
  archived: boolean
  license: string | null
  ciPassing: boolean | null
  contributors: number
}

export interface NpmPackument {
  'name': string
  'dist-tags': Record<string, string>
  'versions': Record<string, NpmVersionInfo>
  'time': Record<string, string>
  'maintainers'?: Array<{ name?: string }>
}

export interface NpmVersionInfo {
  version: string
  deprecated?: string
  scripts?: Record<string, string>
  types?: string
  typings?: string
  exports?: Record<string, unknown>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  dist?: {
    unpackedSize?: number
    fileCount?: number
  }
}

// Nuxt API response types
export interface NuxtApiModule {
  name: string
  npm: string
  repo: string
  description: string
  category: string
  type: 'official' | 'community' | '3rd-party'
  icon?: string
  maintainers?: Array<{ name: string }>
  compatibility?: { nuxt?: string | number[] }
  stats?: NuxtApiStats
}

export interface NuxtApiResponse {
  modules: NuxtApiModule[]
}

// GitHub API response types
export interface GitHubRepoResponse {
  full_name: string
  default_branch: string
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  archived: boolean
  pushed_at: string
  topics: string[]
  license?: { spdx_id: string } | null
}

export interface GitHubReleaseResponse {
  tag_name: string
  published_at: string
  name?: string
  body?: string
}

export interface GitHubCommitResponse {
  sha: string
  author?: { login: string } | null
  commit?: {
    message?: string
    author?: { date?: string }
  }
}

export interface GitHubWorkflowRunsResponse {
  workflow_runs: Array<{
    name: string
    conclusion: string | null
    updated_at: string
  }>
}

// Subset of the pull request list response. Fields only present on the single
// PR endpoint (mergeable_state, mergeable) are deliberately left out.
export interface GitHubPullRequestResponse {
  number: number
  title: string
  html_url: string
  created_at: string
  updated_at: string
  draft: boolean
  user: { login: string, avatar_url: string } | null
  labels: Array<{ name: string }>
  /** Check runs hang off the head commit, not off the PR. */
  head: { sha: string } | null
}

// GET /repos/{owner}/{repo}/issues/{n}/comments
export interface GitHubIssueCommentResponse {
  user: { login: string, type: string } | null
  /** OWNER / MEMBER / COLLABORATOR / CONTRIBUTOR / NONE. */
  author_association: string
  created_at: string
  body: string
}

// GET /repos/{owner}/{repo}/pulls/{n}/reviews
export interface GitHubReviewResponse {
  user: { login: string } | null
  state: string
  submitted_at: string | null
  author_association: string
}

// GET /repos/{owner}/{repo}/commits/{sha}/check-runs
export interface GitHubCheckRunsResponse {
  total_count: number
  check_runs: Array<{
    name: string
    status: 'queued' | 'in_progress' | 'completed'
    conclusion: string | null
    html_url?: string | null
    details_url?: string | null
    started_at?: string | null
    completed_at?: string | null
    output?: {
      title?: string | null
      summary?: string | null
    }
  }>
}

// One entry of GET /repos/{owner}/{repo}/pulls/{n}/files.
// `patch` holds the diff hunks and is omitted by GitHub for large or binary
// files. For an added file it contains the whole content as "+" lines.
export interface GitHubPullRequestFileResponse {
  filename: string
  status: 'added' | 'modified' | 'removed' | 'renamed' | 'copied' | 'changed' | 'unchanged'
  additions: number
  deletions: number
  contents_url: string
  patch?: string
}

// GET /repos/{owner}/{repo}/contents/{path}. Needed for modified files, where
// the patch only holds the changed hunks instead of the whole file.
export interface GitHubContentResponse {
  content: string
  encoding: string
}

export interface GitHubTreeResponse {
  sha: string
  url: string
  tree: Array<{
    path: string
    mode: string
    type: 'blob' | 'tree'
    sha: string
    size?: number
  }>
  truncated: boolean
}

// OSV API types
export interface OsvVulnerability {
  id: string
  summary?: string
  severity?: Array<{ type: string, score: string }>
  database_specific?: { severity?: string }
}

export interface OsvResponse {
  vulns?: OsvVulnerability[]
}
