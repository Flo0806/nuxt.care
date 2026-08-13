import { describe, it, expect } from 'vitest'
import {
  emptyReviewMeta,
  REVIEW_SCHEMA_VERSION,
} from '../../server/utils/review-storage'

describe('emptyReviewMeta', () => {
  it('starts unlocked and stamped with the current schema version', () => {
    const meta = emptyReviewMeta()

    expect(meta.isRunning).toBe(false)
    expect(meta.startedAt).toBeNull()
    expect(meta.lastRun).toBeNull()
    expect(meta.schemaVersion).toBe(REVIEW_SCHEMA_VERSION)
  })

  it('starts with no PRs counted', () => {
    const meta = emptyReviewMeta()

    expect(meta.totalPrs).toBe(0)
    expect(meta.changedPrs).toBe(0)
    expect(meta.apiCalls).toBe(0)
  })
})
