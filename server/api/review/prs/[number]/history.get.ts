// Past states of a single submission. Reads only, never writes.

import { getReviewHistory } from '../../../../utils/review-history'

export default defineEventHandler(async (event) => {
  const number = Number(getRouterParam(event, 'number'))
  if (!Number.isInteger(number) || number < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid PR number' })
  }

  const history = await getReviewHistory(number)

  return {
    prNumber: number,
    total: history?.snapshots.length ?? 0,
    snapshots: history?.snapshots ?? [],
  }
})
