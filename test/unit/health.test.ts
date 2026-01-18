import { describe, it, expect } from 'vitest'
import { calculateHealth } from '../../server/utils/health'
import type { HealthSignal, ModuleData } from '../../shared/types/modules'

/**
 * Creates a minimal ModuleData with sensible defaults.
 * Override specific fields to test different scenarios.
 */
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

describe('calculateHealth', () => {
  describe('penalties', () => {
    it('applies -50 penalty for deprecated modules', () => {
      const module = createModule({
        npm: {
          name: 'test',
          latestVersion: '1.0.0',
          lastPublish: new Date().toISOString(),
          daysSincePublish: 10,
          peerDeps: null,
          keywords: [],
          deprecated: 'Use something else',
          hasTypes: false,
          hasTests: false,
          unpackedSize: null,
          downloads: null,
        },
      })

      const result = calculateHealth(module)
      const deprecatedSignal = result.signals.find((s: HealthSignal) => s.msg === 'Deprecated')

      expect(deprecatedSignal).toBeDefined()
      expect(deprecatedSignal?.points).toBe(-50)
    })

    it('applies -30 penalty for archived repos', () => {
      const module = createModule({
        github: {
          fullName: 'test/test',
          defaultBranch: 'main',
          stars: 100,
          forks: 10,
          openIssues: 5,
          archived: true,
          pushedAt: new Date().toISOString(),
          topics: [],
          license: 'MIT',
        },
      })

      const result = calculateHealth(module)
      const archivedSignal = result.signals.find((s: HealthSignal) => s.msg === 'Archived')

      expect(archivedSignal).toBeDefined()
      expect(archivedSignal?.points).toBe(-30)
    })

    it('applies -40 penalty for critical vulnerabilities', () => {
      const module = createModule({
        vulnerabilities: {
          count: 1,
          critical: 1,
          high: 0,
          medium: 0,
          low: 0,
          vulnerabilities: [{ id: 'CVE-123', summary: 'Bad', severity: 'CRITICAL' }],
        },
      })

      const result = calculateHealth(module)
      const vulnSignal = result.signals.find((s: HealthSignal) => s.msg.includes('critical'))

      expect(vulnSignal).toBeDefined()
      expect(vulnSignal?.points).toBe(-40)
    })

    it('applies -20 penalty for high vulnerabilities (no critical)', () => {
      const module = createModule({
        vulnerabilities: {
          count: 1,
          critical: 0,
          high: 2,
          medium: 0,
          low: 0,
          vulnerabilities: [{ id: 'CVE-456', summary: 'Bad', severity: 'HIGH' }],
        },
      })

      const result = calculateHealth(module)
      const vulnSignal = result.signals.find((s: HealthSignal) => s.msg.includes('high'))

      expect(vulnSignal).toBeDefined()
      expect(vulnSignal?.points).toBe(-20)
    })
  })

  describe('score boundaries', () => {
    it('score cannot go below 0', () => {
      const module = createModule({
        npm: {
          name: 'test',
          latestVersion: '1.0.0',
          lastPublish: new Date().toISOString(),
          daysSincePublish: 10,
          peerDeps: null,
          keywords: [],
          deprecated: 'Do not use',
          hasTypes: false,
          hasTests: false,
          unpackedSize: null,
          downloads: null,
        },
        github: {
          fullName: 'test/test',
          defaultBranch: 'main',
          stars: 0,
          forks: 0,
          openIssues: 0,
          archived: true,
          pushedAt: new Date().toISOString(),
          topics: [],
          license: null,
        },
        vulnerabilities: {
          count: 1,
          critical: 5,
          high: 0,
          medium: 0,
          low: 0,
          vulnerabilities: [],
        },
      })

      const result = calculateHealth(module)

      expect(result.score).toBe(0)
      expect(result.score).toBeGreaterThanOrEqual(0)
    })

    it('score cannot exceed 100', () => {
      // Create a "perfect" module with all positive signals
      const module = createModule({
        type: 'official',
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
          downloads: 100000,
        },
        github: {
          fullName: 'nuxt/test',
          defaultBranch: 'main',
          stars: 5000,
          forks: 100,
          openIssues: 5,
          archived: false,
          pushedAt: new Date().toISOString(),
          topics: ['nuxt4'],
          license: 'MIT',
        },
        ciStatus: {
          hasCI: true,
          lastRunConclusion: 'success',
          lastRunDate: new Date().toISOString(),
          workflowName: 'CI',
        },
        vulnerabilities: {
          count: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          vulnerabilities: [],
        },
        pendingCommits: {
          total: 0,
          nonChore: 0,
          commits: [],
        },
        topics: { hasNuxt4: true, hasNuxt3: true, hasNuxt2: false, isNuxtModule: true, all: ['nuxt4'] },
        nuxtApiCompat: { supports4: true, supports3: true, raw: '>=3.0.0' },
        contributors: { commitsLastYear: 50, uniqueContributors: 5, contributors: ['dev1', 'dev2'] },
      })

      const result = calculateHealth(module)

      expect(result.score).toBe(100)
      expect(result.score).toBeLessThanOrEqual(100)
    })
  })

  describe('nuxt 4 compatibility scoring', () => {
    it('gives 15 points for 2+ Nuxt 4 signals', () => {
      const module = createModule({
        nuxtApiCompat: { supports4: true, supports3: true, raw: '>=3' },
        topics: { hasNuxt4: true, hasNuxt3: true, hasNuxt2: false, isNuxtModule: true, all: [] },
        keywords: { hasNuxt4: false, hasNuxt3: false, all: [] },
        release: null,
      })

      const result = calculateHealth(module)
      const n4Signal = result.signals.find((s: HealthSignal) => s.msg.includes('Nuxt 4 compatible'))

      expect(n4Signal).toBeDefined()
      expect(n4Signal?.points).toBe(15)
    })

    it('gives 10 points for exactly 1 Nuxt 4 signal', () => {
      const module = createModule({
        nuxtApiCompat: { supports4: true, supports3: true, raw: '>=3' },
        topics: { hasNuxt4: false, hasNuxt3: true, hasNuxt2: false, isNuxtModule: true, all: [] },
        keywords: null,
        release: null,
      })

      const result = calculateHealth(module)
      const n4Signal = result.signals.find((s: HealthSignal) => s.msg.includes('Nuxt 4 partially'))

      expect(n4Signal).toBeDefined()
      expect(n4Signal?.points).toBe(10)
    })

    it('gives 5 points for official module with 0 signals', () => {
      const module = createModule({
        type: 'official',
        nuxtApiCompat: null,
        topics: null,
        keywords: null,
        release: null,
      })

      const result = calculateHealth(module)
      const n4Signal = result.signals.find((s: HealthSignal) => s.msg.includes('official module'))

      expect(n4Signal).toBeDefined()
      expect(n4Signal?.points).toBe(5)
    })

    it('gives 0 points for non-official module with 0 signals', () => {
      const module = createModule({
        type: 'community',
        nuxtApiCompat: null,
        topics: null,
        keywords: null,
        release: null,
      })

      const result = calculateHealth(module)
      const n4Signal = result.signals.find((s: HealthSignal) => s.msg.includes('Nuxt 4 not confirmed'))

      expect(n4Signal).toBeDefined()
      expect(n4Signal?.points).toBe(0)
    })
  })

  describe('stable & done exception', () => {
    it('gives 15 points for old but stable module', () => {
      const twoYearsAgo = new Date()
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

      const module = createModule({
        npm: {
          name: 'test',
          latestVersion: '1.0.0',
          lastPublish: twoYearsAgo.toISOString(),
          daysSincePublish: 730,
          peerDeps: null,
          keywords: [],
          deprecated: null,
          hasTypes: true,
          hasTests: true,
          unpackedSize: null,
          downloads: 1000,
        },
        github: {
          fullName: 'test/test',
          defaultBranch: 'main',
          stars: 100,
          forks: 10,
          openIssues: 3,
          archived: false,
          pushedAt: twoYearsAgo.toISOString(),
          topics: [],
          license: 'MIT',
        },
        pendingCommits: {
          total: 0,
          nonChore: 0,
          commits: [],
        },
        vulnerabilities: {
          count: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          vulnerabilities: [],
        },
        ciStatus: {
          hasCI: true,
          lastRunConclusion: 'success',
          lastRunDate: twoYearsAgo.toISOString(),
          workflowName: 'CI',
        },
      })

      const result = calculateHealth(module)
      const freshnessSignal = result.signals.find((s: HealthSignal) => s.msg.includes('Stable'))

      expect(freshnessSignal).toBeDefined()
      expect(freshnessSignal?.points).toBe(15)
    })

    it('gives only 5 points for old module that is NOT stable', () => {
      const twoYearsAgo = new Date()
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

      const module = createModule({
        npm: {
          name: 'test',
          latestVersion: '1.0.0',
          lastPublish: twoYearsAgo.toISOString(),
          daysSincePublish: 730,
          peerDeps: null,
          keywords: [],
          deprecated: null,
          hasTypes: false,
          hasTests: false,
          unpackedSize: null,
          downloads: 1000,
        },
        github: {
          fullName: 'test/test',
          defaultBranch: 'main',
          stars: 100,
          forks: 10,
          openIssues: 50,
          archived: false,
          pushedAt: twoYearsAgo.toISOString(),
          topics: [],
          license: null,
        },
        pendingCommits: {
          total: 10,
          nonChore: 5,
          commits: [],
        },
        vulnerabilities: {
          count: 1,
          critical: 0,
          high: 0,
          medium: 1,
          low: 0,
          vulnerabilities: [],
        },
      })

      const result = calculateHealth(module)
      const freshnessSignal = result.signals.find((s: HealthSignal) => s.msg.includes('Published') && s.msg.includes('y ago'))

      expect(freshnessSignal).toBeDefined()
      expect(freshnessSignal?.points).toBe(5)
    })
  })

  describe('pending commits with activity', () => {
    it('gives 8 points for pending commits with recent activity', () => {
      const recentDate = new Date()
      recentDate.setDate(recentDate.getDate() - 30)

      const module = createModule({
        github: {
          fullName: 'test/test',
          defaultBranch: 'main',
          stars: 100,
          forks: 10,
          openIssues: 5,
          archived: false,
          pushedAt: recentDate.toISOString(),
          topics: [],
          license: 'MIT',
        },
        pendingCommits: {
          total: 5,
          nonChore: 3,
          commits: [],
        },
      })

      const result = calculateHealth(module)
      const pendingSignal = result.signals.find((s: HealthSignal) => s.msg.includes('pending') && s.msg.includes('active'))

      expect(pendingSignal).toBeDefined()
      expect(pendingSignal?.points).toBe(8)
    })

    it('gives 0 points for pending commits on abandoned repo', () => {
      const oldDate = new Date()
      oldDate.setFullYear(oldDate.getFullYear() - 2)

      const module = createModule({
        github: {
          fullName: 'test/test',
          defaultBranch: 'main',
          stars: 100,
          forks: 10,
          openIssues: 5,
          archived: false,
          pushedAt: oldDate.toISOString(),
          topics: [],
          license: 'MIT',
        },
        pendingCommits: {
          total: 10,
          nonChore: 5,
          commits: [],
        },
      })

      const result = calculateHealth(module)
      const pendingSignal = result.signals.find((s: HealthSignal) => s.msg.includes('pending') && s.msg.includes('abandoned'))

      expect(pendingSignal).toBeDefined()
      expect(pendingSignal?.points).toBe(0)
    })
  })
})
