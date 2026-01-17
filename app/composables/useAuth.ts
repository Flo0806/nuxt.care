import type { SessionUser } from '~~/shared/types/auth'

export function useAuth() {
  const { loggedIn, user, clear, fetch } = useUserSession()

  const sessionUser = computed(() => user.value as SessionUser | null)

  async function login() {
    return navigateTo('/auth/github', { external: true })
  }

  async function logout() {
    await $fetch('/auth/logout')
    await clear()
  }

  async function refresh() {
    await fetch()
  }

  return {
    isLoggedIn: loggedIn,
    user: sessionUser,
    login,
    logout,
    refresh,
  }
}
