// Cold analysis core.
//
// Builds a full `ModuleData` from nothing but a name, an npm package and a repo
// - every signal is fetched live. Nothing in here reads the synced cache, so it
// works for modules that are not (yet) in the registry: PRs against
// nuxt/modules, or arbitrary packages.
//
// Extracted from sync.post.ts so the registry sync and the review pipeline run
// through the exact same code path and can never drift apart.

import { analyzeCompatString, analyzeKeywords, analyzeTopics } from './analyzers'
import {
  cleanRepoPath,
  fetchCIStatus,
  fetchContributors,
  fetchGitHubReleases,
  fetchGitHubRepo,
  fetchHasTestFiles,
  fetchNpmInfo,
  fetchPendingCommits,
  fetchVulnerabilitiesForVersion,
} from './fetchers'

/** Minimal input the analysis needs. Anything else is fetched. */
export interface ModuleDescriptor {
  name: string
  npm: string
  repo: string
  description?: string
  category?: string
  type?: 'official' | 'community' | '3rd-party'
  icon?: string
  maintainers?: string[]
  /** Declared Nuxt compatibility range, e.g. ">=3.0.0" or [3, 4]. */
  compatibility?: string | number[]
  /** Only available for registry modules - the review path leaves this out. */
  stats?: NuxtApiStats | null
}

export function descriptorFromNuxtApi(mod: NuxtApiModule): ModuleDescriptor {
  return {
    name: mod.name,
    npm: mod.npm,
    repo: mod.repo,
    description: mod.description,
    category: mod.category,
    type: mod.type,
    icon: mod.icon,
    maintainers: mod.maintainers?.map(m => m.name) || [],
    compatibility: mod.compatibility?.nuxt,
    stats: mod.stats || null,
  }
}

/**
 * Derive the module type the same way nuxt/modules does: from the repo owner.
 * Used for submissions, where the yaml value is not authoritative yet.
 */
export function resolveModuleType(repo: string): 'official' | 'community' | '3rd-party' {
  if (repo.startsWith('nuxt/')) return 'official'
  if (repo.startsWith('nuxt-community/') || repo.startsWith('nuxt-modules/') || repo.startsWith('nuxt-content/')) {
    return 'community'
  }
  return '3rd-party'
}

function emptyModule(desc: ModuleDescriptor): ModuleData {
  return {
    name: desc.name,
    npmPackage: desc.npm,
    repo: desc.repo,
    description: desc.description || '',
    category: desc.category || '',
    type: desc.type || '3rd-party',
    icon: desc.icon,
    maintainers: desc.maintainers || [],
    nuxtApiCompat: analyzeCompatString(desc.compatibility),
    nuxtApiStats: desc.stats || null,
    github: null,
    topics: null,
    nuxt4Issues: null,
    release: null,
    oldestIssue: null,
    contributors: null,
    testFiles: null,
    readme: null,
    ciStatus: null,
    pendingCommits: null,
    npm: null,
    keywords: null,
    nodeEngine: null,
    deps: null,
    moduleJson: null,
    vulnerabilities: null,
    health: { score: 0, signals: [] },
  }
}

/**
 * A module that could not be fetched. Kept distinct from a genuinely bad
 * module: the caller must not read this as "score 0 because it is poor".
 */
export function createErrorModule(desc: ModuleDescriptor, err: unknown): ModuleData {
  const data = emptyModule(desc)
  data.nuxtApiCompat = null
  data.nuxtApiStats = null
  data.health = {
    score: 0,
    signals: [{ key: 'error', type: 'negative', msg: `Fetch failed: ${String(err)}`, points: 0, maxPoints: 100 }],
  }
  return data
}

/**
 * Fetch every signal for a single module.
 *
 * `health` is left at zero on purpose - the registry calculates it on read
 * (modules.get.ts) so scoring changes apply without a re-sync. Callers that
 * need to persist a score alongside a derived verdict have to run
 * `calculateHealth()` themselves.
 */
export async function analyzeModule(desc: ModuleDescriptor, githubToken?: string): Promise<ModuleData> {
  const data = emptyModule(desc)

  if (desc.repo) {
    const repoPath = cleanRepoPath(desc.repo)
    if (repoPath) {
      const [github, releases, contributors] = await Promise.all([
        fetchGitHubRepo(repoPath, githubToken),
        fetchGitHubReleases(repoPath, githubToken),
        fetchContributors(repoPath, githubToken),
      ])

      if (github) {
        data.github = github
        data.topics = analyzeTopics(github.topics)

        // Needs the default branch, so it cannot run in the batch above
        const ciStatus = await fetchCIStatus(repoPath, github.defaultBranch, githubToken)
        if (ciStatus) data.ciStatus = ciStatus

        const testFiles = await fetchHasTestFiles(repoPath, github.defaultBranch, githubToken)
        if (testFiles) data.testFiles = testFiles
      }

      if (releases) {
        data.release = releases

        const pendingCommits = await fetchPendingCommits(repoPath, releases.date, githubToken)
        if (pendingCommits) data.pendingCommits = pendingCommits
      }

      if (contributors) data.contributors = contributors
    }
  }

  if (desc.npm) {
    const npmData = await fetchNpmInfo(desc.npm)
    if (npmData) {
      data.npm = npmData
      data.keywords = analyzeKeywords(npmData.keywords)
      data.vulnerabilities = await fetchVulnerabilitiesForVersion(desc.npm, npmData.latestVersion)
    }
  }

  return data
}
