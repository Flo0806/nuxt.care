// Individual checks of a submission, loaded when a detail is opened.
//
// Third layer of the same cache: this map spares repeated clicks in one tab,
// the KV key behind the endpoint spares every other visitor, and only a real
// miss reaches GitHub. Keyed by commit, so a push shows fresh results.
//
// Module scope means one map per JavaScript context. On the server that would
// be one map for every request and every visitor, so nothing here may run
// while rendering.

const cache = new Map<string, ReviewChecks | null>()

export function useReviewChecks() {
  const checks = ref<ReviewChecks | null>(null)
  const pending = ref(false)
  const failed = ref(false)

  async function load(prNumber: number, headSha: string | null) {
    if (import.meta.server || !headSha) return

    const known = cache.get(headSha)
    if (known !== undefined) {
      checks.value = known
      failed.value = false
      return
    }

    checks.value = null
    pending.value = true
    failed.value = false
    try {
      const data = await $fetch(`/api/review/prs/${prNumber}/checks`)
      cache.set(headSha, data.checks)
      checks.value = data.checks
    }
    catch {
      failed.value = true
    }
    finally {
      pending.value = false
    }
  }

  return { checks, pending, failed, load }
}

/** Colour for a single run, from its own conclusion rather than the total. */
export function reviewRunTone(run: ReviewCheckRun): string {
  if (run.status !== 'completed') return 'text-neutral-400'
  switch (run.conclusion) {
    case 'success':
      return 'text-green-600 dark:text-green-400'
    case 'skipped':
    case 'neutral':
      return 'text-neutral-400'
    default:
      return 'text-red-600 dark:text-red-400'
  }
}

export function reviewRunIcon(run: ReviewCheckRun): string {
  if (run.status !== 'completed') return 'i-lucide-loader-circle'
  switch (run.conclusion) {
    case 'success':
      return 'i-lucide-circle-check'
    case 'skipped':
    case 'neutral':
      return 'i-lucide-circle-minus'
    default:
      return 'i-lucide-circle-x'
  }
}
