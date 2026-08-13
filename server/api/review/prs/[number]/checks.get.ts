// The individual checks of a submission, for the detail view.
//
// The commit comes from the cache rather than from the request, so nobody can
// point this at an arbitrary sha and use it to fetch strangers' check runs.

import { getReviewChecks } from '../../../../utils/review-checks'
import { getReviewEntry } from '../../../../utils/review-storage'

export default defineEventHandler(async (event) => {
  const number = Number(getRouterParam(event, 'number'))
  if (!Number.isInteger(number) || number < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid PR number' })
  }

  const entry = await getReviewEntry(number)
  if (!entry) {
    throw createError({ statusCode: 404, statusMessage: 'Unknown submission' })
  }
  if (!entry.headSha) {
    return { prNumber: number, checks: null }
  }

  const checks = await getReviewChecks(entry.headSha, useRuntimeConfig().github?.token)
  return { prNumber: number, checks }
})
