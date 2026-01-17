/**
 * Auth types for GitHub OAuth and user management
 */

/**
 * User data returned from GitHub OAuth
 */
export interface GitHubUser {
  id: number
  login: string
  name: string | null
  avatar_url: string
  email: string | null
}

/**
 * User stored in KV storage
 */
export interface StoredUser {
  githubId: number
  username: string
  displayName: string | null
  avatarUrl: string
  email: string | null
  createdAt: string
  lastLoginAt: string
  accessToken?: string
}

/**
 * Minimal user data stored in session cookie
 */
export interface SessionUser {
  githubId: number
  username: string
  avatarUrl: string
}
