// @vitest-environment nuxt
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { defineEventHandler, getRouterParam, createError } from 'h3'
import type { ModuleData } from '~~/shared/types/modules'
import type { EventHandler } from 'h3'

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

const goodModule = createModule({
  name: 'nuxt-icon',
  npmPackage: 'nuxt-icon',
  type: 'official',
  npm: {
    name: 'nuxt-icon',
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
    fullName: 'nuxt/icon',
    defaultBranch: 'main',
    stars: 5000,
    forks: 100,
    openIssues: 5,
    archived: false,
    pushedAt: new Date().toISOString(),
    topics: ['nuxt4'],
    license: 'MIT',
  },
  vulnerabilities: { count: 0, critical: 0, high: 0, medium: 0, low: 0, vulnerabilities: [] },
  pendingCommits: { total: 0, nonChore: 0, commits: [] },
  topics: { hasNuxt4: true, hasNuxt3: true, hasNuxt2: false, isNuxtModule: true, all: ['nuxt4'] },
  nuxtApiCompat: { supports4: true, supports3: true, raw: '>=3.0.0' },
})

// Medium module - score 60-79 range
const mediumModule = createModule({
  name: 'medium-module',
  npmPackage: 'medium-module',
  type: 'community',
  npm: {
    name: 'medium-module',
    latestVersion: '1.0.0',
    lastPublish: new Date().toISOString(),
    daysSincePublish: 30,
    peerDeps: null,
    keywords: [],
    deprecated: null,
    hasTypes: true,
    hasTests: false,
    unpackedSize: null,
    downloads: 1000,
  },
  github: {
    fullName: 'test/medium',
    defaultBranch: 'main',
    stars: 100,
    forks: 10,
    openIssues: 5,
    archived: false,
    pushedAt: new Date().toISOString(),
    topics: [],
    license: 'MIT',
  },
  vulnerabilities: { count: 0, critical: 0, high: 0, medium: 0, low: 0, vulnerabilities: [] },
  pendingCommits: { total: 2, nonChore: 1, commits: [] },
})

const badModule = createModule({
  name: 'bad-module',
  npmPackage: 'bad-module',
  npm: {
    name: 'bad-module',
    latestVersion: '0.1.0',
    lastPublish: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(),
    daysSincePublish: 400,
    peerDeps: null,
    keywords: [],
    deprecated: 'Do not use',
    hasTypes: false,
    hasTests: false,
    unpackedSize: null,
    downloads: 10,
  },
})

const mockModules = [goodModule, mediumModule, badModule]

describe('GET /api/badge/[module]', () => {
  let badgeHandler: EventHandler

  beforeAll(async () => {
    // Stub Nitro globals before dynamic import
    vi.stubGlobal('defineEventHandler', defineEventHandler)
    vi.stubGlobal('getRouterParam', getRouterParam)
    vi.stubGlobal('createError', createError)
    vi.stubGlobal('kv', {
      get: vi.fn().mockResolvedValue(mockModules),
    })

    // Dynamic import after stubs
    const module = await import('~~/server/api/badge/[module].get')
    badgeHandler = module.default
  })

  it('returns shields.io schema for existing module', async () => {
    const event = { context: { params: { module: 'nuxt-icon' } } }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await badgeHandler(event as any)

    expect(response.schemaVersion).toBe(1)
    expect(response.label).toBe('nuxt.care')
    expect(response.message).toMatch(/^\d+\/100$/)
  })

  it('returns correct color for high-score module', async () => {
    const event = { context: { params: { module: 'nuxt-icon' } } }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await badgeHandler(event as any)

    expect(['brightgreen', 'green']).toContain(response.color)
  })

  it('returns green for medium-score module (60-79)', async () => {
    const event = { context: { params: { module: 'medium-module' } } }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await badgeHandler(event as any)

    expect(response.color).toBe('green')
  })

  it('returns red for deprecated module', async () => {
    const event = { context: { params: { module: 'bad-module' } } }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await badgeHandler(event as any)

    expect(response.color).toBe('red')
  })

  it('throws for non-existent module', async () => {
    const event = { context: { params: { module: 'non-existent' } } }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect(badgeHandler(event as any)).rejects.toThrow()
  })
})
