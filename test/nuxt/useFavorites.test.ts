import { describe, it, expect, beforeEach } from 'vitest'
import { useFavorites } from '../../app/composables/useFavorites'

describe('useFavorites', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts with empty favorites', () => {
    const { favorites } = useFavorites()
    expect(favorites.value).toEqual([])
  })

  it('toggleFavorite adds module to favorites', () => {
    const { favorites, toggleFavorite } = useFavorites()

    toggleFavorite('nuxt-ui')

    expect(favorites.value).toContain('nuxt-ui')
  })

  it('toggleFavorite removes module if already favorited', () => {
    const { favorites, toggleFavorite } = useFavorites()

    toggleFavorite('nuxt-ui')
    toggleFavorite('nuxt-ui')

    expect(favorites.value).not.toContain('nuxt-ui')
  })

  it('isFavorite returns correct status', () => {
    const { toggleFavorite, isFavorite } = useFavorites()

    expect(isFavorite('nuxt-ui')).toBe(false)

    toggleFavorite('nuxt-ui')

    expect(isFavorite('nuxt-ui')).toBe(true)
  })

  it('persists favorites to localStorage', () => {
    const { toggleFavorite } = useFavorites()

    toggleFavorite('nuxt-ui')
    toggleFavorite('pinia')

    const stored = localStorage.getItem('nuxt.care:favorites')
    expect(stored).toBe('["nuxt-ui","pinia"]')
  })
})
