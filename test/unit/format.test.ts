import { describe, it, expect } from 'vitest'
import { formatNumber, formatBytes } from '../../app/utils/format'

describe('formatNumber', () => {
  it('returns "-" for null', () => {
    expect(formatNumber(null)).toBe('-')
  })

  it('returns "-" for undefined', () => {
    expect(formatNumber(undefined)).toBe('-')
  })

  it('returns raw number for values < 1000', () => {
    expect(formatNumber(999)).toBe('999')
    expect(formatNumber(0)).toBe('0')
    expect(formatNumber(42)).toBe('42')
  })

  it('formats thousands as K', () => {
    expect(formatNumber(1000)).toBe('1K')
    expect(formatNumber(5000)).toBe('5K')
    expect(formatNumber(999999)).toBe('1000K')
  })

  it('formats millions as M', () => {
    expect(formatNumber(1000000)).toBe('1.0M')
    expect(formatNumber(2500000)).toBe('2.5M')
    expect(formatNumber(10000000)).toBe('10.0M')
  })
})

describe('formatBytes', () => {
  it('formats bytes under 1KB', () => {
    expect(formatBytes(500)).toBe('500 B')
    expect(formatBytes(1023)).toBe('1023 B')
  })

  it('formats kilobytes', () => {
    expect(formatBytes(1024)).toBe('1.0 KB')
    expect(formatBytes(5120)).toBe('5.0 KB')
    expect(formatBytes(1536)).toBe('1.5 KB')
  })

  it('formats megabytes', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB')
    expect(formatBytes(2.5 * 1024 * 1024)).toBe('2.5 MB')
  })
})
