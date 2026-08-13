// Does the person submitting the module actually own it?
//
// Pure derivation, no request: the PR author comes from GitHub, the repository
// owner from the yaml `repo` field, the npm maintainers from the package we
// already looked up.
//
// Null means unknown, never "no". A package we could not read tells us nothing
// about who maintains it, and saying "not the maintainer" there would be an
// accusation we cannot back.

import type { ReviewEntry, ReviewOwnership } from '../types/review'
import { parseRepoField } from './review-repo'

export function deriveOwnership(entry: ReviewEntry): ReviewOwnership {
  const author = entry.author
  const repoOwner = parseRepoField(
    typeof entry.yaml?.repo === 'string' ? entry.yaml.repo : null,
  )?.owner ?? null

  const npmMaintainers = entry.npm?.status === 'ok' ? entry.npm.maintainers : []

  const same = (a: string | null, b: string) => a?.toLowerCase() === b.toLowerCase()

  const authorIsRepoOwner = repoOwner ? same(repoOwner, author) : null
  const authorIsNpmMaintainer = npmMaintainers.length
    ? npmMaintainers.some(maintainer => same(maintainer, author))
    : null

  return {
    prAuthor: author,
    repoOwner,
    npmMaintainers,
    authorIsRepoOwner,
    authorIsNpmMaintainer,
    unrelated: authorIsRepoOwner === false && authorIsNpmMaintainer === false,
  }
}
