// Where a submission stands, and how each group is presented.
//
// Order, labels and sorting live together on purpose. The chain below IS the
// grouping: if the two ever drift apart, the list lies about itself.

import type {
  ReviewBucket,
  ReviewEntry,
  ReviewHold,
  ReviewWaitingOn,
} from '../types/review'

/** No npm release in this long counts as a rotting module. */
export const STALE_PUBLISH_DAYS = 365

/**
 * Which end of a group is the useful end, by last activity.
 *
 * `newest` where the action is to merge or to nudge: an author who submitted
 * last week answers a comment, one from 2023 does not.
 *
 * `oldest` where the action is to close, or where we owe the answer. There the
 * longest untouched entry is the point.
 */
export type ReviewBucketSort = 'newest' | 'oldest'

export interface ReviewBucketDefinition {
  key: ReviewBucket
  label: string
  /** What the group means, and what to do about it. */
  hint: string
  sort: ReviewBucketSort
  /** Groups worth opening straight away are the ones somebody can act on. */
  openByDefault: boolean
}

/** In chain order. The list renders them exactly like this. */
export const REVIEW_BUCKETS: ReviewBucketDefinition[] = [
  {
    key: 'hold',
    label: 'On hold',
    hint: 'A maintainer parked this deliberately. Read the quote before acting.',
    sort: 'oldest',
    openByDefault: false,
  },
  {
    key: 'broken',
    label: 'No effect',
    hint: 'The file is not picked up, or the yaml does not parse. Nothing here can ever merge as is.',
    sort: 'oldest',
    openByDefault: false,
  },
  {
    key: 'dead',
    label: 'Dead package',
    hint: 'Deprecated on npm, missing, or the npm field is not a package name.',
    sort: 'oldest',
    openByDefault: false,
  },
  {
    key: 'ci-red',
    label: 'Needs a format fix',
    hint: 'autofix is red and nobody told the author. One comment usually clears it.',
    sort: 'newest',
    openByDefault: true,
  },
  {
    key: 'waiting-author',
    label: 'Waiting on the author',
    hint: 'A maintainer asked something and has not heard back.',
    sort: 'oldest',
    openByDefault: false,
  },
  {
    key: 'waiting-maintainer',
    label: 'Waiting on us',
    hint: 'The author delivered and nobody has looked since.',
    sort: 'oldest',
    openByDefault: true,
  },
  {
    key: 'rotten',
    label: 'Module gone stale',
    hint: 'The PR is fine, the package has not seen a release in over a year.',
    sort: 'oldest',
    openByDefault: false,
  },
  {
    key: 'unchecked',
    label: 'Not verified',
    hint: 'No check ever ran, or npm could not be read. Unknown, which is not the same as fine.',
    sort: 'newest',
    openByDefault: false,
  },
  {
    key: 'ready',
    label: 'Ready',
    hint: 'Checks green, package alive, nobody waiting on anything.',
    sort: 'newest',
    openByDefault: true,
  },
]

/**
 * One group, in the order that group is meant to be read.
 *
 * Always by `updatedAt`, which is the last time anything happened on the pull
 * request at all: a comment, a review or a push. Only the direction differs.
 */
export function sortBucketEntries<T extends { updatedAt: string }>(
  entries: T[],
  sort: ReviewBucketSort,
): T[] {
  const direction = sort === 'newest' ? -1 : 1
  const time = (value: string) => {
    const parsed = Date.parse(value)
    return Number.isNaN(parsed) ? 0 : parsed
  }

  return [...entries].sort((a, b) => direction * (time(a.updatedAt) - time(b.updatedAt)))
}

/**
 * First match wins. Two rules deserve a word:
 *
 * `broken` sits above `ci-red` because a misplaced file fails autofix too, and
 * "your file is in the wrong place" is the useful message, not "CI is red".
 *
 * `rotten` sits above `unchecked` because a package nobody has released in a
 * year is a harder fact than a check that never ran.
 */
export function deriveBucket(
  entry: ReviewEntry,
  waitingOn: ReviewWaitingOn,
  hold: ReviewHold | null,
): ReviewBucket {
  if (hold) return 'hold'

  if (!entry.candidate?.isModulePath || entry.yamlError) return 'broken'

  // `error` is excluded here: it means our request failed, which says nothing
  // about the package. Calling that dead would blame the submission for our
  // own network. It falls through to `unchecked` instead.
  const npm = entry.npm
  if (npm?.deprecated) return 'dead'
  if (npm && npm.status !== 'ok' && npm.status !== 'error') return 'dead'

  if (entry.ci?.conclusion === 'failure') return 'ci-red'

  if (waitingOn === 'author') return 'waiting-author'
  if (waitingOn === 'maintainer') return 'waiting-maintainer'

  if ((npm?.daysSincePublish ?? 0) > STALE_PUBLISH_DAYS) return 'rotten'

  // Nothing speaks against it, but something could not be verified either.
  if (!npm || npm.status !== 'ok' || entry.ci?.conclusion !== 'success') return 'unchecked'

  return 'ready'
}
