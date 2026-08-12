import { describe, it, expect } from 'vitest'
import type { ReviewEntry, ReviewNpm } from '../../shared/types/review'
import { deriveBucket, REVIEW_BUCKETS } from '../../shared/utils/review-bucket'

function npm(overrides: Partial<ReviewNpm> = {}): ReviewNpm {
  return {
    status: 'ok',
    raw: 'nuxt-thing',
    latestVersion: '1.0.0',
    lastPublish: '2026-07-01T00:00:00.000Z',
    daysSincePublish: 40,
    deprecated: null,
    releaseCount: 12,
    maintainers: ['someone'],
    nuxtRange: '>=3.0.0',
    hasTypes: true,
    hasTests: true,
    fetchedAt: '2026-08-12T10:00:00.000Z',
    ...overrides,
  }
}

/** A submission with nothing wrong with it. */
function entry(overrides: Partial<ReviewEntry> = {}): ReviewEntry {
  return {
    number: 1569,
    title: 'feat: add nuxt-thing',
    url: 'https://github.com/nuxt/modules/pull/1569',
    author: 'someone',
    authorAvatar: null,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-02T00:00:00.000Z',
    draft: false,
    labels: [],
    headSha: 'abc123',
    candidate: { filename: 'modules/nuxt-thing.yml', status: 'added', isModulePath: true, source: 'patch' },
    otherFiles: [],
    yaml: { name: 'nuxt-thing', npm: 'nuxt-thing' },
    yamlError: null,
    npm: npm(),
    ci: { sha: 'abc123', conclusion: 'success', total: 3, failed: 0, failedNames: [], fetchedAt: '2026-08-12T10:00:00.000Z' },
    conversation: null,
    fetchedAt: '2026-08-12T10:00:00.000Z',
    ...overrides,
  }
}

const hold = { by: 'danielroe', at: '2026-05-14T00:00:00.000Z', quote: 'I\'ll defer merging this' }

describe('deriveBucket', () => {
  it('calls a clean submission ready', () => {
    expect(deriveBucket(entry(), null, null)).toBe('ready')
  })

  it('puts a deliberate hold above everything else', () => {
    const parked = entry({ yamlError: 'bad indentation', npm: npm({ deprecated: 'gone' }) })
    expect(deriveBucket(parked, 'author', hold)).toBe('hold')
  })

  it('reports a misplaced file as no effect rather than as red CI', () => {
    const misplaced = entry({
      candidate: { filename: 'oxc-nuxt.yml', status: 'added', isModulePath: false, source: 'patch' },
      ci: { sha: 'abc123', conclusion: 'failure', total: 3, failed: 1, failedNames: ['autofix'], fetchedAt: 'x' },
    })
    expect(deriveBucket(misplaced, null, null)).toBe('broken')
  })

  it('treats unparsable yaml as no effect', () => {
    expect(deriveBucket(entry({ yamlError: 'bad indentation' }), null, null)).toBe('broken')
  })

  it('treats a deprecated package as dead', () => {
    expect(deriveBucket(entry({ npm: npm({ deprecated: 'no longer supported' }) }), null, null)).toBe('dead')
  })

  it('treats an npm field that is not a package name as dead', () => {
    expect(deriveBucket(entry({ npm: npm({ status: 'invalid_name' }) }), null, null)).toBe('dead')
  })

  it('does not blame the submission when our own npm request failed', () => {
    const unreachable = entry({ npm: npm({ status: 'error', latestVersion: null, daysSincePublish: null }) })
    expect(deriveBucket(unreachable, null, null)).toBe('unchecked')
  })

  it('still reports red checks when npm could not be read', () => {
    const unreachable = entry({
      npm: npm({ status: 'error', latestVersion: null, daysSincePublish: null }),
      ci: { sha: 'abc123', conclusion: 'failure', total: 3, failed: 1, failedNames: ['autofix'], fetchedAt: 'x' },
    })
    expect(deriveBucket(unreachable, null, null)).toBe('ci-red')
  })

  it('reports red checks when nothing worse applies', () => {
    const red = entry({ ci: { sha: 'abc123', conclusion: 'failure', total: 3, failed: 1, failedNames: ['autofix'], fetchedAt: 'x' } })
    expect(deriveBucket(red, null, null)).toBe('ci-red')
  })

  it('puts the conversation above the age of the package', () => {
    const old = entry({ npm: npm({ daysSincePublish: 900 }) })
    expect(deriveBucket(old, 'author', null)).toBe('waiting-author')
    expect(deriveBucket(old, 'maintainer', null)).toBe('waiting-maintainer')
  })

  it('calls a stale package rotten even when its checks are green', () => {
    expect(deriveBucket(entry({ npm: npm({ daysSincePublish: 900 }) }), null, null)).toBe('rotten')
  })

  it('prefers rotten over unchecked, because the stale release is the harder fact', () => {
    const both = entry({
      npm: npm({ daysSincePublish: 900 }),
      ci: { sha: 'abc123', conclusion: 'none', total: 0, failed: 0, failedNames: [], fetchedAt: 'x' },
    })
    expect(deriveBucket(both, null, null)).toBe('rotten')
  })

  it('never calls a submission without any check ready', () => {
    const noChecks = entry({ ci: { sha: 'abc123', conclusion: 'none', total: 0, failed: 0, failedNames: [], fetchedAt: 'x' } })
    expect(deriveBucket(noChecks, null, null)).toBe('unchecked')
    expect(deriveBucket(entry({ ci: null }), null, null)).toBe('unchecked')
  })
})

describe('REVIEW_BUCKETS', () => {
  it('covers every bucket the chain can return, exactly once', () => {
    const keys = REVIEW_BUCKETS.map(b => b.key)
    expect(new Set(keys).size).toBe(keys.length)
    expect(keys).toEqual([
      'hold',
      'broken',
      'dead',
      'ci-red',
      'waiting-author',
      'waiting-maintainer',
      'rotten',
      'unchecked',
      'ready',
    ])
  })
})
