import { describe, it, expect } from 'vitest'
import { createSnapshot, computeDiff } from '../../server/utils/history'
import { calculateHealth } from '../../server/utils/health'
import type { ModuleData, ModuleSnapshot } from '../../shared/types/modules'

function createModule(overrides: Partial<ModuleData> = {}): ModuleData {
  return {
    name: 'test-module',
    npmPackage: 'test-module',
    repo: 'test/test-module',
    description: 'Test module',
    category: 'test',
    type: 'community',
    maintainers: ['tester'],
    nuxtApiCompat: null,
    nuxtApiStats: null,
    github: null,
    topics: null,
    nuxt4Issues: null,
    release: null,
    oldestIssue: null,
    contributors: null,
    readme: null,
    ciStatus: null,
    pendingCommits: null,
    npm: null,
    keywords: null,
    nodeEngine: null,
    deps: null,
    moduleJson: null,
    vulnerabilities: null,
    health: { score: 0, signals: [] },
    ...overrides,
  }
}

describe('createSnapshot', () => {
  it('creates a snapshot with stable signal keys', () => {
    const mod = createModule({
      npm: {
        name: 'test',
        latestVersion: '1.0.0',
        lastPublish: new Date().toISOString(),
        daysSincePublish: 10,
        peerDeps: null,
        keywords: [],
        deprecated: null,
        hasTypes: true,
        hasTests: true,
        unpackedSize: null,
        downloads: 5000,
      },
      vulnerabilities: { count: 0, critical: 0, high: 0, medium: 0, low: 0, vulnerabilities: [] },
    })

    const snapshot = createSnapshot(mod)

    expect(snapshot.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(snapshot.score).toBeGreaterThanOrEqual(0)
    expect(snapshot.score).toBeLessThanOrEqual(100)

    // Signal keys must be stable identifiers, not display strings
    const keys = Object.keys(snapshot.signals)
    for (const key of keys) {
      expect(key).not.toContain(' ') // no spaces = stable key, not msg
    }

    // Must have core scoring signals
    expect(snapshot.signals).toHaveProperty('security')
    expect(snapshot.signals).toHaveProperty('trust')
    expect(snapshot.signals).toHaveProperty('tests')
    expect(snapshot.signals).toHaveProperty('types')
    expect(snapshot.signals).toHaveProperty('freshness')
    expect(snapshot.signals).toHaveProperty('nuxt4')
  })

  it('stores meta data correctly', () => {
    const mod = createModule({
      npm: {
        name: 'test',
        latestVersion: '2.5.0',
        lastPublish: new Date().toISOString(),
        daysSincePublish: 5,
        peerDeps: null,
        keywords: [],
        deprecated: null,
        hasTypes: true,
        hasTests: false,
        unpackedSize: null,
        downloads: 1234,
      },
      github: {
        fullName: 'test/test',
        defaultBranch: 'main',
        stars: 500,
        forks: 10,
        openIssues: 3,
        archived: false,
        pushedAt: '2026-03-19T10:00:00Z',
        topics: [],
        license: 'MIT',
      },
      vulnerabilities: { count: 1, critical: 0, high: 0, medium: 1, low: 0, vulnerabilities: [] },
    })

    const snapshot = createSnapshot(mod)

    expect(snapshot.meta.version).toBe('2.5.0')
    expect(snapshot.meta.downloads).toBe(1234)
    expect(snapshot.meta.stars).toBe(500)
    expect(snapshot.meta.openIssues).toBe(3)
    expect(snapshot.meta.archived).toBe(false)
    expect(snapshot.meta.vulnCount).toBe(1)
    expect(snapshot.meta.hasTypes).toBe(true)
    expect(snapshot.meta.hasTests).toBe(false)
  })
})

describe('computeDiff', () => {
  function makeSnapshot(score: number, signals: Record<string, { points: number, maxPoints: number }>, date = '2026-03-20'): ModuleSnapshot {
    return {
      date,
      score,
      signals,
      meta: {
        version: '1.0.0', downloads: 100, stars: 50, contributors: 3,
        lastCommit: null, lastRelease: null, openIssues: 0, pendingCommits: 0,
        deprecated: false, archived: false, vulnCount: 0,
        hasTests: true, hasTypes: true, ciPassing: true, nuxt4Compatible: true,
      },
    }
  }

  it('returns null when nothing changed', () => {
    const a = makeSnapshot(85, {
      security: { points: 15, maxPoints: 15 },
      tests: { points: 12, maxPoints: 12 },
    }, '2026-03-19')

    const b = makeSnapshot(85, {
      security: { points: 15, maxPoints: 15 },
      tests: { points: 12, maxPoints: 12 },
    }, '2026-03-20')

    expect(computeDiff('test', a, b)).toBeNull()
  })

  it('detects score changes with correct signal details', () => {
    const a = makeSnapshot(85, {
      security: { points: 15, maxPoints: 15 },
      ci: { points: 3, maxPoints: 3 },
      freshness: { points: 20, maxPoints: 20 },
    }, '2026-03-19')

    const b = makeSnapshot(82, {
      security: { points: 15, maxPoints: 15 },
      ci: { points: 0, maxPoints: 3 },
      freshness: { points: 20, maxPoints: 20 },
    }, '2026-03-20')

    const diff = computeDiff('test', a, b)

    expect(diff).not.toBeNull()
    expect(diff!.oldScore).toBe(85)
    expect(diff!.newScore).toBe(82)
    expect(diff!.changes).toHaveLength(1)
    expect(diff!.changes[0]).toEqual({
      signal: 'ci',
      oldPoints: 3,
      newPoints: 0,
      maxPoints: 3,
    })
  })

  it('ignores info-only signals (maxPoints 0)', () => {
    const a = makeSnapshot(80, {
      security: { points: 15, maxPoints: 15 },
      downloads: { points: 0, maxPoints: 0 },
    }, '2026-03-19')

    const b = makeSnapshot(80, {
      security: { points: 15, maxPoints: 15 },
      downloads: { points: 0, maxPoints: 0 },
      stars: { points: 0, maxPoints: 0 },
    }, '2026-03-20')

    expect(computeDiff('test', a, b)).toBeNull()
  })
})

describe('calculateHealth signal keys', () => {
  it('all signals have a key field', () => {
    const mod = createModule()
    const result = calculateHealth(mod)

    for (const signal of result.signals) {
      expect(signal).toHaveProperty('key')
      expect(signal.key).toBeTruthy()
      expect(signal.key).not.toContain(' ')
    }
  })
})
