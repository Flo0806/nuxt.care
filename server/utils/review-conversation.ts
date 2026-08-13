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

  // A push counts as the author answering, even without a word. Only their own
  // pushes though: autofix.ci commits into these branches, and a maintainer
  // merging main would otherwise read as the author having replied.
  const lastCommit = (commits ?? [])
    .filter(c => isAuthor(c.author?.login))
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

/**
 * Who owes the next move, purely from timestamps.
 *
 * Null when no maintainer ever engaged: such a PR is unreviewed, which is not
 * the same as somebody waiting for an answer.
 */
export function deriveWaitingOn(conversation: ReviewConversation | null): ReviewWaitingOn {
  const maintainer = conversation?.lastMaintainerActivity
  if (!maintainer) return null

  const author = conversation.lastAuthorActivity
  if (!author) return 'author'

  return new Date(maintainer) > new Date(author) ? 'author' : 'maintainer'
}

/**
 * Wordings that mean a maintainer parked the PR rather than asked for a fix.
 *
 * Kept short and matched generously. A false hit only moves a PR out of "ready
 * to merge" into "look at this", a miss tells a maintainer to merge something
 * they parked themselves. The two mistakes do not cost the same.
 */
const HOLD_PHRASES = [
  'defer',
  'on hold',
  'hold off',
  'holding off',
  'holding this',
  'park this',
  'parked',
  'revisit',
  'blocked on',
  'let\'s wait',
  'lets wait',
  'come back to this',
  'not merging',
  'won\'t merge',
  'wont merge',
]

/**
 * The most recent maintainer comment that reads like a deliberate hold.
 *
 * Known limitation: a later comment lifting the hold is not understood. That
 * is why the quote and its date travel with the flag.
 */
export function detectHold(conversation: ReviewConversation | null): ReviewHold | null {
  let hold: ReviewHold | null = null
  let holdTs = -Infinity

  for (const comment of conversation?.maintainerComments ?? []) {
    const quote = holdSentence(comment.body)
    if (!quote) continue

    const ts = new Date(comment.at).getTime()
    if (!Number.isFinite(ts) || ts < holdTs) continue

    hold = { by: comment.user, at: comment.at, quote }
    holdTs = ts
  }

  return hold
}

/** The single sentence that triggered the match, not the whole comment. */
function holdSentence(body: string): string | null {
  for (const raw of body.split(/(?<=[.!?\n])/)) {
    const sentence = raw.replace(/\s+/g, ' ').trim()
    if (!sentence) continue

    const lower = sentence.toLowerCase()
    if (HOLD_PHRASES.some(phrase => lower.includes(phrase))) {
      return sentence.length > 200 ? `${sentence.slice(0, 200)}...` : sentence
    }
  }

  return null
}

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
