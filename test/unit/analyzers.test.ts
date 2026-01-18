import { describe, it, expect } from 'vitest'
import { analyzeCompatString, analyzeTopics, analyzeKeywords } from '../../server/utils/analyzers'

describe('analyzeCompatString', () => {
  describe('array format (new API)', () => {
    it('detects Nuxt 4 support from [3, 4]', () => {
      const result = analyzeCompatString([3, 4])

      expect(result?.supports4).toBe(true)
      expect(result?.supports3).toBe(true)
    })

    it('detects Nuxt 3 only from [3]', () => {
      const result = analyzeCompatString([3])

      expect(result?.supports4).toBe(false)
      expect(result?.supports3).toBe(true)
    })

    it('detects Nuxt 4 only from [4]', () => {
      const result = analyzeCompatString([4])

      expect(result?.supports4).toBe(true)
      expect(result?.supports3).toBe(false)
    })
  })

  describe('semver string format (legacy)', () => {
    it('returns null for empty input', () => {
      expect(analyzeCompatString(undefined)).toBeNull()
      expect(analyzeCompatString('')).toBeNull()
    })

    it('^3.0.0 does NOT support Nuxt 4 (caret locks major)', () => {
      const result = analyzeCompatString('^3.0.0')

      expect(result?.supports4).toBe(false)
      expect(result?.supports3).toBe(true)
    })

    it('^3.x supports Nuxt 3 only', () => {
      const result = analyzeCompatString('^3.x')

      expect(result?.supports4).toBe(false)
      expect(result?.supports3).toBe(true)
    })

    it('>=3.0.0 supports Nuxt 4 (open-ended)', () => {
      const result = analyzeCompatString('>=3.0.0')

      expect(result?.supports4).toBe(true)
      expect(result?.supports3).toBe(true)
    })

    it('>=3.0.0 <4.0.0 does NOT support Nuxt 4 (explicit exclusion)', () => {
      const result = analyzeCompatString('>=3.0.0 <4.0.0')

      expect(result?.supports4).toBe(false)
      expect(result?.supports3).toBe(true)
    })

    it('>=3.0.0 <4 does NOT support Nuxt 4', () => {
      const result = analyzeCompatString('>=3.0.0 <4')

      expect(result?.supports4).toBe(false)
      expect(result?.supports3).toBe(true)
    })

    it('^4.0.0 supports Nuxt 4', () => {
      const result = analyzeCompatString('^4.0.0')

      expect(result?.supports4).toBe(true)
      expect(result?.supports3).toBe(false)
    })

    it('>=4 supports Nuxt 4', () => {
      const result = analyzeCompatString('>=4')

      expect(result?.supports4).toBe(true)
      expect(result?.supports3).toBe(false)
    })

    it('* (wildcard) supports Nuxt 4', () => {
      const result = analyzeCompatString('*')

      expect(result?.supports4).toBe(true)
      expect(result?.supports3).toBe(true)
    })
  })
})

describe('analyzeTopics', () => {
  it('returns null for empty topics', () => {
    expect(analyzeTopics(undefined)).toBeNull()
    expect(analyzeTopics([])).toBeNull()
  })

  it('detects nuxt4 topic', () => {
    const result = analyzeTopics(['nuxt4', 'vue'])

    expect(result?.hasNuxt4).toBe(true)
  })

  it('detects nuxt-4 topic (with dash)', () => {
    const result = analyzeTopics(['nuxt-4', 'typescript'])

    expect(result?.hasNuxt4).toBe(true)
  })

  it('is case insensitive', () => {
    const result = analyzeTopics(['NUXT4', 'Nuxt-Module'])

    expect(result?.hasNuxt4).toBe(true)
    expect(result?.isNuxtModule).toBe(true)
  })
})

describe('analyzeKeywords', () => {
  it('returns null for empty keywords', () => {
    expect(analyzeKeywords(undefined)).toBeNull()
    expect(analyzeKeywords([])).toBeNull()
  })

  it('detects nuxt4 keyword', () => {
    const result = analyzeKeywords(['nuxt4', 'vue'])

    expect(result?.hasNuxt4).toBe(true)
  })

  it('detects nuxt-4 keyword (with dash)', () => {
    const result = analyzeKeywords(['nuxt-4'])

    expect(result?.hasNuxt4).toBe(true)
  })
})
