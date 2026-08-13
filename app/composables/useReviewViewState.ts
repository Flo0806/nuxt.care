// What the review list remembers between visits.
//
// The two pieces have different reach on purpose:
//
// - which groups are open is a preference, so it belongs to the browser and
//   lives in localStorage
// - which entry was last opened belongs to this tab. Two tabs side by side to
//   compare submissions must not overwrite each other's mark, and sessionStorage
//   is exactly that: it survives a reload and going back, and a second tab
//   starts empty.

const EXPANDED_KEY = 'nuxt.care:review:expanded'
const MARKED_KEY = 'nuxt.care:review:marked'

function defaultExpanded(): string[] {
  return REVIEW_BUCKETS.filter(bucket => bucket.openByDefault).map(bucket => bucket.key)
}

export function useReviewViewState() {
  const expanded = ref<string[]>(defaultExpanded())
  const marked = ref<number | null>(null)

  onMounted(() => {
    const storedExpanded = localStorage.getItem(EXPANDED_KEY)
    if (storedExpanded) {
      try {
        const parsed: unknown = JSON.parse(storedExpanded)
        // Stale keys from an older grouping would open nothing and hide the rest.
        if (Array.isArray(parsed)) {
          expanded.value = parsed.filter((key): key is string =>
            REVIEW_BUCKETS.some(bucket => bucket.key === key))
        }
      }
      catch {
        localStorage.removeItem(EXPANDED_KEY)
      }
    }

    const storedMarked = sessionStorage.getItem(MARKED_KEY)
    const parsedMark = Number(storedMarked)
    if (storedMarked && Number.isInteger(parsedMark)) marked.value = parsedMark

    watch(expanded, (value) => {
      localStorage.setItem(EXPANDED_KEY, JSON.stringify(value))
    })
  })

  /** Remembers the entry someone just opened, so it stands out on the way back. */
  function mark(prNumber: number) {
    marked.value = prNumber
    sessionStorage.setItem(MARKED_KEY, String(prNumber))
  }

  return { expanded, marked, mark }
}
