import { describe, it, expect, beforeAll } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import type { ModuleData } from '../../shared/types/modules'

const mockModule: ModuleData = {
  name: 'pinia',
  npmPackage: '@pinia/nuxt',
  repo: 'vuejs/pinia',
  description: 'State management',
  category: 'State',
  type: 'official',
  maintainers: ['posva'],
  nuxtApiCompat: { supports4: true, supports3: true, raw: '>=3.0.0' },
  nuxtApiStats: null,
  github: {
    fullName: 'vuejs/pinia',
    defaultBranch: 'main',
    stars: 5000,
    forks: 100,
    openIssues: 10,
    archived: false,
    pushedAt: new Date().toISOString(),
    topics: ['nuxt'],
    license: 'MIT',
  },
  topics: { hasNuxt4: true, hasNuxt3: true, hasNuxt2: false, isNuxtModule: true, all: [] },
  nuxt4Issues: null,
  release: null,
  oldestIssue: null,
  contributors: { commitsLastYear: 50, uniqueContributors: 5, contributors: ['posva'] },
  readme: null,
  ciStatus: null,
  pendingCommits: { total: 0, nonChore: 0, commits: [] },
  npm: {
    name: '@pinia/nuxt',
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
  keywords: null,
  nodeEngine: null,
  deps: null,
  moduleJson: null,
  vulnerabilities: { count: 0, critical: 0, high: 0, medium: 0, low: 0, vulnerabilities: [] },
  health: { score: 85, signals: [] },
}

describe('Badge API Integration', async () => {
  // Start actual Nuxt server before tests
  await setup({
    server: true,
    build: true,
  })

  beforeAll(async () => {
    // Seed KV with mock data via internal API
    await $fetch('/api/_test/seed', {
      method: 'POST',
      body: { modules: [mockModule] },
    }).catch(() => {
      // Seed endpoint might not exist in production build
    })
  })

  it('returns 400 without package or module param', async () => {
    try {
      await $fetch('/api/v1/badge')
      expect.fail('Should have thrown')
    }
    catch (error) {
      expect((error as { statusCode: number }).statusCode).toBe(400)
    }
  })

  it('returns shields.io schema for valid module', async () => {
    const response = await $fetch<{
      schemaVersion: number
      label: string
      message: string
      color: string
    }>('/api/v1/badge?module=pinia')

    expect(response).toMatchObject({
      schemaVersion: 1,
      label: 'nuxt.care',
    })
    expect(response.message).toBeDefined()
    expect(response.color).toBeDefined()
  })
})
