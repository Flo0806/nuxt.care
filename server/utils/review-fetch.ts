// Reading open pull requests and the module yaml they submit.
//
// Pure fetching, no KV and no scoring. Used by the cache run and by the
// single-PR route, so both see exactly the same result.

import { load } from 'js-yaml'
import { ghFetch } from './fetchers'

export const REVIEW_REPO = 'nuxt/modules'

const PER_PAGE = 100
const MAX_PAGES = 5

// readModules() in nuxt/modules globs `modules/*.yml`. A file that does not
// match exactly has no effect at all, no matter how good the module is.
const MODULE_PATH = /^modules\/[^/]+\.yml$/

export interface PrSubmission {
  candidate: ReviewCandidate | null
  otherFiles: string[]
  yaml: Record<string, unknown> | null
  yamlError: string | null
}

/** All open PRs. Returns null when GitHub could not be reached. */
export async function fetchOpenPullRequests(token?: string): Promise<GitHubPullRequestResponse[] | null> {
  const prs: GitHubPullRequestResponse[] = []

  for (let page = 1; page <= MAX_PAGES; page++) {
    const batch = await ghFetch<GitHubPullRequestResponse[]>(
      `https://api.github.com/repos/${REVIEW_REPO}/pulls?state=open&per_page=${PER_PAGE}&page=${page}`,
      token,
    )
    if (!batch) return page === 1 ? null : prs
    if (!batch.length) break
    prs.push(...batch)
    if (batch.length < PER_PAGE) break
  }

  return prs
}

/**
 * A single pull request. The response is a superset of what the list gives,
 * so the same type fits.
 */
export async function fetchPullRequest(prNumber: number, token?: string): Promise<GitHubPullRequestResponse | null> {
  return await ghFetch<GitHubPullRequestResponse>(
    `https://api.github.com/repos/${REVIEW_REPO}/pulls/${prNumber}`,
    token,
  )
}

/**
 * The module file a PR submits, plus its parsed yaml.
 * Returns null when the files could not be read, so a transient GitHub error
 * is distinguishable from a PR that touches no module file at all.
 */
export async function fetchSubmission(prNumber: number, token?: string): Promise<PrSubmission | null> {
  const files = await ghFetch<GitHubPullRequestFileResponse[]>(
    `https://api.github.com/repos/${REVIEW_REPO}/pulls/${prNumber}/files?per_page=100`,
    token,
  )
  if (!files) return null

  const candidates = files.filter(isCandidate)
  const file = candidates.find(f => f.status === 'added') ?? candidates[0] ?? null
  const otherFiles = files.filter(f => f !== file).map(f => f.filename)

  if (!file) {
    return { candidate: null, otherFiles, yaml: null, yamlError: null }
  }

  let source: 'patch' | 'blob'
  let text: string | null
  if (file.status === 'added' && file.patch) {
    source = 'patch'
    text = yamlFromPatch(file.patch)
  }
  else {
    // A modified file only carries its changed hunks, so read the full blob.
    source = 'blob'
    const blob = await ghFetch<GitHubContentResponse>(file.contents_url, token)
    text = blob?.content ? Buffer.from(blob.content, 'base64').toString('utf8') : null
  }

  const candidate: ReviewCandidate = {
    filename: file.filename,
    status: file.status,
    isModulePath: MODULE_PATH.test(file.filename),
    source,
  }

  return { candidate, otherFiles, ...parseYaml(text) }
}

/** How many GitHub calls `fetchSubmission` needed for this result. */
export function submissionCallCount(submission: PrSubmission): number {
  return submission.candidate?.source === 'blob' ? 2 : 1
}

export function toReviewEntry(
  pr: GitHubPullRequestResponse,
  submission: PrSubmission,
  fetchedAt: string,
): ReviewEntry {
  return {
    number: pr.number,
    title: pr.title,
    url: pr.html_url,
    author: pr.user?.login ?? 'unknown',
    authorAvatar: pr.user?.avatar_url ?? null,
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    draft: pr.draft,
    labels: (pr.labels ?? []).map(l => l.name),
    headSha: pr.head?.sha ?? null,
    candidate: submission.candidate,
    otherFiles: submission.otherFiles,
    yaml: submission.yaml,
    yamlError: submission.yamlError,
    // Filled by the later passes of the run, which have their own schedules.
    npm: null,
    ci: null,
    conversation: null,
    fetchedAt,
  }
}

/**
 * Loose match on purpose: a file that misses the `.yml` extension or sits in
 * the repo root is still the module the author meant to submit. Whether it
 * actually counts is decided by `isModulePath`, not here.
 */
function isCandidate(file: GitHubPullRequestFileResponse): boolean {
  if (file.status === 'removed') return false
  if (file.filename.startsWith('modules/')) return true
  return file.filename.endsWith('.yml') && !file.filename.includes('/')
}

/** Rebuilds the file content from an added file's diff hunks. */
function yamlFromPatch(patch: string): string {
  return patch
    .split('\n')
    .filter(line => line.startsWith('+') && !line.startsWith('+++'))
    .map(line => line.slice(1))
    .join('\n')
}

function parseYaml(text: string | null): { yaml: Record<string, unknown> | null, yamlError: string | null } {
  if (text === null) return { yaml: null, yamlError: 'Could not read the file content' }

  let parsed: unknown
  try {
    parsed = load(text)
  }
  catch (err) {
    return { yaml: null, yamlError: err instanceof Error ? err.message : String(err) }
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { yaml: null, yamlError: 'Not a yaml mapping' }
  }
  return { yaml: parsed as Record<string, unknown>, yamlError: null }
}
