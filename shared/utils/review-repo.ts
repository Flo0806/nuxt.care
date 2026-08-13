// Splitting the yaml `repo` field.
//
// It carries more than a path: `atlaxt/nuxt-tawk-to#master/nuxt-tawk-to` means
// owner, repository, branch and the subdirectory the module lives in. The
// server has cleanRepoPath() for the addressable part alone; this one keeps
// the pieces, because the owner decides ownership questions and the subdir is
// what tells you where a module sits in a monorepo.

export interface RepoRef {
  /** owner/name, the part GitHub addresses. */
  path: string
  owner: string
  name: string
  branch: string | null
  subdir: string | null
  url: string
}

export function parseRepoField(repo: string | null | undefined): RepoRef | null {
  if (!repo) return null

  const [pathPart = '', rest] = repo.split('#')
  const segments = pathPart.split('/').filter(Boolean)
  const [owner, name] = segments
  if (!owner || !name) return null

  const restSegments = rest ? rest.split('/').filter(Boolean) : []
  const branch = restSegments.shift() ?? null

  return {
    path: `${owner}/${name}`,
    owner,
    name,
    branch,
    subdir: restSegments.length ? restSegments.join('/') : null,
    url: `https://github.com/${owner}/${name}`,
  }
}
