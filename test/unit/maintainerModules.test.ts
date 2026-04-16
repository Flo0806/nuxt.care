import { describe, it, expect } from 'vitest'
import { categorizeMaintainerModules } from '../../app/composables/useMaintainerModules'
import type { ModuleData } from '../../shared/types/modules'

function createModule(overrides: Partial<ModuleData> = {}): ModuleData {
  return {
    name: 'test-module',
    npmPackage: 'test-module',
    repo: 'test/test-module',
    description: '',
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
    health: { score: 0, signals: [] },
    ...overrides,
  }
}

function withOwner(name: string, owner: string): ModuleData {
  return createModule({
    name,
    github: {
      fullName: `${owner}/${name}`,
      defaultBranch: 'main',
      stars: 0,
      forks: 0,
      openIssues: 0,
      archived: false,
      pushedAt: new Date().toISOString(),
      topics: [],
      license: null,
    },
  })
}

function withContributors(m: ModuleData, logins: string[]): ModuleData {
  return {
    ...m,
    contributors: { commitsLastYear: 0, uniqueContributors: logins.length, contributors: logins },
  }
}

describe('categorizeMaintainerModules', () => {
  it('marks the user as owner when they own the repo', () => {
    const mod = withOwner('pinia', 'flo')
    const result = categorizeMaintainerModules([mod], 'flo')
    expect(result).toHaveLength(1)
    expect(result[0]?.role).toBe('owner')
  })

  it('marks the user as contributor when they appear in contributors but not as owner', () => {
    const mod = withContributors(withOwner('ui', 'nuxt'), ['danielroe', 'flo'])
    const result = categorizeMaintainerModules([mod], 'danielroe')
    expect(result).toHaveLength(1)
    expect(result[0]?.role).toBe('contributor')
  })

  it('prefers owner over contributor when the user is both', () => {
    const mod = withContributors(withOwner('foo', 'flo'), ['flo'])
    const result = categorizeMaintainerModules([mod], 'flo')
    expect(result).toHaveLength(1)
    expect(result[0]?.role).toBe('owner')
  })

  it('skips modules where the user has no role', () => {
    const mod = withContributors(withOwner('foo', 'someone-else'), ['other-dev'])
    const result = categorizeMaintainerModules([mod], 'flo')
    expect(result).toHaveLength(0)
  })

  it('matches usernames case-insensitively', () => {
    const mod = withOwner('bar', 'Flo')
    const result = categorizeMaintainerModules([mod], 'flo')
    expect(result[0]?.role).toBe('owner')
  })
})
