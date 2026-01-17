import type { StoredUser, GitHubUser, SessionUser } from '~~/shared/types/auth'

const USER_PREFIX = 'users'

/**
 * Generate KV key for user storage
 */
export function getUserKey(githubId: number): string {
  return `${USER_PREFIX}:${githubId}`
}

/**
 * Get user from KV storage by GitHub ID
 */
export async function getStoredUser(githubId: number): Promise<StoredUser | null> {
  return await kv.get<StoredUser>(getUserKey(githubId))
}

/**
 * Create or update user in KV storage
 * Preserves createdAt on update, updates lastLoginAt
 */
export async function upsertUser(githubUser: GitHubUser): Promise<StoredUser> {
  const key = getUserKey(githubUser.id)
  const existing = await kv.get<StoredUser>(key)

  const user: StoredUser = {
    githubId: githubUser.id,
    username: githubUser.login,
    displayName: githubUser.name,
    avatarUrl: githubUser.avatar_url,
    email: githubUser.email,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  }

  await kv.set(key, user)
  return user
}

/**
 * Convert stored user to minimal session user (for cookie)
 */
export function toSessionUser(user: StoredUser): SessionUser {
  return {
    githubId: user.githubId,
    username: user.username,
    avatarUrl: user.avatarUrl,
  }
}
