// The npm side of a submission.
//
// Reuses extractVersionInfo() from fetchers.ts, which reads `deprecated` off
// the latest version - the place npm actually stores it. Only the request
// itself is written here, because a review has to tell "package does not
// exist" apart from "the request failed", and the shared fetchers return null
// for both.

import { extractVersionInfo } from './fetchers'

/** https://docs.npmjs.com/package-name-guidelines */
const PACKAGE_NAME = /^(@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/

export function emptyReviewNpm(status: ReviewNpmStatus, raw: string | null, fetchedAt: string): ReviewNpm {
  return {
    status,
    raw,
    latestVersion: null,
    lastPublish: null,
    daysSincePublish: null,
    deprecated: null,
    releaseCount: 0,
    maintainers: [],
    nuxtRange: null,
    hasTypes: false,
    hasTests: false,
    fetchedAt,
  }
}

/** Reads the `npm` field of a submitted yaml and looks the package up. */
export async function fetchReviewNpm(yaml: Record<string, unknown> | null, fetchedAt: string): Promise<ReviewNpm> {
  const raw = typeof yaml?.npm === 'string' && yaml.npm.trim() ? yaml.npm.trim() : null

  if (!raw) return emptyReviewNpm('no_package', null, fetchedAt)
  // Catches entries that hold a npmjs.com URL instead of a package name.
  if (!PACKAGE_NAME.test(raw)) return emptyReviewNpm('invalid_name', raw, fetchedAt)

  const doc = await fetchPackument(raw)
  if (doc.status !== 'ok') return emptyReviewNpm(doc.status, raw, fetchedAt)

  const latest = doc.packument['dist-tags']?.latest ?? null
  const version = latest ? extractVersionInfo(doc.packument, latest) : null

  return {
    status: 'ok',
    raw,
    latestVersion: latest,
    lastPublish: version?.publishedAt ?? null,
    daysSincePublish: version?.daysSincePublish ?? null,
    deprecated: version?.deprecated ?? null,
    releaseCount: Object.keys(doc.packument.versions ?? {}).length,
    maintainers: (doc.packument.maintainers ?? []).map(m => m.name).filter((n): n is string => !!n),
    nuxtRange: version?.peerDeps?.nuxt ?? null,
    hasTypes: version?.hasTypes ?? false,
    hasTests: version?.hasTests ?? false,
    fetchedAt,
  }
}

type PackumentResult
  = | { status: 'ok', packument: NpmPackument }
    | { status: 'not_found' }
    | { status: 'error' }

async function fetchPackument(pkg: string): Promise<PackumentResult> {
  try {
    const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(pkg)}`)
    if (res.status === 404) return { status: 'not_found' }
    if (!res.ok) return { status: 'error' }
    return { status: 'ok', packument: await res.json() as NpmPackument }
  }
  catch {
    return { status: 'error' }
  }
}
