/**
 * Analyze nuxt version constraint string
 */
export function analyzeCompatString(compat?: string): CompatAnalysis | null {
  if (!compat) return null
  return {
    supports4: /\^4|>=4|>3\.99|\*/.test(compat),
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
