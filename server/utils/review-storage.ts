// KV access for "modules in review".
//
// Everything lives under the `review:` prefix and is fully separated from the
// registry cache - no function in here reads or writes `modules:*`, `history:*`
// or `context:*`. Wiping the review cache can never affect the module list.

import { scoreToStatus } from './health'

/** Bumped whenever the stored shape changes, so a run discards stale entries. */
export const REVIEW_SCHEMA_VERSION = 1

const KEY_META = 'review:meta'
const KEY_ALL = 'review:all'

/** How long a run may take before it counts as crashed. */
export const REVIEW_STALE_LOCK_MS = 30 * 60 * 1000 // 30 min

/** Minimum gap between two runs. PRs do not change by the minute. */
export const REVIEW_INTERVAL_MS = 60 * 60 * 1000 // 1 h

export function emptyReviewMeta(): ReviewSyncMeta {
  return {
    schemaVersion: REVIEW_SCHEMA_VERSION,
    lastSync: null,
    isRunning: false,
    startedAt: null,
    totalPrs: 0,
    analysedPrs: 0,
    duration: null,
    error: null,
    apiCalls: null,
  }
}

export async function getReviewMeta(): Promise<ReviewSyncMeta> {
  const meta = await kv.get<ReviewSyncMeta>(KEY_META)
  return meta ?? emptyReviewMeta()
}

export async function setReviewMeta(meta: ReviewSyncMeta): Promise<void> {
  await kv.set(KEY_META, meta)
}

export async function patchReviewMeta(patch: Partial<ReviewSyncMeta>): Promise<ReviewSyncMeta> {
  const meta = { ...(await getReviewMeta()), ...patch }
  await setReviewMeta(meta)
  return meta
}

/**
 * All analysed PRs. Returns an empty array when the cache was written by an
 * older schema, so a stale shape never reaches the UI.
 */
export async function getReviewModules(): Promise<ReviewModule[]> {
  const meta = await kv.get<ReviewSyncMeta>(KEY_META)
  if (meta && meta.schemaVersion !== REVIEW_SCHEMA_VERSION) return []
  return (await kv.get<ReviewModule[]>(KEY_ALL)) ?? []
}

export async function setReviewModules(modules: ReviewModule[]): Promise<void> {
  await kv.set(KEY_ALL, modules)
}

export async function getReviewModule(prNumber: number): Promise<ReviewModule | null> {
  const all = await getReviewModules()
  return all.find(m => m.id === prNumber) ?? null
}

/** Replaces a single entry in place - used when re-analysing one PR on demand. */
export async function upsertReviewModule(mod: ReviewModule): Promise<void> {
  const all = await getReviewModules()
  const idx = all.findIndex(m => m.id === mod.id)
  if (idx === -1) all.push(mod)
  else all[idx] = mod
  await setReviewModules(all)
}

/** Drops the review cache. Registry data is untouched by design. */
export async function clearReviewCache(): Promise<void> {
  await kv.remove(KEY_ALL)
  await kv.remove(KEY_META)
}

export function toReviewSlim(mod: ReviewModule): ReviewModuleSlim {
  return {
    id: mod.id,
    prNumber: mod.pr.number,
    prTitle: mod.pr.title,
    prUrl: mod.pr.url,
    author: mod.pr.author,
    authorAvatar: mod.pr.authorAvatar,
    ageDays: mod.pr.ageDays,
    kind: mod.submission.kind,
    name: mod.submission.name,
    npmPackage: mod.submission.npmPackage,
    score: mod.analysis?.health.score ?? null,
    status: scoreToStatus(mod.analysis?.health.score ?? 0),
    bucket: mod.verdict.bucket,
    reason: mod.verdict.reason,
    blockerCount: mod.verdict.blockers.length,
    warningCount: mod.verdict.warnings.length,
    waitingOn: mod.pr.conversation.waitingOn,
  }
}
