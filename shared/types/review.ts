// Modules in review - open PRs against nuxt/modules that are not merged yet.
//
// Storage is fully separated from the synced registry: everything lives under
// the `review:` KV prefix, nothing here reads or writes `modules:*`.
//
// These types describe what is fetched, plus what is derived from it on read.
// Anything derived carries its type here rather than next to its function, so
// nothing in `shared` ever has to reach into `server`.

import type { GitHubPullRequestFileResponse } from './modules'

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

/**
 * Outcome of the checks nuxt/modules runs on the PR itself, mainly autofix.ci.
 *
 * `none` is not `success`: a PR older than the current workflows has no checks
 * at all, which means we know nothing, not that everything is fine.
 */
export type ReviewCiConclusion = 'success' | 'failure' | 'pending' | 'none'

export interface ReviewCi {
  /** The commit these checks belong to. */
  sha: string
  conclusion: ReviewCiConclusion
  total: number
  failed: number
  failedNames: string[]
  fetchedAt: string
}

/**
 * Where a submission stands. The order of the union is the order of the
 * decision chain in deriveBucket(): the first match wins, so a PR that is both
 * broken and red lands in `broken`, where the useful action is.
 */
export type ReviewBucket
  = | 'hold' // a maintainer parked it on purpose
    | 'broken' // the file has no effect, or the yaml does not parse
    | 'dead' // package deprecated, missing, or the npm field is unusable
    | 'ci-red' // autofix failed, one comment to the author would fix it
    | 'waiting-author' // a maintainer asked something and got no answer
    | 'waiting-maintainer' // the author delivered and nobody looked
    | 'rotten' // module alive on paper, no npm release in over a year
    | 'unchecked' // nothing against it, but no check ever ran either
    | 'ready' // checks green, package alive, nothing pending

/**
 * Does the person submitting the module actually own it?
 *
 * Null means unknown, never "no": a package we could not read tells us nothing
 * about who maintains it.
 */
export interface ReviewOwnership {
  prAuthor: string
  repoOwner: string | null
  npmMaintainers: string[]
  authorIsRepoOwner: boolean | null
  authorIsNpmMaintainer: boolean | null
  /** True only when both checks ran and both said no. */
  unrelated: boolean
}

/** A listed module a submission collides with. */
export interface ReviewDuplicate {
  /** Which field matched: the package name, or the repository. */
  match: 'npm' | 'repo'
  /** Name of the module that is already listed. */
  name: string
  npmPackage: string
}

/** Null when no maintainer ever said anything, so nobody was asked for a move. */
export type ReviewWaitingOn = 'author' | 'maintainer' | null

/**
 * A maintainer parked the PR on purpose. Never suggest merging or closing it.
 * The quote is part of the flag: the wording is what a human judges, and the
 * matcher is deliberately generous, so it has to show its evidence.
 */
export interface ReviewHold {
  by: string
  at: string
  quote: string
}

export interface ReviewComment {
  user: string
  at: string
  /** Kept in full. Maintainer comments are short, and a hold hides in wording. */
  body: string
}

/**
 * Who said what on the PR. Bots are excluded: their comments are long, they
 * are not maintainers, and agent-scan already shows up as a label.
 */
export interface ReviewConversation {
  /** Comments by a maintainer of nuxt/modules, never by the PR author. */
  maintainerComments: ReviewComment[]
  authorReplies: number
  changesRequested: number
  /** Latest maintainer comment or requested change. */
  lastMaintainerActivity: string | null
  /** Latest author comment or push, whichever is newer. */
  lastAuthorActivity: string | null
  fetchedAt: string
}

/** A single check on the head commit, loaded when a detail is opened. */
export interface ReviewCheckRun {
  name: string
  status: 'queued' | 'in_progress' | 'completed'
  conclusion: string | null
  url: string | null
  completedAt: string | null
  /** What the check itself reports, which is where autofix says what it wants. */
  title: string | null
  summary: string | null
}

export interface ReviewChecks {
  sha: string
  conclusion: ReviewCiConclusion
  runs: ReviewCheckRun[]
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
  /** Head commit of the PR. A push moves it, which is how we spot new checks. */
  headSha: string | null

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

  /** Checks on the head commit. Null until they were looked up once. */
  ci: ReviewCi | null

  /** Comments and reviews. Null until they were looked up once. */
  conversation: ReviewConversation | null

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

/**
 * An entry plus everything derived from it on read.
 *
 * These are not cached on purpose: they are pure functions of the stored
 * facts, and the hold wording will keep changing. Storing them would mean
 * throwing the cache away on every tweak.
 */
export interface ReviewEntryView extends ReviewEntry {
  waitingOn: ReviewWaitingOn
  hold: ReviewHold | null
  bucket: ReviewBucket
  ownership: ReviewOwnership
  /** A listed module this submission collides with, if any. */
  duplicate: ReviewDuplicate | null
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
