export function useStars() {
  // All starred repos (full_name like "nuxt/image")
  const starredRepos = useState<Record<string, boolean>>('starred-repos', () => ({}))
  const loadingRepos = useState<Record<string, boolean>>('loading-repos', () => ({}))
  const initialized = useState<boolean>('stars-initialized', () => false)
  const loading = useState<boolean>('stars-loading', () => false)

  const { logout } = useAuth()
  const toast = useToast()

  // Check if error requires re-authentication
  async function handleReauthError(e: unknown): Promise<boolean> {
    const error = e as { data?: { data?: { reauth?: boolean } } }
    if (error?.data?.data?.reauth) {
      toast.add({
        title: 'Session expired',
        description: 'Please log in again.',
        icon: 'i-lucide-log-out',
        color: 'warning',
      })
      await logout()
      return true
    }
    return false
  }

  // Extract clean repo (owner/repo) from potentially longer path like "owner/repo#branch/path"
  function getCleanRepo(repo: string): string {
    return repo.split('#')[0] || repo
  }

  // Load all starred repos at once
  async function loadAllStarred(): Promise<void> {
    if (loading.value) return

    loading.value = true
    try {
      const { starred } = await $fetch<{ starred: string[] }>('/api/stars')

      const newStarred: Record<string, boolean> = {}
      for (const repo of starred) {
        newStarred[repo] = true
      }
      starredRepos.value = newStarred
      initialized.value = true
    }
    catch (e) {
      const handled = await handleReauthError(e)
      if (!handled) {
        console.error('[useStars] Could not load starred repos', e)
      }
    }
    finally {
      loading.value = false
    }
  }

  async function toggleStar(repo: string): Promise<boolean> {
    const clean = getCleanRepo(repo)
    loadingRepos.value[repo] = true
    try {
      const { starred } = await $fetch<{ starred: boolean }>(`/api/stars/${clean}`, { method: 'POST' })
      starredRepos.value[clean] = starred
      return starred
    }
    catch (e) {
      await handleReauthError(e)
      throw e
    }
    finally {
      loadingRepos.value[repo] = false
    }
  }

  function isStarred(repo: string): boolean {
    const clean = getCleanRepo(repo)
    return starredRepos.value[clean] === true
  }

  function isLoading(repo: string): boolean {
    return loadingRepos.value[repo] === true
  }

  return {
    loadAllStarred,
    toggleStar,
    isStarred,
    isLoading,
    initialized,
    loading,
  }
}
