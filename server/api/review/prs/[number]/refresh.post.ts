// Forces a reload of one submission.
//
// Restricted to the logins in NUXT_PUBLIC_REVIEW_ADMINS. The list is public,
// the check is not: hiding the button in the page decides nothing, this
// handler does.

import type { SessionUser } from '~~/shared/types/auth'
import { refreshSubmission } from '../../../../utils/review-refresh'
import { getReviewMeta, REVIEW_STALE_LOCK_MS } from '../../../../utils/review-storage'

export default defineEventHandler(async (event) => {
  const number = Number(getRouterParam(event, 'number'))
  if (!Number.isInteger(number) || number < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid PR number' })
  }

  const session = await requireUserSession(event)
  const config = useRuntimeConfig()
  const user = session.user as SessionUser

  if (!isReviewAdmin(user?.username, config.public.reviewAdmins)) {
    throw createError({ statusCode: 403, statusMessage: 'Not allowed to refresh submissions' })
  }

  const token = config.github?.token
  if (!token) {
    throw createError({ statusCode: 503, statusMessage: 'No GitHub token configured' })
  }

  // A run rewrites the whole entry array, so a refresh in between would be
  // overwritten or would overwrite it.
  const meta = await getReviewMeta()
  const lockAge = meta.startedAt ? Date.now() - new Date(meta.startedAt).getTime() : Infinity
  if (meta.isRunning && lockAge < REVIEW_STALE_LOCK_MS) {
    throw createError({ statusCode: 409, statusMessage: 'A run is in progress, try again shortly' })
  }

  const result = await refreshSubmission(number, token)
  if (!result) {
    throw createError({ statusCode: 502, statusMessage: 'Could not read the pull request' })
  }

  return { prNumber: number, changed: result.changed, refreshedAt: result.entry.fetchedAt }
})
