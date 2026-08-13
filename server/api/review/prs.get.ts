// Open submissions to nuxt/modules, served from the review cache.
// No GitHub call here: the cache is filled by POST /api/review/run.
//
// Everything past the stored entry is derived on read. These are pure
// functions of facts we already hold, and deriving keeps a wording change from
// invalidating the cache.

import { deriveWaitingOn, detectHold } from '../../utils/review-conversation'
import { findDuplicate, getListedIndex } from '../../utils/review-duplicates'
import { getReviewEntries, getReviewMeta } from '../../utils/review-storage'

export default defineEventHandler(async () => {
  const [entries, meta, listed] = await Promise.all([
    getReviewEntries(),
    getReviewMeta(),
    getListedIndex(),
  ])

  return {
    total: entries.length,
    meta,
    entries: entries.map((entry): ReviewEntryView => {
      const waitingOn = deriveWaitingOn(entry.conversation)
      const hold = detectHold(entry.conversation)

      return {
        ...entry,
        waitingOn,
        hold,
        bucket: deriveBucket(entry, waitingOn, hold),
        ownership: deriveOwnership(entry),
        duplicate: findDuplicate(entry, listed),
      }
    }),
  }
})
