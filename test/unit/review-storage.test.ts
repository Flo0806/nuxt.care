import { describe, it, expect } from 'vitest'
import type { ReviewModule } from '../../shared/types/review'
import { createErrorModule } from '../../server/utils/module-analysis'
import {
  emptyReviewMeta,
  toReviewSlim,
  REVIEW_SCHEMA_VERSION,
} from '../../server/utils/review-storage'

function makeReviewModule(overrides: Partial<ReviewModule> = {}): ReviewModule {
  return {
    id: 1549,
    pr: {
      number: 1549,
      title: 'feat: add avensio-jsonld module',
      url: 'https://github.com/nuxt/modules/pull/1549',
      author: 'Mastercuber',
      authorAvatar: null,
      createdAt: '2026-07-17T00:00:00.000Z',
      updatedAt: '2026-07-18T00:00:00.000Z',
      ageDays: 22,
      draft: false,
      mergeableState: 'clean',
      labels: ['module'],
      headSha: 'abc123',
      headRepo: 'AvensioDev/modules',
      maintainerCanModify: false,
      ci: { total: 5, failed: 1, failedNames: ['autofix'], conclusion: 'failure' },
      conversation: {
        waitingOn: 'author',
        waitingSinceDays: 12,
        maintainerComments: [],
        authorReplies: 0,
        changesRequested: 0,
        botFlagged: false,
      },
    },
    submission: {
      kind: 'new',
      filePath: 'modules/avensio-jsonld.yml',
      filePathValid: true,
      otherFiles: [],
      changedFields: [],
      name: 'avensio-jsonld',
      npmPackage: '@avensio/nuxt-jsonld',
      repo: 'AvensioDev/nuxt-jsonld',
      github: 'https://github.com/AvensioDev/nuxt-jsonld',
      website: '',
      category: 'SEO',
      type: '3rd-party',
      maintainers: ['Mastercuber'],
      compatibility: '>=3.0.0',
      icon: null,
      iconExists: null,
    },
    analysis: null,
    analysisError: null,
    analysedAt: '2026-08-09T10:00:00.000Z',
    ownership: {
      prAuthor: 'Mastercuber',
      repoOwner: 'AvensioDev',
      npmMaintainers: ['avensio'],
      authorIsRepoOwner: false,
      authorIsNpmMaintainer: false,
    },
    checks: [],
    similarTo: [],
    previousScore: null,
    verdict: {
      bucket: 'waiting-author',
      reason: 'autofix is red and cannot push a fix',
      blockers: [],
      warnings: ['no types', 'no license'],
      hold: null,
    },
    ...overrides,
  }
}

describe('emptyReviewMeta', () => {
  it('starts unlocked and stamped with the current schema version', () => {
    const meta = emptyReviewMeta()

    expect(meta.isRunning).toBe(false)
    expect(meta.startedAt).toBeNull()
    expect(meta.lastSync).toBeNull()
    expect(meta.schemaVersion).toBe(REVIEW_SCHEMA_VERSION)
  })
})

describe('toReviewSlim', () => {
  it('carries the PR identity through', () => {
    const slim = toReviewSlim(makeReviewModule())

    expect(slim.id).toBe(1549)
    expect(slim.prNumber).toBe(1549)
    expect(slim.prUrl).toBe('https://github.com/nuxt/modules/pull/1549')
    expect(slim.author).toBe('Mastercuber')
    expect(slim.ageDays).toBe(22)
  })

  it('reports counts rather than the full lists', () => {
    const slim = toReviewSlim(makeReviewModule())

    expect(slim.warningCount).toBe(2)
    expect(slim.blockerCount).toBe(0)
  })

  it('reports an unanalysed module as unknown instead of zero', () => {
    const slim = toReviewSlim(makeReviewModule({ analysis: null }))

    expect(slim.score).toBeNull()
    expect(slim.status).toBe('unknown')
  })

  it('derives the status from the analysed score', () => {
    const analysis = createErrorModule(
      { name: 'x', npm: 'x', repo: 'a/b' },
      'unused',
    )
    analysis.health = { score: 78, signals: [] }

    const slim = toReviewSlim(makeReviewModule({ analysis }))

    expect(slim.score).toBe(78)
    expect(slim.status).toBe('stable')
  })

  it('passes the verdict through unchanged', () => {
    const slim = toReviewSlim(makeReviewModule())

    expect(slim.bucket).toBe('waiting-author')
    expect(slim.reason).toBe('autofix is red and cannot push a fix')
    expect(slim.waitingOn).toBe('author')
  })
})
