// What a submission used to look like. Append-only.
//
// Deliberately NOT under the `review:` prefix. The cache lives there and gets
// discarded on a schema bump; history cannot be refetched, so it must be
// impossible for a cache operation to reach it. One key per PR, because KV
// rewrites the whole value on every write.

/** Stamped into each snapshot. Never a reason to discard one. */
export const REVIEW_HISTORY_SCHEMA_VERSION = 1

const key = (prNumber: number) => `review-history:${prNumber}`

export async function getReviewHistory(prNumber: number): Promise<ReviewHistory | null> {
  return await kv.get<ReviewHistory>(key(prNumber))
}

/** Records the state a PR is leaving behind, before the cache overwrites it. */
export async function appendReviewHistory(
  entry: ReviewEntry,
  reason: ReviewHistoryReason,
  replacedAt: string,
): Promise<void> {
  const existing = await getReviewHistory(entry.number)
  const history: ReviewHistory = existing ?? { number: entry.number, snapshots: [] }

  history.snapshots.push({
    schemaVersion: REVIEW_HISTORY_SCHEMA_VERSION,
    entry,
    replacedAt,
    reason,
  })

  await kv.set(key(entry.number), history)
}
