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

  // 204 = starred, 404 = not starred (404 is valid, not an error)
  const res = await fetchGitHub(
    `https://api.github.com/user/starred/${cleanRepo}`,
    user.accessToken,
  )

  return { starred: res.status === 204 }
})
