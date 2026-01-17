import type { GitHubUser } from '~~/shared/types/auth'
import { upsertUser, toSessionUser } from '~~/server/utils/auth'

export default defineOAuthGitHubEventHandler({
  config: {
    emailRequired: false,
  },
  async onSuccess(event, { user: githubUser }) {
    // Store/update user in KV
    const storedUser = await upsertUser(githubUser as GitHubUser)

    // Set session
    await setUserSession(event, {
      user: toSessionUser(storedUser),
    })

    return sendRedirect(event, '/')
  },
  onError(event, error) {
    console.error('GitHub OAuth error:', error)
    return sendRedirect(event, '/?auth_error=1')
  },
})
