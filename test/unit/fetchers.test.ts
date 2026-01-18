import { describe, it, expect } from 'vitest'
import { daysSince, cleanRepoPath } from '../../server/utils/fetchers'

describe('daysSince', () => {
  it('returns 0 for today', () => {
    const today = new Date().toISOString()
    expect(daysSince(today)).toBe(0)
  })

  it('returns correct days for past date', () => {
    const tenDaysAgo = new Date()
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)

    expect(daysSince(tenDaysAgo.toISOString())).toBe(10)
  })

  it('returns correct days for one year ago', () => {
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    const result = daysSince(oneYearAgo.toISOString())
    // Allow 1 day tolerance for leap years
    expect(result).toBeGreaterThanOrEqual(364)
    expect(result).toBeLessThanOrEqual(366)
  })
})

describe('cleanRepoPath', () => {
  it('returns null for empty input', () => {
    expect(cleanRepoPath('')).toBeNull()
  })

  it('extracts owner/repo from simple path', () => {
    expect(cleanRepoPath('nuxt/nuxt')).toBe('nuxt/nuxt')
  })

  it('removes hash fragment', () => {
    expect(cleanRepoPath('nuxt/ui#main')).toBe('nuxt/ui')
  })

  it('removes extra path segments', () => {
    expect(cleanRepoPath('nuxt/modules/some-module')).toBe('nuxt/modules')
  })

  it('returns null for invalid path (single segment)', () => {
    expect(cleanRepoPath('nuxt')).toBeNull()
  })

  it('handles complex paths with hash and extra segments', () => {
    expect(cleanRepoPath('owner/repo/extra/path#branch')).toBe('owner/repo')
  })
})
