import type { SessionUser } from '~~/shared/types/auth'
import { getStoredUser } from '~~/server/utils/auth'
import { fetchGitHub } from '~~/server/utils/github'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const sessionUser = session.user as SessionUser
  const repo = getRouterParam(event, 'repo')

  // repo might contain path like "owner/repo#branch/path" - extract just "owner/repo"
  const cleanRepo = repo?.split('#')[0]

  if (!cleanRepo) {
    throw createError({ statusCode: 400, message: 'Missing repo parameter' })
  }

  const user = await getStoredUser(sessionUser.githubId)

  if (!user?.accessToken) {
    throw createError({
      statusCode: 401,
      message: 'No access token. Please re-login.',
      data: { reauth: true },
    })
  }

  // Check current star status (204 = starred, 404 = not starred)
  const checkRes = await fetchGitHub(
    `https://api.github.com/user/starred/${cleanRepo}`,
    user.accessToken,
  )
  const isStarred = checkRes.status === 204

  // Toggle: DELETE if starred, PUT if not starred
  const method = isStarred ? 'DELETE' : 'PUT'
  const toggleRes = await fetchGitHub(
    `https://api.github.com/user/starred/${cleanRepo}`,
    user.accessToken,
    { method },
  )

  if (!toggleRes.ok && toggleRes.status !== 204) {
    throw createError({
      statusCode: toggleRes.status,
      message: `GitHub API error: ${toggleRes.statusText}`,
    })
  }

  return { starred: !isStarred }
})
