// The checks nuxt/modules runs on a submission, mainly autofix.ci.
//
// These belong to the head commit, not to the PR. That is what makes them
// cheap to cache: once every run on a fixed sha has completed, the outcome
// cannot change any more, so it only has to be read again after a push.

import { ghFetch } from './fetchers'
import { REVIEW_REPO } from './review-fetch'

/** Conclusions that make the whole set red. */
const FAILED = new Set(['failure', 'timed_out', 'cancelled', 'action_required', 'startup_failure'])

export function isFailedRun(run: { conclusion: string | null }): boolean {
  return !!run.conclusion && FAILED.has(run.conclusion)
}

/**
 * One verdict over a set of runs. Shared with the detail view, so the summary
 * on the card and the list of individual checks can never disagree.
 */
export function ciConclusion(runs: Array<{ status: string, conclusion: string | null }>): ReviewCiConclusion {
  if (!runs.length) return 'none'
  if (runs.some(isFailedRun)) return 'failure'
  if (runs.some(run => run.status !== 'completed')) return 'pending'
  return 'success'
}

/** True when the stored result cannot tell us about the current commit. */
export function needsCiRefresh(ci: ReviewCi | null, headSha: string | null): boolean {
  if (!headSha) return false
  if (!ci) return true
  if (ci.sha !== headSha) return true
  // Something was still running, so the outcome is not settled yet.
  return ci.conclusion === 'pending'
}

export async function fetchReviewCi(headSha: string, fetchedAt: string, token?: string): Promise<ReviewCi | null> {
  const data = await ghFetch<GitHubCheckRunsResponse>(
    `https://api.github.com/repos/${REVIEW_REPO}/commits/${headSha}/check-runs?per_page=100`,
    token,
  )
  if (!data) return null

  const runs = data.check_runs ?? []
  const failedRuns = runs.filter(isFailedRun)

  return {
    sha: headSha,
    conclusion: ciConclusion(runs),
    total: runs.length,
    failed: failedRuns.length,
    failedNames: failedRuns.map(run => run.name),
    fetchedAt,
  }
}
