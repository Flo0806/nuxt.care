// Fills the review cache.
//
// One call for the PR list, then the files only for PRs whose `updated_at`
// moved since the last run. Everything else is reused from the cache, so a
// normal run costs a handful of requests instead of one per PR.

import {
  fetchOpenPullRequests,
  fetchSubmission,
  submissionCallCount,
  toReviewEntry,
} from '../../utils/review-fetch'
import { appendReviewHistory } from '../../utils/review-history'
import { fetchReviewCi, needsCiRefresh } from '../../utils/review-ci'
import { CONVERSATION_CALLS, fetchReviewConversation } from '../../utils/review-conversation'
import { fetchReviewNpm } from '../../utils/review-npm'
import {
  getReviewEntries,
  getReviewMeta,
  patchReviewMeta,
  setReviewEntries,
  REVIEW_INTERVAL_MS,
  REVIEW_STALE_LOCK_MS,
} from '../../utils/review-storage'

export default defineEventHandler(async (event) => {
  const force = getQuery(event).force === 'true'
  const meta = await getReviewMeta()
  const now = Date.now()

  const lockAge = meta.startedAt ? now - new Date(meta.startedAt).getTime() : Infinity
  if (meta.isRunning && lockAge < REVIEW_STALE_LOCK_MS) {
    return { started: false, reason: 'A run is already in progress', meta }
  }

  const sinceLastRun = meta.lastRun ? now - new Date(meta.lastRun).getTime() : Infinity
  if (!force && sinceLastRun < REVIEW_INTERVAL_MS) {
    return { started: false, reason: 'Last run is too recent', meta }
  }

  const token = useRuntimeConfig().github?.token
  if (!token) {
    return { started: false, reason: 'No GitHub token configured', meta }
  }

  await patchReviewMeta({ isRunning: true, startedAt: new Date().toISOString(), error: null })

  try {
    const result = await run(token)
    return { started: true, ...result }
  }
  catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await patchReviewMeta({ isRunning: false, error: message })
    throw createError({ statusCode: 500, statusMessage: message })
  }
})

async function run(token: string) {
  const startedAt = Date.now()
  const fetchedAt = new Date().toISOString()

  const prs = await fetchOpenPullRequests(token)
  if (!prs) {
    await patchReviewMeta({ isRunning: false, error: 'Could not load the PR list' })
    throw new Error('Could not load the PR list')
  }
  // One call per page of 100.
  let apiCalls = Math.max(1, Math.ceil(prs.length / 100))

  const cached = new Map((await getReviewEntries()).map(e => [e.number, e]))
  const entries: ReviewEntry[] = []
  let changed = 0
  let failed = 0

  for (const pr of prs) {
    const known = cached.get(pr.number)
    if (known && known.updatedAt === pr.updated_at) {
      entries.push(known)
      continue
    }

    const submission = await fetchSubmission(pr.number, token)
    if (!submission) {
      // Transient GitHub error. Keep the previous state rather than dropping
      // the PR, and let the next run try again.
      failed++
      apiCalls++
      if (known) entries.push(known)
      continue
    }

    apiCalls += submissionCallCount(submission)
    changed++
    // Keep the state that is about to be overwritten.
    if (known) await appendReviewHistory(known, 'updated', fetchedAt)
    entries.push(toReviewEntry(pr, submission, fetchedAt))
  }

  // PRs that are no longer open simply do not make it into the new array. This
  // is the last moment their state exists anywhere, so it has to be kept now.
  const open = new Set(prs.map(pr => pr.number))
  const gone = [...cached.values()].filter(entry => !open.has(entry.number))
  for (const entry of gone) {
    await appendReviewHistory(entry, 'closed', fetchedAt)
  }

  // npm changes without the PR changing: a package can be deprecated or get a
  // release while the submission sits untouched. So this pass covers every
  // entry, not only the ones GitHub reported as moved.
  const withNpm: ReviewEntry[] = []
  let npmChanged = 0
  let ciFetched = 0
  let conversationFetched = 0
  for (const entry of entries) {
    const npm = await fetchReviewNpm(entry.yaml, fetchedAt)

    // Check runs are settled once every run on a fixed commit has completed,
    // so most entries keep what they already have.
    let ci = entry.ci
    if (needsCiRefresh(ci, entry.headSha) && entry.headSha) {
      apiCalls++
      ciFetched++
      ci = (await fetchReviewCi(entry.headSha, fetchedAt, token)) ?? ci
    }

    // Null means either "never looked up" or "the PR moved", because a new
    // comment, a review and a push all bump `updated_at` and rebuild the entry.
    let conversation = entry.conversation
    if (!conversation) {
      apiCalls += CONVERSATION_CALLS
      conversationFetched++
      conversation = await fetchReviewConversation(entry.number, entry.author, fetchedAt, token)
    }

    // A failed request must not erase what we already knew.
    if (npm.status === 'error' && entry.npm) {
      withNpm.push({ ...entry, ci, conversation })
      continue
    }

    const before = entry.npm
    if (before && (before.latestVersion !== npm.latestVersion || before.deprecated !== npm.deprecated)) {
      await appendReviewHistory(entry, 'npm-changed', fetchedAt)
      npmChanged++
    }

    withNpm.push({ ...entry, npm, ci, conversation })
  }

  await setReviewEntries(withNpm)

  const meta = await patchReviewMeta({
    isRunning: false,
    startedAt: null,
    lastRun: new Date().toISOString(),
    totalPrs: withNpm.length,
    changedPrs: changed,
    apiCalls,
    duration: Date.now() - startedAt,
    error: null,
  })

  return { changed, reused: entries.length - changed, failed, dropped: gone.length, npmChanged, ciFetched, conversationFetched, meta }
}
