import { describe, it, expect } from 'vitest'
import { getActionHints, potentialScore, signalToActionHint } from '../../app/utils/actionHints'
import type { HealthSignal, ModuleData } from '../../shared/types/modules'

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

function signal(key: string, points: number, maxPoints: number, type: HealthSignal['type'] = 'warning'): HealthSignal {
  return { key, type, msg: key, points, maxPoints }
}

describe('signalToActionHint', () => {
  it('returns null for positive signals with no gap', () => {
    const mod = createModule()
    const result = signalToActionHint(signal('tests', 12, 12, 'positive'), mod)
    expect(result).toBeNull()
  })

  it('returns a hint for a missing test script', () => {
    const mod = createModule()
    const result = signalToActionHint(signal('tests', 0, 12, 'warning'), mod)
    expect(result).not.toBeNull()
    expect(result?.title).toBe('Add tests')
    expect(result?.gain).toBe(12)
    expect(result?.snippets?.length).toBeGreaterThan(0)
  })

  it('treats a negative penalty signal as a gap equal to |points|', () => {
    const mod = createModule()
    const archivedHint = signalToActionHint(signal('archived', -30, 0, 'negative'), mod)
    expect(archivedHint?.gain).toBe(30)

    const deprecatedHint = signalToActionHint(signal('deprecated', -50, 0, 'negative'), mod)
    expect(deprecatedHint?.gain).toBe(50)
  })
})

describe('getActionHints', () => {
  it('merges vulns-penalty gap into the security hint', () => {
    const mod = createModule({
      health: {
        score: 0,
        signals: [
          signal('security', 0, 15, 'warning'),
          signal('vulns-penalty', -40, 0, 'negative'),
          signal('tests', 0, 12, 'warning'),
        ],
      },
    })

    const hints = getActionHints(mod)
    const security = hints.find(h => h.key === 'security')
    expect(security?.gain).toBe(55)

    // vulns-penalty itself must not surface as a separate hint
    expect(hints.find(h => h.key === 'vulns-penalty')).toBeUndefined()
  })

  it('sorts hints by descending gain', () => {
    const mod = createModule({
      health: {
        score: 20,
        signals: [
          signal('tests', 0, 12, 'warning'),
          signal('license', 0, 5, 'warning'),
          signal('nuxt4', 0, 15, 'warning'),
        ],
      },
    })

    const gains = getActionHints(mod).map(h => h.gain)
    expect(gains).toEqual([...gains].sort((a, b) => b - a))
  })
})

describe('potentialScore', () => {
  it('caps at 100', () => {
    const mod = createModule({
      health: {
        score: 90,
        signals: [
          signal('tests', 0, 12, 'warning'),
          signal('license', 0, 5, 'warning'),
        ],
      },
    })
    expect(potentialScore(mod)).toBe(100)
  })

  it('returns the current score when no hints are actionable', () => {
    const mod = createModule({ health: { score: 42, signals: [] } })
    expect(potentialScore(mod)).toBe(42)
  })
})
