import { describe, it, expect } from 'vitest'
import { getUserKey, toSessionUser } from '../../server/utils/auth'
import type { StoredUser } from '../../shared/types/auth'

describe('getUserKey', () => {
  it('generates correct KV key format', () => {
    expect(getUserKey(12345)).toBe('users:12345')
  })

  it('handles large GitHub IDs', () => {
    expect(getUserKey(123456789)).toBe('users:123456789')
  })
})

describe('toSessionUser', () => {
  it('extracts only session-relevant fields', () => {
    const storedUser: StoredUser = {
      githubId: 12345,
      username: 'testuser',
      displayName: 'Test User',
      avatarUrl: 'https://example.com/avatar.png',
      email: 'test@example.com',
      createdAt: '2024-01-01T00:00:00Z',
      lastLoginAt: '2024-06-01T00:00:00Z',
      accessToken: 'secret-token',
    }

    const sessionUser = toSessionUser(storedUser)

    expect(sessionUser).toEqual({
      githubId: 12345,
      username: 'testuser',
      avatarUrl: 'https://example.com/avatar.png',
    })

    // Ensure sensitive data is NOT included
    expect(sessionUser).not.toHaveProperty('accessToken')
    expect(sessionUser).not.toHaveProperty('email')
    expect(sessionUser).not.toHaveProperty('createdAt')
  })
})
