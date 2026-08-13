// Mergeability, and who is allowed to fix a pull request.
//
// One call per pull request, because none of these fields travel in the list
// response. What makes that affordable is the refresh rule below: a merge
// verdict only goes stale when the pull request moves, or when the target
// branch moves under it.

import { ghFetch } from './fetchers'
import { fetchPullRequest, REVIEW_REPO } from './review-fetch'

/** Current head of the branch every submission is measured against. */
export async function fetchBaseSha(token?: string): Promise<string | null> {
  const data = await ghFetch<GitHubCommitResponse[]>(
    `https://api.github.com/repos/${REVIEW_REPO}/commits?per_page=1`,
    token,
  )
  return data?.[0]?.sha ?? null
}

/**
 * Whether a stored verdict still says anything about today.
 *
 * Three reasons to ask again: we never asked, the target branch moved, or
 * GitHub had not finished computing the answer last time.
 */
export function needsMergeRefresh(merge: ReviewMerge | null, baseSha: string | null): boolean {
  if (!merge) return true
  if (merge.mergeable === null) return true
  return !!baseSha && merge.baseSha !== baseSha
}

export async function fetchReviewMerge(
  prNumber: number,
  baseSha: string | null,
  fetchedAt: string,
  token?: string,
): Promise<ReviewMerge | null> {
  const pr = await fetchPullRequest(prNumber, token)
  if (!pr) return null

  return {
    maintainerCanModify: pr.maintainer_can_modify ?? null,
    mergeable: pr.mergeable ?? null,
    state: pr.mergeable_state ?? null,
    baseSha,
    fetchedAt,
  }
}
