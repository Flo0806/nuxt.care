// Just the state of the review cache, for polling.
//
// Separate from GET /api/review/prs on purpose: that one carries every entry,
// which is around 190 KB. Asking for it every five seconds to read two numbers
// would be absurd.
//
// It also clears a lock left behind by a crashed run, the same way
// GET /api/sync does for the module sync. That matters: a run whose process
// died never releases the lock itself, and without this every later run would
// bounce off it until the stale window passed.

import { getReviewMeta, patchReviewMeta, REVIEW_STALE_LOCK_MS } from '../../utils/review-storage'

export default defineEventHandler(async () => {
  const meta = await getReviewMeta()
  if (!meta.isRunning) return meta

  const lockAge = meta.startedAt ? Date.now() - new Date(meta.startedAt).getTime() : Infinity
  if (lockAge < REVIEW_STALE_LOCK_MS) return meta

  console.warn(`[review.status] Stale lock after ${Math.round(lockAge / 60000)}min, resetting`)

  return await patchReviewMeta({
    isRunning: false,
    startedAt: null,
    phase: null,
    processed: 0,
    error: 'The previous run stopped without finishing',
  })
})
