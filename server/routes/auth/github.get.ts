import type { GitHubUser } from '~~/shared/types/auth'
import { upsertUser, toSessionUser } from '~~/server/utils/auth'

export default defineOAuthGitHubEventHandler({
  config: {
    emailRequired: false,
    scope: ['public_repo'], // Required for starring/unstarring repos
  },
  async onSuccess(event, { user: githubUser, tokens }) {
    // Store/update user in KV
    const storedUser = await upsertUser(githubUser as GitHubUser, tokens.access_token)

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
