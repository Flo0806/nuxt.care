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

  /** When the files of this PR were last read. */
  fetchedAt: string
}

/** Why a state stopped being current. */
export type ReviewHistoryReason = 'updated' | 'closed'

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
