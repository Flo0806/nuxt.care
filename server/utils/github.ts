/**
 * Fetch wrapper for GitHub API calls
 * Handles token expiration/revocation with specific error
 */
export async function fetchGitHub(
  url: string,
  token: string,
  options?: RequestInit,
): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      ...options?.headers,
    },
  })

  // Token invalid/revoked - user needs to re-authenticate
  if (res.status === 401) {
    throw createError({
      statusCode: 401,
      message: 'GitHub token invalid. Please re-login.',
      data: { reauth: true },
    })
  }

  return res
}
