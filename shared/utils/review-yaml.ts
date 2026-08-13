// Reading a submitted yaml.
//
// It is stored unfiltered and comes from a stranger's pull request, so every
// read has to prove its own type. Shared because the server builds an analysis
// from the same fields the page displays.

export function yamlText(yaml: Record<string, unknown> | null, key: string): string | null {
  const value = yaml?.[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

/** The declared Nuxt range, which sits one level down under `compatibility`. */
export function yamlCompatibility(yaml: Record<string, unknown> | null): string | null {
  const compat = yaml?.compatibility
  if (!compat || typeof compat !== 'object') return null

  const range = (compat as { nuxt?: unknown }).nuxt
  return typeof range === 'string' && range.trim() ? range.trim() : null
}
