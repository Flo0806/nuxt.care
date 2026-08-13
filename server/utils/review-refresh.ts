// Reloading one submission completely, on request.
//
// The scheduled run is careful about calls: it skips unchanged pull requests
// and keeps settled check results. That is right for 74 entries every hour,
// and wrong for the one submission somebody is looking at right now. So this
// path deliberately ignores every cache and asks GitHub again, which is what
// closes the gap for a check that was re-run by hand.

import { analyseSubmission, needsAnalysis } from './review-analysis'
import { invalidateReviewChecks } from './review-checks'
import { fetchReviewCi } from './review-ci'
import { deriveWaitingOn, detectHold, fetchReviewConversation } from './review-conversation'
import { fetchBaseSha } from './review-merge'
import { fetchPullRequest, fetchSubmission, toReviewEntry } from './review-fetch'
import { appendReviewHistory } from './review-history'
import { fetchReviewNpm } from './review-npm'
import { getReviewEntry, upsertReviewEntry } from './review-storage'

export interface RefreshResult {
  entry: ReviewEntry
  /** Whether the pull request itself had moved since the last look. */
  changed: boolean
}

/**
 * Reads everything about one submission again and stores it.
 *
 * Costs about six GitHub calls. Returns null when the pull request is gone,
 * which the caller reports rather than silently dropping the entry.
 */
export async function refreshSubmission(prNumber: number, token: string): Promise<RefreshResult | null> {
  const pr = await fetchPullRequest(prNumber, token)
  if (!pr) return null

  const submission = await fetchSubmission(prNumber, token)
  if (!submission) return null

  const known = await getReviewEntry(prNumber)
  const fetchedAt = new Date().toISOString()
  const changed = !known || known.updatedAt !== pr.updated_at

  // The state that is about to be replaced is worth keeping, same as in a run.
  if (known && changed) await appendReviewHistory(known, 'updated', fetchedAt)

  const headSha = pr.head?.sha ?? null
  if (headSha) await invalidateReviewChecks(headSha)

  const [npm, ci, conversation] = await Promise.all([
    fetchReviewNpm(submission.yaml, fetchedAt),
    headSha ? fetchReviewCi(headSha, fetchedAt, token) : Promise.resolve(null),
    fetchReviewConversation(prNumber, pr.user?.login ?? 'unknown', fetchedAt, token),
  ])

  // The pull request we already hold carries the merge fields themselves. The
  // base commit costs one call and has to be the current head of the target
  // branch: carrying the old one over would label a fresh verdict with the
  // commit a previous one was judged against, and needsMergeRefresh() reads
  // exactly that field to decide whether to look again.
  const merge: ReviewMerge = {
    maintainerCanModify: pr.maintainer_can_modify ?? null,
    mergeable: pr.mergeable ?? null,
    state: pr.mergeable_state ?? null,
    baseSha: await fetchBaseSha(token),
    fetchedAt,
  }

  const entry: ReviewEntry = {
    ...toReviewEntry(pr, submission, fetchedAt),
    npm,
    ci,
    merge,
    conversation,
    // Carried over so a refresh does not throw away a score it may not redo.
    analysis: known?.analysis ?? null,
    analysisError: known?.analysisError ?? null,
  }

  // A forced refresh redoes the score too, but only where one belongs at all.
  const bucket = deriveBucket(entry, deriveWaitingOn(conversation), detectHold(conversation))
  if (needsAnalysis({ ...entry, analysis: null }, bucket)) {
    const result = await analyseSubmission(entry, token)
    entry.analysis = result.analysis
    entry.analysisError = result.error
  }

  await upsertReviewEntry(entry)

  return { entry, changed }
}
