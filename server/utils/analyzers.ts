/**
 * Analyze nuxt version compatibility
 *
 * Supports two formats:
 * - New array format: [3, 4] - explicit version list (preferred when available)
 * - Legacy string format: ">=3.0.0" - semver constraint (fallback)
 */
export function analyzeCompatString(compat?: string | number[]): CompatAnalysis | null {
  if (!compat) return null

  // New array format: [3, 4] means supports Nuxt 3 and 4
  if (Array.isArray(compat)) {
    return {
      supports4: compat.includes(4),
      supports3: compat.includes(3),
      raw: compat.join(', '),
    }
  }

  // Legacy string format: parse semver constraint
  // Explicit Nuxt 4 support
  const explicit4 = /\^4|>=4|>3\.99|\*/.test(compat)

  // ^3.x.x in semver means >=3.0.0 <4.0.0, so it's Nuxt 3 only!
  const isCaret3 = /\^3/.test(compat)

  // >=3 without ^3 and without <4 means Nuxt 4 compatible
  const isOpenEnded3Plus = />=3|>2\.99/.test(compat) && !/<4|<4\.0/.test(compat)
  const implicit4 = !isCaret3 && isOpenEnded3Plus

  return {
    supports4: explicit4 || implicit4,
    supports3: /\^3|>=3|>2\.99|\*/.test(compat),
    raw: compat,
  }
}

/**
 * Analyze GitHub topics for Nuxt version tags
 */
export function analyzeTopics(topics?: string[]): TopicsAnalysis | null {
  if (!topics?.length) return null
  const t = topics.map(x => x.toLowerCase())
  return {
    hasNuxt4: t.includes('nuxt4') || t.includes('nuxt-4'),
    hasNuxt3: t.includes('nuxt3') || t.includes('nuxt-3'),
    hasNuxt2: t.includes('nuxt2') || t.includes('nuxt-2'),
    isNuxtModule: t.includes('nuxt-module') || t.includes('nuxtjs'),
    all: topics,
  }
}

/**
 * Analyze npm keywords for Nuxt version tags
 */
export function analyzeKeywords(keywords?: string[]): KeywordsAnalysis | null {
  if (!keywords?.length) return null
  const k = keywords.map(x => x.toLowerCase())
  return {
    hasNuxt4: k.includes('nuxt4') || k.includes('nuxt-4'),
    hasNuxt3: k.includes('nuxt3') || k.includes('nuxt-3'),
    all: keywords,
  }
}
