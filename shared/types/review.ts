// Modules in review - open PRs against nuxt/modules that are not merged yet.
//
// Storage is fully separated from the synced registry: everything lives under
// the `review:` KV prefix, nothing here reads or writes `modules:*`.
//
// These types describe what is actually fetched today. Triage buckets, health
// scores and ownership are not in here because nothing computes them yet.

/** The module file a PR adds or changes. */
export interface ReviewCandidate {
  filename: string
  status: GitHubPullRequestFileResponse['status']
  /**
   * Whether `readModules()` in nuxt/modules would pick this file up. False
   * means the PR has no effect at all, however good the module is.
   */
  isModulePath: boolean
  /** Where the content came from: the diff hunks, or the full blob. */
  source: 'patch' | 'blob'
}

/**
 * Why an npm lookup did or did not produce data.
 *
 * `error` is kept apart from `not_found` on purpose: a package that does not
 * exist is a defect of the submission, a failed request is a defect of ours.
 */
export type ReviewNpmStatus = 'ok' | 'not_found' | 'invalid_name' | 'no_package' | 'error'

export interface ReviewNpm {
  status: ReviewNpmStatus
  /** The raw `npm` field from the yaml, kept even when it is unusable. */
  raw: string | null
  latestVersion: string | null
  lastPublish: string | null
  daysSincePublish: number | null
  /** Deprecation message, read from the latest version where npm stores it. */
  deprecated: string | null
  releaseCount: number
  maintainers: string[]
  /** Raw nuxt range from the package's peer dependencies. */
  nuxtRange: string | null
  hasTypes: boolean
  hasTests: boolean
  /** npm changes without the PR changing, so this has its own timestamp. */
  fetchedAt: string
}

/** One open pull request, as cached. */
export interface ReviewEntry {
  number: number
  title: string
  url: string
  author: string
  authorAvatar: string | null
  createdAt: string
  updatedAt: string
  draft: boolean
  labels: string[]

  candidate: ReviewCandidate | null
  /** Further files touched by the PR, e.g. the module icon. */
  otherFiles: string[]
  /**
   * The submitted yaml, complete and unfiltered on purpose. Fields we do not
   * read today stay in here so past states remain analysable later.
   */
  yaml: Record<string, unknown> | null
  yamlError: string | null

  /** The npm package the yaml points at. Null until it was looked up once. */
  npm: ReviewNpm | null

  /** When the files of this PR were last read. */
  fetchedAt: string
}

/** Why a state stopped being current. */
export type ReviewHistoryReason = 'updated' | 'closed' | 'npm-changed'

/**
 * A state a PR used to be in. Append-only.
 *
 * The version is stamped per snapshot and is never used to discard anything:
 * an old shape stays readable, because unlike the cache this cannot be
 * refetched. Whoever changes `ReviewEntry` has to keep reading old snapshots.
 */
export interface ReviewHistorySnapshot {
  schemaVersion: number
  entry: ReviewEntry
  /** When this state was replaced. */
  replacedAt: string
  reason: ReviewHistoryReason
}

export interface ReviewHistory {
  number: number
  snapshots: ReviewHistorySnapshot[]
}

export interface ReviewSyncMeta {
  schemaVersion: number
  lastRun: string | null
  isRunning: boolean
  startedAt: string | null
  /** Open PRs seen in the last run. */
  totalPrs: number
  /** Of those, the ones whose `updated_at` had moved. */
  changedPrs: number
  apiCalls: number
  duration: number | null
  error: string | null
}
