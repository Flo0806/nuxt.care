// Past states of a submission, loaded when a detail is opened.
//
// The list itself cannot carry this: reading a history key per pull request
// would be 74 reads for a page that shows one of them. So it is fetched on
// demand and kept in a cache that lives as long as the page, which makes going
// back and forth between submissions free after the first look. A reload
// empties it, and refilling costs one KV read per submission actually opened.
//
// Module scope means one map per JavaScript context. On the server that would
// be one map for every request and every visitor, so nothing here may run
// while rendering.

const cache = new Map<number, ReviewHistorySnapshot[]>()

export function useReviewHistory() {
  const snapshots = ref<ReviewHistorySnapshot[]>([])
  const pending = ref(false)
  const failed = ref(false)

  async function load(prNumber: number) {
    // Guards the shared map against ever being filled during rendering.
    if (import.meta.server) return

    const known = cache.get(prNumber)
    if (known) {
      snapshots.value = known
      failed.value = false
      return
    }

    snapshots.value = []
    pending.value = true
    failed.value = false
    try {
      const data = await $fetch(`/api/review/prs/${prNumber}/history`)
      cache.set(prNumber, data.snapshots)
      snapshots.value = data.snapshots
    }
    catch {
      failed.value = true
    }
    finally {
      pending.value = false
    }
  }

  return { snapshots, pending, failed, load }
}

/** What a recorded change was about. */
export function reviewHistoryLabel(reason: ReviewHistoryReason): string {
  switch (reason) {
    case 'updated':
      return 'pull request changed'
    case 'npm-changed':
      return 'npm release or deprecation changed'
    case 'closed':
      return 'left the open list'
  }
}
