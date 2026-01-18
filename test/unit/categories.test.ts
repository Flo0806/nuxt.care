import { describe, it, expect } from 'vitest'
import { getCategoryConfig, isKnownCategory, buildCategoryOptions } from '../../app/composables/useCategories'

describe('getCategoryConfig', () => {
  it('returns config for known category', () => {
    const config = getCategoryConfig('UI')

    expect(config.label).toBe('UI')
    expect(config.icon).toBe('i-lucide-layout')
    expect(config.color).toBe('indigo')
  })

  it('returns fallback for unknown category with category name as label', () => {
    const config = getCategoryConfig('SomeNewCategory')

    expect(config.label).toBe('SomeNewCategory')
    expect(config.icon).toBe('i-lucide-box')
    expect(config.color).toBe('neutral')
  })
})

describe('isKnownCategory', () => {
  it('returns true for known categories', () => {
    expect(isKnownCategory('UI')).toBe(true)
    expect(isKnownCategory('SEO')).toBe(true)
  })

  it('returns false for unknown categories', () => {
    expect(isKnownCategory('Unknown')).toBe(false)
  })
})

describe('buildCategoryOptions', () => {
  it('builds options with "All Categories" by default', () => {
    const options = buildCategoryOptions(['UI', 'SEO'])

    expect(options[0]).toEqual({
      label: 'All Categories',
      value: 'all',
      icon: 'i-lucide-layers',
    })
    expect(options.length).toBe(3)
  })

  it('excludes "All Categories" when includeAll is false', () => {
    const options = buildCategoryOptions(['UI', 'SEO'], false)

    expect(options.length).toBe(2)
    expect(options[0].value).not.toBe('all')
  })

  it('deduplicates and sorts categories', () => {
    const options = buildCategoryOptions(['UI', 'SEO', 'UI', 'Analytics'], false)

    expect(options.length).toBe(3)
    expect(options.map(o => o.value)).toEqual(['Analytics', 'SEO', 'UI'])
  })
})
