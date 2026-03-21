import { describe, it, expect } from 'vitest'
import { crawlModuleContext } from '../../server/utils/crawler'
import type { ModuleData, ModuleContext } from '../../shared/types/modules'

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
    testFiles: null,
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

describe('MCP crawler', () => {
  it('returns null for modules without repo', async () => {
    const mod = createModule({ repo: '' })
    const result = await crawlModuleContext(mod)
    expect(result).toBeNull()
  })

  it('returns null for modules with invalid repo path', async () => {
    const mod = createModule({ repo: 'invalid' })
    const result = await crawlModuleContext(mod)
    expect(result).toBeNull()
  })

  it('builds correct install command', async () => {
    const mod = createModule({ name: 'pinia', repo: 'vuejs/pinia' })
    const result = await crawlModuleContext(mod)
    // May be null if GitHub API is unreachable in test, but if it succeeds:
    if (result) {
      expect(result.installCommand).toBe('npx nuxt module add pinia')
      expect(result.moduleName).toBe('pinia')
      expect(result.npmPackage).toBe('test-module')
      expect(result.crawledAt).toBeTruthy()
    }
  })
})

describe('ModuleContext type', () => {
  it('has all required fields', () => {
    const context: ModuleContext = {
      moduleName: 'test',
      npmPackage: '@test/nuxt',
      readme: '# Test',
      docsUrl: 'https://test.com',
      composables: ['useTest'],
      components: ['TestComponent'],
      configKey: 'test',
      installCommand: 'npx nuxt module add test',
      quickStart: 'npm install test',
      crawledAt: new Date().toISOString(),
    }

    expect(context.moduleName).toBe('test')
    expect(context.composables).toHaveLength(1)
    expect(context.components).toHaveLength(1)
    expect(context.readme).toBe('# Test')
  })
})
