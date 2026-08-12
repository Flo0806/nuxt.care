// Who said what on a submission, and who owes the next move.
//
// Three calls per PR, so it only runs when the PR moved: a new comment, a
// requested change and a push all bump the PR's `updated_at`.

import { ghFetch } from './fetchers'
import { REVIEW_REPO } from './review-fetch'

/** Associations that make somebody a maintainer of nuxt/modules. */
const MAINTAINER = new Set(['OWNER', 'MEMBER', 'COLLABORATOR'])

export async function fetchReviewConversation(
  prNumber: number,
  author: string,
  fetchedAt: string,
  token?: string,
): Promise<ReviewConversation | null> {
  const [comments, reviews, commits] = await Promise.all([
    ghFetch<GitHubIssueCommentResponse[]>(
      `https://api.github.com/repos/${REVIEW_REPO}/issues/${prNumber}/comments?per_page=100`,
      token,
    ),
    ghFetch<GitHubReviewResponse[]>(
      `https://api.github.com/repos/${REVIEW_REPO}/pulls/${prNumber}/reviews?per_page=100`,
      token,
    ),
    ghFetch<GitHubCommitResponse[]>(
      `https://api.github.com/repos/${REVIEW_REPO}/pulls/${prNumber}/commits?per_page=100`,
      token,
    ),
  ])
  if (!comments || !reviews) return null

  const isAuthor = (login?: string | null) => !!login && login.toLowerCase() === author.toLowerCase()
  const human = comments.filter(c => c.user?.type !== 'Bot')

  const maintainerComments: ReviewComment[] = human
    .filter(c => MAINTAINER.has(c.author_association) && !isAuthor(c.user?.login))
    .map(c => ({ user: c.user?.login ?? 'unknown', at: c.created_at, body: c.body ?? '' }))

  const authorComments = human.filter(c => isAuthor(c.user?.login))

  const changesRequested = reviews.filter(r => r.state === 'CHANGES_REQUESTED')

  // A push counts as the author answering, even without a word.
  const lastCommit = (commits ?? [])
    .map(c => c.commit?.author?.date)
    .filter((d): d is string => !!d)

  return {
    maintainerComments,
    authorReplies: authorComments.length,
    changesRequested: changesRequested.length,
    lastMaintainerActivity: latest([
      ...maintainerComments.map(c => c.at),
      ...changesRequested.map(r => r.submitted_at),
    ]),
    lastAuthorActivity: latest([
      ...authorComments.map(c => c.created_at),
      ...lastCommit,
    ]),
    fetchedAt,
  }
}

/** How many GitHub calls one conversation costs. */
export const CONVERSATION_CALLS = 3

function latest(dates: Array<string | null | undefined>): string | null {
  let best: string | null = null
  let bestTs = -Infinity

  for (const date of dates) {
    if (!date) continue
    const ts = new Date(date).getTime()
    if (!Number.isFinite(ts) || ts <= bestTs) continue
    best = date
    bestTs = ts
  }

  return best
}
