// Who may force a refresh of a single submission.
//
// One list, read by both sides. The page uses it to decide whether to show the
// button, the endpoint uses it to decide whether to obey. Hiding a button is
// not a permission check, so the server never trusts the client here.
//
// The logins are public GitHub names, not a secret, which is why the list may
// live in the public runtime config.

export function parseReviewAdmins(value: string | undefined | null): string[] {
  return (value ?? '')
    .split(',')
    .map(login => login.trim().toLowerCase())
    .filter(Boolean)
}

export function isReviewAdmin(username: string | undefined | null, configured: string | undefined | null): boolean {
  if (!username) return false
  return parseReviewAdmins(configured).includes(username.toLowerCase())
}
