// KV access for "modules in review".
//
// Everything lives under the `review:` prefix and is fully separated from the
// registry cache - no function in here reads or writes `modules:*`, `history:*`
// or `context:*`. Wiping the review cache can never affect the module list.

/**
 * Bumped whenever the stored shape changes, so a run discards stale entries.
 * 2: ReviewEntry replaced the earlier ReviewModule shape.
 * 3: added headSha, npm and ci. Without headSha the CI pass cannot run.
 * 4: conversation, and lastAuthorActivity now ignores commits by others.
 */
export const REVIEW_SCHEMA_VERSION = 4

const KEY_META = 'review:meta'
const KEY_ALL = 'review:all'

/** How long a run may take before it counts as crashed. */
export const REVIEW_STALE_LOCK_MS = 30 * 60 * 1000 // 30 min

/** Minimum gap between two runs. PRs do not change by the minute. */
export const REVIEW_INTERVAL_MS = 60 * 60 * 1000 // 1 h

export function emptyReviewMeta(): ReviewSyncMeta {
  return {
    schemaVersion: REVIEW_SCHEMA_VERSION,
    lastRun: null,
    isRunning: false,
    startedAt: null,
    totalPrs: 0,
    changedPrs: 0,
    apiCalls: 0,
    duration: null,
    error: null,
  }
}

/** Falls back to a fresh meta when the stored one predates the current shape. */
export async function getReviewMeta(): Promise<ReviewSyncMeta> {
  const meta = await kv.get<ReviewSyncMeta>(KEY_META)
  if (!meta || meta.schemaVersion !== REVIEW_SCHEMA_VERSION) return emptyReviewMeta()
  return meta
}

export async function setReviewMeta(meta: ReviewSyncMeta): Promise<void> {
  await kv.set(KEY_META, meta)
}

export async function patchReviewMeta(patch: Partial<ReviewSyncMeta>): Promise<ReviewSyncMeta> {
  const meta = { ...(await getReviewMeta()), ...patch }
  await setReviewMeta(meta)
  return meta
}

/** The entries carry their own version, so the check cannot depend on meta. */
interface ReviewCache {
  schemaVersion: number
  entries: ReviewEntry[]
}

/**
 * All cached PRs. Returns an empty array when the cache was written by an
 * older schema, so a stale shape never reaches the UI.
 *
 * Discarding is safe here because this is a cache: a run rebuilds it from
 * GitHub. History must never be stored under this key for that reason.
 */
export async function getReviewEntries(): Promise<ReviewEntry[]> {
  const cache = await kv.get<ReviewCache>(KEY_ALL)
  if (cache?.schemaVersion !== REVIEW_SCHEMA_VERSION) return []
  return cache.entries ?? []
}

export async function setReviewEntries(entries: ReviewEntry[]): Promise<void> {
  await kv.set(KEY_ALL, { schemaVersion: REVIEW_SCHEMA_VERSION, entries } satisfies ReviewCache)
}

export async function getReviewEntry(prNumber: number): Promise<ReviewEntry | null> {
  const all = await getReviewEntries()
  return all.find(e => e.number === prNumber) ?? null
}

/**
 * Replaces one entry, leaving the rest untouched.
 *
 * KV rewrites the whole value, so this reads and writes the full array. Only
 * safe while no run is in progress, which the caller has to make sure of.
 */
export async function upsertReviewEntry(entry: ReviewEntry): Promise<void> {
  const all = await getReviewEntries()
  const index = all.findIndex(candidate => candidate.number === entry.number)

  if (index === -1) all.push(entry)
  else all[index] = entry

  await setReviewEntries(all)
}

/** Drops the review cache. Registry data is untouched by design. */
export async function clearReviewCache(): Promise<void> {
  await kv.remove(KEY_ALL)
  await kv.remove(KEY_META)
}
