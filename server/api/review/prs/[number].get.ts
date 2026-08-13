// The module yaml a single pull request submits, read live.
//
// Restricted, unlike the rest of the review API. Everything else answers from
// the cache, this one asks GitHub on every call and has no cache in front of
// it, so left open it is a way for anyone to burn our rate limit.

import type { SessionUser } from '~~/shared/types/auth'
import { fetchSubmission } from '../../../utils/review-fetch'

export default defineEventHandler(async (event) => {
  const number = Number(getRouterParam(event, 'number'))
  if (!Number.isInteger(number) || number < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid PR number' })
  }

  const session = await requireUserSession(event)
  const config = useRuntimeConfig()

  if (!isReviewAdmin((session.user as SessionUser)?.username, config.public.reviewAdmins)) {
    throw createError({ statusCode: 403, statusMessage: 'Not allowed to read submissions live' })
  }

  const submission = await fetchSubmission(number, config.github?.token)
  if (!submission) {
    throw createError({ statusCode: 502, statusMessage: 'Could not load PR files' })
  }

  return { prNumber: number, ...submission }
})
