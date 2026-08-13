// Whether the signed in user may force a refresh.
//
// This only decides whether the button is drawn. The endpoint checks the same
// list again and refuses on its own, so a hidden button is convenience and
// never protection.

export function useReviewAdmin() {
  const { user } = useAuth()
  const config = useRuntimeConfig()

  const isAdmin = computed(() =>
    isReviewAdmin(user.value?.username, config.public.reviewAdmins))

  return { isAdmin }
}
