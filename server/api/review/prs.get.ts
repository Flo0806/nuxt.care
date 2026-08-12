// Open submissions to nuxt/modules, served from the review cache.
// No GitHub call here: the cache is filled by POST /api/review/run.

import { deriveWaitingOn, detectHold } from '../../utils/review-conversation'
import { getReviewEntries, getReviewMeta } from '../../utils/review-storage'

export default defineEventHandler(async () => {
  const [entries, meta] = await Promise.all([getReviewEntries(), getReviewMeta()])

  return {
    total: entries.length,
    meta,
    entries: entries.map((entry): ReviewEntryView => {
      const waitingOn = deriveWaitingOn(entry.conversation)
      const hold = detectHold(entry.conversation)
      return { ...entry, waitingOn, hold, bucket: deriveBucket(entry, waitingOn, hold) }
    }),
  }
})
