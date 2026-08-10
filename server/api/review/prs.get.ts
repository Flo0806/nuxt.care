// Open pull requests against nuxt/modules.
// No analysis, no caching, no KV. Only the fields of GitHubPullRequestResponse
// are passed on: GitHub inlines the full head and base repo objects, which
// blows the raw answer up to roughly 1.4 MB for 73 PRs.

import { ghFetch } from '../../utils/fetchers'

const REPO = 'nuxt/modules'
const PER_PAGE = 100
const MAX_PAGES = 5

export default defineEventHandler(async () => {
  const token = useRuntimeConfig().github?.token

  const prs: GitHubPullRequestResponse[] = []
  for (let page = 1; page <= MAX_PAGES; page++) {
    const batch = await ghFetch<GitHubPullRequestResponse[]>(
      `https://api.github.com/repos/${REPO}/pulls?state=open&per_page=${PER_PAGE}&page=${page}`,
      token,
    )
    if (!batch?.length) break
    prs.push(...batch)
    if (batch.length < PER_PAGE) break
  }

  return {
    total: prs.length,
    prs: prs.map(pick),
  }
})

function pick(pr: GitHubPullRequestResponse): GitHubPullRequestResponse {
  return {
    number: pr.number,
    title: pr.title,
    html_url: pr.html_url,
    created_at: pr.created_at,
    updated_at: pr.updated_at,
    draft: pr.draft,
    user: pr.user ? { login: pr.user.login, avatar_url: pr.user.avatar_url } : null,
    labels: (pr.labels ?? []).map(l => ({ name: l.name })),
  }
}
