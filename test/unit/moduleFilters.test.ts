import { describe, it, expect } from 'vitest'
import { matchesMaintainer, isCriticalModule, getCompatStatus, chipFilters } from '../../app/composables/useModuleFilters'
import type { ModuleData } from '../../shared/types/modules'

function createModule(overrides: Partial<ModuleData> = {}): ModuleData {
  return {
    name: 'test-module',
    npmPackage: 'test-module',
    repo: 'owner/test-module',
    description: 'Test',
    category: 'test',
    type: 'community',
    maintainers: [],
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
    health: { score: 50, signals: [] },
    ...overrides,
  }
}

describe('matchesMaintainer', () => {
  it('matches by repo owner', () => {
    const mod = createModule({ repo: 'nuxt/ui' })

    expect(matchesMaintainer(mod, 'nuxt')).toBe(true)
    expect(matchesMaintainer(mod, 'other')).toBe(false)
  })

  it('matches by maintainer name', () => {
    const mod = createModule({ maintainers: ['danielroe', 'atinux'] })

    expect(matchesMaintainer(mod, 'danielroe')).toBe(true)
    expect(matchesMaintainer(mod, 'unknown')).toBe(false)
  })

  it('returns true for "all" query', () => {
    const mod = createModule()
    expect(matchesMaintainer(mod, 'all')).toBe(true)
  })
})

describe('isCriticalModule', () => {
  it('marks modules with critical vulnerabilities as critical', () => {
    const mod = createModule({
      vulnerabilities: { count: 1, critical: 1, high: 0, medium: 0, low: 0, vulnerabilities: [] },
    })

    expect(isCriticalModule(mod)).toBe(true)
  })

  it('marks deprecated modules as critical', () => {
    const mod = createModule({
      npm: {
        name: 'test',
        latestVersion: '1.0.0',
        lastPublish: '',
        daysSincePublish: null,
        peerDeps: null,
        keywords: [],
        deprecated: 'Use something else',
        hasTypes: false,
        hasTests: false,
        unpackedSize: null,
        downloads: null,
      },
    })

    expect(isCriticalModule(mod)).toBe(true)
  })

  it('marks abandoned repos with pending commits as critical', () => {
    const twoYearsAgo = new Date()
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

    const mod = createModule({
      github: {
        fullName: 'test/test',
        defaultBranch: 'main',
        stars: 100,
        forks: 10,
        openIssues: 5,
        archived: false,
        pushedAt: twoYearsAgo.toISOString(),
        topics: [],
        license: null,
      },
      pendingCommits: { total: 5, nonChore: 3, commits: [] },
    })

    expect(isCriticalModule(mod)).toBe(true)
  })

  it('does NOT mark healthy modules as critical', () => {
    const mod = createModule({
      vulnerabilities: { count: 0, critical: 0, high: 0, medium: 0, low: 0, vulnerabilities: [] },
    })

    expect(isCriticalModule(mod)).toBe(false)
  })
})

describe('getCompatStatus', () => {
  it('returns nuxt4 when API compat supports 4', () => {
    const mod = createModule({
      nuxtApiCompat: { supports4: true, supports3: true, raw: '>=3' },
    })

    expect(getCompatStatus(mod)).toBe('nuxt4')
  })

  it('returns nuxt4 when topics include nuxt4', () => {
    const mod = createModule({
      topics: { hasNuxt4: true, hasNuxt3: true, hasNuxt2: false, isNuxtModule: true, all: [] },
    })

    expect(getCompatStatus(mod)).toBe('nuxt4')
  })

  it('returns nuxt3 when only Nuxt 3 is confirmed', () => {
    const mod = createModule({
      nuxtApiCompat: { supports4: false, supports3: true, raw: '^3' },
    })

    expect(getCompatStatus(mod)).toBe('nuxt3')
  })

  it('returns unknown when no compat info', () => {
    const mod = createModule()

    expect(getCompatStatus(mod)).toBe('unknown')
  })
})

describe('chipFilters', () => {
  function getFilter(id: string) {
    const chip = chipFilters.find(c => c.id === id)
    if (!chip) throw new Error(`Chip filter "${id}" not found`)
    return chip.filter
  }

  describe('quality filters', () => {
    it('hasTests filters modules with tests', () => {
      const filter = getFilter('hasTests')
      const withTests = createModule({ npm: { name: 't', latestVersion: '1', lastPublish: '', daysSincePublish: null, peerDeps: null, keywords: [], deprecated: null, hasTypes: false, hasTests: true, unpackedSize: null, downloads: null } })
      const noTests = createModule({ npm: { name: 't', latestVersion: '1', lastPublish: '', daysSincePublish: null, peerDeps: null, keywords: [], deprecated: null, hasTypes: false, hasTests: false, unpackedSize: null, downloads: null } })

      expect(filter(withTests)).toBe(true)
      expect(filter(noTests)).toBe(false)
    })

    it('hasTypes filters modules with TypeScript', () => {
      const filter = getFilter('hasTypes')
      const withTypes = createModule({ npm: { name: 't', latestVersion: '1', lastPublish: '', daysSincePublish: null, peerDeps: null, keywords: [], deprecated: null, hasTypes: true, hasTests: false, unpackedSize: null, downloads: null } })
      const noTypes = createModule({ npm: { name: 't', latestVersion: '1', lastPublish: '', daysSincePublish: null, peerDeps: null, keywords: [], deprecated: null, hasTypes: false, hasTests: false, unpackedSize: null, downloads: null } })

      expect(filter(withTypes)).toBe(true)
      expect(filter(noTypes)).toBe(false)
    })

    it('ciPassing filters modules with passing CI', () => {
      const filter = getFilter('ciPassing')
      const passing = createModule({ ciStatus: { hasCI: true, lastRunConclusion: 'success', lastRunDate: '', workflowName: 'CI' } })
      const failing = createModule({ ciStatus: { hasCI: true, lastRunConclusion: 'failure', lastRunDate: '', workflowName: 'CI' } })

      expect(filter(passing)).toBe(true)
      expect(filter(failing)).toBe(false)
    })

    it('noVulns filters modules without vulnerabilities', () => {
      const filter = getFilter('noVulns')
      const safe = createModule({ vulnerabilities: { count: 0, critical: 0, high: 0, medium: 0, low: 0, vulnerabilities: [] } })
      const unsafe = createModule({ vulnerabilities: { count: 2, critical: 0, high: 1, medium: 1, low: 0, vulnerabilities: [] } })

      expect(filter(safe)).toBe(true)
      expect(filter(unsafe)).toBe(false)
    })
  })

  describe('score filters', () => {
    it('score70 filters modules with score >= 70', () => {
      const filter = getFilter('score70')
      const high = createModule({ health: { score: 85, signals: [] } })
      const low = createModule({ health: { score: 50, signals: [] } })

      expect(filter(high)).toBe(true)
      expect(filter(low)).toBe(false)
    })

    it('scoreLow filters modules with score < 50', () => {
      const filter = getFilter('scoreLow')
      const low = createModule({ health: { score: 30, signals: [] } })
      const ok = createModule({ health: { score: 60, signals: [] } })

      expect(filter(low)).toBe(true)
      expect(filter(ok)).toBe(false)
    })
  })

  describe('popularity filters', () => {
    it('stars1k filters modules with 1000+ stars', () => {
      const filter = getFilter('stars1k')
      const popular = createModule({ github: { fullName: 't/t', defaultBranch: 'main', stars: 5000, forks: 0, openIssues: 0, archived: false, pushedAt: '', topics: [], license: null } })
      const unpopular = createModule({ github: { fullName: 't/t', defaultBranch: 'main', stars: 500, forks: 0, openIssues: 0, archived: false, pushedAt: '', topics: [], license: null } })

      expect(filter(popular)).toBe(true)
      expect(filter(unpopular)).toBe(false)
    })

    it('dl10k filters modules with 10000+ weekly downloads', () => {
      const filter = getFilter('dl10k')
      const popular = createModule({ npm: { name: 't', latestVersion: '1', lastPublish: '', daysSincePublish: null, peerDeps: null, keywords: [], deprecated: null, hasTypes: false, hasTests: false, unpackedSize: null, downloads: 50000 } })
      const unpopular = createModule({ npm: { name: 't', latestVersion: '1', lastPublish: '', daysSincePublish: null, peerDeps: null, keywords: [], deprecated: null, hasTypes: false, hasTests: false, unpackedSize: null, downloads: 5000 } })

      expect(filter(popular)).toBe(true)
      expect(filter(unpopular)).toBe(false)
    })
  })
})
