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
  readme: ReadmeAnalysis | null

  npm: NpmInfo | null
  keywords: KeywordsAnalysis | null
  nodeEngine: NodeEngineAnalysis | null
  deps: DepsAnalysis | null
  moduleJson: ModuleJsonInfo | null
  packageKeywords?: string[]

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
  compatibility?: { nuxt?: string }
  nuxtCompat?: CompatAnalysis
}

export interface HealthSignal {
  type: 'positive' | 'negative' | 'warning'
  msg: string
}

export interface HealthScore {
  score: number
  signals: HealthSignal[]
}

export interface SyncMeta {
  lastSync: string
  totalModules: number
  syncedModules: number
  duration: number
}
