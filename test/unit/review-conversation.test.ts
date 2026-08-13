import { describe, it, expect } from 'vitest'
import type { ReviewComment, ReviewConversation } from '../../shared/types/review'
import { deriveWaitingOn, detectHold } from '../../server/utils/review-conversation'

function conversation(overrides: Partial<ReviewConversation> = {}): ReviewConversation {
  return {
    maintainerComments: [],
    authorReplies: 0,
    changesRequested: 0,
    lastMaintainerActivity: null,
    lastAuthorActivity: null,
    fetchedAt: '2026-08-12T10:00:00.000Z',
    ...overrides,
  }
}

function comment(overrides: Partial<ReviewComment> = {}): ReviewComment {
  return {
    user: 'danielroe',
    at: '2026-05-14T10:00:00.000Z',
    body: 'looks good',
    ...overrides,
  }
}

describe('deriveWaitingOn', () => {
  it('reports nobody when no maintainer ever engaged', () => {
    expect(deriveWaitingOn(conversation())).toBeNull()
    expect(deriveWaitingOn(null)).toBeNull()
  })

  it('reports nobody when only the author ever posted', () => {
    expect(deriveWaitingOn(conversation({
      lastAuthorActivity: '2026-05-01T00:00:00.000Z',
    }))).toBeNull()
  })

  it('puts the author on the move when the maintainer spoke last', () => {
    expect(deriveWaitingOn(conversation({
      lastMaintainerActivity: '2026-05-14T00:00:00.000Z',
      lastAuthorActivity: '2026-04-23T00:00:00.000Z',
    }))).toBe('author')
  })

  it('puts the author on the move when they never answered at all', () => {
    expect(deriveWaitingOn(conversation({
      lastMaintainerActivity: '2026-05-14T00:00:00.000Z',
    }))).toBe('author')
  })

  it('puts the maintainer on the move once the author has answered', () => {
    expect(deriveWaitingOn(conversation({
      lastMaintainerActivity: '2024-03-16T00:00:00.000Z',
      lastAuthorActivity: '2025-12-18T00:00:00.000Z',
    }))).toBe('maintainer')
  })
})

describe('detectHold', () => {
  it('finds nothing in an ordinary review comment', () => {
    expect(detectHold(conversation({
      maintainerComments: [comment({ body: 'Your module description does not look complete.' })],
    }))).toBeNull()
  })

  it('finds the deferral that #1456 actually contains', () => {
    const hold = detectHold(conversation({
      maintainerComments: [comment({
        body: 'I\'ll defer merging this then 🙏 let me know if I can help at all',
      })],
    }))

    expect(hold?.by).toBe('danielroe')
    expect(hold?.quote).toContain('defer merging')
  })

  it('quotes the matching sentence rather than the whole comment', () => {
    const hold = detectHold(conversation({
      maintainerComments: [comment({
        body: 'Thanks for the work here. Let\'s wait for the upstream release. Ping me after.',
      })],
    }))

    expect(hold?.quote).toBe('Let\'s wait for the upstream release.')
  })

  it('keeps the most recent hold when a maintainer repeats themselves', () => {
    const hold = detectHold(conversation({
      maintainerComments: [
        comment({ at: '2026-01-01T00:00:00.000Z', body: 'On hold for now.' }),
        comment({ at: '2026-06-01T00:00:00.000Z', body: 'Still holding off, sorry.' }),
      ],
    }))

    expect(hold?.at).toBe('2026-06-01T00:00:00.000Z')
    expect(hold?.quote).toBe('Still holding off, sorry.')
  })
})
