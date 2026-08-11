// The module yaml a single pull request submits.
// Triggered by hand, bypasses the cache. Nothing here runs on a page view.

import { fetchSubmission } from '../../../utils/review-fetch'

export default defineEventHandler(async (event) => {
  const number = Number(getRouterParam(event, 'number'))
  if (!Number.isInteger(number) || number < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid PR number' })
  }

  const submission = await fetchSubmission(number, useRuntimeConfig().github?.token)
  if (!submission) {
    throw createError({ statusCode: 502, statusMessage: 'Could not load PR files' })
  }

  return { prNumber: number, ...submission }
})
