// Modules in review - open PRs against nuxt/modules that are not merged yet.
//
// Storage is fully separated from the synced registry: everything lives under
// the `review:` KV prefix, nothing here reads or writes `modules:*`.
//
// The analysis of a submitted module reuses `ModuleData` on purpose, so the
// existing score badge, health signals and detail view work unchanged.

import type { ModuleData, ModuleStatus } from './modules'

/** Where a PR stands in triage. Order matters: the first matching bucket wins. */
export type ReviewBucket
  = | 'broken' // PR has no effect at all (file misplaced / missing .yml extension)
    | 'dead' // package deprecated, repo archived, or npm entry unusable
    | 'on-hold' // a maintainer deliberately parked it
    | 'waiting-author' // maintainer asked something, CI red, or merge conflict
    | 'waiting-maintainer' // author delivered, nobody looked yet
    | 'needs-work' // mergeable in principle, but signals deserve a look
    | 'ready' // no blockers, no warnings

export type ReviewCheckStatus = 'pass' | 'fail' | 'unknown'

/**
 * One verifiable statement about a submission.
 *
 * `unknown` exists so a check that cannot decide stays silent instead of
 * claiming a defect - anything surfaced publicly must be certain.
 */
export interface ReviewCheck {
  key: string
  status: ReviewCheckStatus
  msg: string
  /** Actionable hint for the PR author - the "how do I fix this" part. */
  hint?: string
  /** True when this check alone prevents a merge. */
  blocking?: boolean
}

export interface ReviewComment {
  user: string
  at: string
  body: string
}

export interface ReviewConversation {
  /** Who owes the next move. Null when nothing was ever said. */
  waitingOn: 'author' | 'maintainer' | null
  waitingSinceDays: number | null
  maintainerComments: ReviewComment[]
  authorReplies: number
  changesRequested: number
  /** Flagged by the agent-scan workflow in nuxt/modules. */
  botFlagged: boolean
}

export interface ReviewCiInfo {
  total: number
  failed: number
  failedNames: string[]
  conclusion: 'success' | 'failure' | 'pending' | null
}

export interface ReviewPullRequest {
  number: number
  title: string
  url: string
  author: string
  authorAvatar: string | null
  createdAt: string
  updatedAt: string
  ageDays: number
  draft: boolean
  /** GitHub `mergeable_state`: clean | dirty | blocked | unstable | unknown. */
  mergeableState: string | null
  labels: string[]
  headSha: string | null
  /** Fork the PR originates from, e.g. "someone/modules". */
  headRepo: string | null
  /** False means autofix cannot push a fix - the PR can never go green on its own. */
  maintainerCanModify: boolean | null
  ci: ReviewCiInfo | null
  conversation: ReviewConversation
}

/** The module as proposed by the PR, parsed from the yaml at its head. */
export interface ReviewSubmission {
  kind: 'new' | 'update' | 'unrelated'
  /** Module file the PR adds or changes, e.g. "modules/foo.yml". */
  filePath: string | null
  /**
   * False when the file sits outside `modules/` or lacks a `.yml` extension.
   * `readModules()` globs `modules/*.yml`, so such a PR has no effect at all.
   */
  filePathValid: boolean
  /** Further module files in the same PR - usually autofix reformatting. */
  otherFiles: string[]
  /** Fields that differ from the listed entry. Only meaningful for `update`. */
  changedFields: string[]

  name: string | null
  npmPackage: string | null
  repo: string | null
  github: string | null
  website: string | null
  category: string | null
  type: 'official' | 'community' | '3rd-party' | null
  maintainers: string[]
  /** Raw `compatibility.nuxt` range from the yaml. */
  compatibility: string | null
  icon: string | null
  /** Whether the referenced icon exists (added by the PR or already present). */
  iconExists: boolean | null
}

/** Does the person submitting the module actually own it? */
export interface ReviewOwnership {
  prAuthor: string
  repoOwner: string | null
  npmMaintainers: string[]
  authorIsRepoOwner: boolean | null
  authorIsNpmMaintainer: boolean | null
}

/** A maintainer parked the PR on purpose - never suggest closing it. */
export interface ReviewHold {
  by: string
  at: string
  quote: string
}

export interface ReviewVerdict {
  bucket: ReviewBucket
  /** One-line reason for the bucket, e.g. "npm package is deprecated". */
  reason: string
  blockers: string[]
  warnings: string[]
  hold: ReviewHold | null
}

export interface ReviewModule {
  /** Stable key - the PR number. */
  id: number
  pr: ReviewPullRequest
  submission: ReviewSubmission
  /**
   * Full analysis of the submitted module, same shape as a listed module.
   * Null when it could not be analysed - see `analysisError`.
   *
   * Note: the crawled README text is deliberately NOT kept here. Only the
   * derived checks are stored, so the cache stays small.
   */
  analysis: ModuleData | null
  analysisError: string | null
  analysedAt: string
  ownership: ReviewOwnership
  checks: ReviewCheck[]
  /** Listed modules with a suspiciously similar name - typosquat / duplicate hint. */
  similarTo: string[]
  /** Score of the currently listed version, for updates. Null for new modules. */
  previousScore: number | null
  verdict: ReviewVerdict
}

/** Trimmed shape for the list view - the full analysis stays on the server. */
export interface ReviewModuleSlim {
  id: number
  prNumber: number
  prTitle: string
  prUrl: string
  author: string
  authorAvatar: string | null
  ageDays: number
  kind: ReviewSubmission['kind']
  name: string | null
  npmPackage: string | null
  score: number | null
  status: ModuleStatus
  bucket: ReviewBucket
  reason: string
  blockerCount: number
  warningCount: number
  waitingOn: 'author' | 'maintainer' | null
}

export interface ReviewSyncMeta {
  schemaVersion: number
  lastSync: string | null
  isRunning: boolean
  startedAt: string | null
  totalPrs: number
  analysedPrs: number
  duration: number | null
  error: string | null
  /** GitHub calls used by the last run - keeps the rate limit visible. */
  apiCalls: number | null
}
