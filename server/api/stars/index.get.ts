import type { SessionUser } from '~~/shared/types/auth'
import { getStoredUser } from '~~/server/utils/auth'
import { fetchGitHub } from '~~/server/utils/github'

interface GitHubStarredRepo {
  full_name: string
}

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const sessionUser = session.user as SessionUser

  const user = await getStoredUser(sessionUser.githubId)

  if (!user?.accessToken) {
    throw createError({
      statusCode: 401,
      message: 'No access token. Please re-login.',
      data: { reauth: true },
    })
  }

  // Fetch all starred repos (paginated, max 100 per page - github limited)
  const allStarred: string[] = []
  let page = 1
  const perPage = 100

  while (true) {
    const res = await fetchGitHub(
      `https://api.github.com/user/starred?per_page=${perPage}&page=${page}`,
      user.accessToken,
    )

    if (!res.ok) {
      break
    }

    const repos = await res.json() as GitHubStarredRepo[]

    if (repos.length === 0) break

    for (const repo of repos) {
      allStarred.push(repo.full_name)
    }

    // If less than perPage, we've reached the end
    if (repos.length < perPage) break

    page++
  }

  return { starred: allStarred }
})
