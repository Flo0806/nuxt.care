// The individual checks on a head commit, loaded when a detail is opened.
//
// Caching is what makes this safe to hang off a click. The key is the commit,
// not the pull request, so the content behind it can never change: ten people
// opening the same submission a hundred times cost one GitHub call in total,
// and a push produces a different sha and therefore a different key.

import { ghFetch } from './fetchers'
import { ciConclusion } from './review-ci'
import { REVIEW_REPO } from './review-fetch'

const key = (sha: string) => `review:checks:${sha}`

/**
 * Settled results are kept for a month. Not for correctness - they cannot
 * change - but so keys of long dead commits do not pile up forever.
 */
const SETTLED_TTL_SECONDS = 30 * 24 * 60 * 60

export async function getReviewChecks(sha: string, token?: string): Promise<ReviewChecks | null> {
  const cached = await kv.get<ReviewChecks>(key(sha))
  if (cached) return cached

  const data = await ghFetch<GitHubCheckRunsResponse>(
    `https://api.github.com/repos/${REVIEW_REPO}/commits/${sha}/check-runs?per_page=100`,
    token,
  )
  if (!data) return null

  const runs = data.check_runs ?? []
  const checks: ReviewChecks = {
    sha,
    conclusion: ciConclusion(runs),
    runs: runs.map(run => ({
      name: run.name,
      status: run.status,
      conclusion: run.conclusion,
      url: run.html_url ?? run.details_url ?? null,
      completedAt: run.completed_at ?? null,
      title: run.output?.title ?? null,
      summary: run.output?.summary ?? null,
    })),
    fetchedAt: new Date().toISOString(),
  }

  // Something is still running, so this answer is not final yet. Storing it
  // would freeze a half finished state for a month.
  if (checks.conclusion !== 'pending') {
    await kv.set(key(sha), checks, { ttl: SETTLED_TTL_SECONDS })
  }

  return checks
}
