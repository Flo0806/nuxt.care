// Scoring a submission the same way a listed module is scored.
//
// analyzeModule() already fetches everything calculateHealth() reads, and its
// descriptor was written with this path in mind. So nothing is reimplemented
// here and nothing on the module side is touched: this file only builds the
// descriptor from a submitted yaml and decides when the work is worth doing.

import { calculateHealth } from './health'
import { analyzeModule, resolveModuleType, type ModuleDescriptor } from './module-analysis'

/**
 * Buckets where a score answers a question somebody is actually asking.
 *
 * A submission whose file sits in the wrong folder, whose package is
 * deprecated or whose author owes an answer does not become mergeable through
 * a good score, so the roughly eight calls are not spent on it.
 */
export const SCORED_BUCKETS = new Set<ReviewBucket>(['ready'])

/** Repo facts move slowly, so an analysis is redone once a day. */
const ANALYSIS_MAX_AGE_MS = 24 * 60 * 60 * 1000

/** Roughly what one analysis costs, for the call counter in the run. */
export const ANALYSIS_CALLS = 8

export function needsAnalysis(entry: ReviewEntry, bucket: ReviewBucket, now = Date.now()): boolean {
  if (!SCORED_BUCKETS.has(bucket)) return false
  if (!entry.analysis) return true
  return now - new Date(entry.analysis.analysedAt).getTime() > ANALYSIS_MAX_AGE_MS
}

/**
 * The three fields analyzeModule() cannot work without. The type is derived
 * from the repository owner rather than taken from the yaml, the same way
 * nuxt/modules does it, because the submitted value is a claim until merged.
 */
export function descriptorFromSubmission(entry: ReviewEntry): ModuleDescriptor | null {
  const name = yamlText(entry.yaml, 'name')
  const npm = yamlText(entry.yaml, 'npm')
  const repo = yamlText(entry.yaml, 'repo')
  if (!name || !npm || !repo) return null

  return {
    name,
    npm,
    repo,
    description: yamlText(entry.yaml, 'description') ?? undefined,
    category: yamlText(entry.yaml, 'category') ?? undefined,
    type: resolveModuleType(repo),
    compatibility: yamlCompatibility(entry.yaml) ?? undefined,
    // Download counts and the like only exist for modules already in the
    // registry, which is exactly what a submission is not.
    stats: null,
  }
}

/**
 * Sources without which the number is a lie.
 *
 * calculateHealth() cannot tell "absent" from "bad": a failed npm request
 * turns into "Publish date unknown 0/20", "No tests 0/12" and "No TypeScript
 * 0/10", so a module we could not read scores like a bad one. Between the
 * three of these that is 57 of 100 points, awarded against a stranger's module
 * because of a timeout on our side.
 *
 * So a score is only produced when every one of them actually arrived.
 */
function isComplete(data: ModuleData): boolean {
  return !!data.npm && !!data.github && !!data.vulnerabilities
}

export interface AnalysisResult {
  analysis: ReviewAnalysis | null
  /** Said out loud rather than left blank, so the page can explain the gap. */
  error: string | null
}

/**
 * No score is better than a wrong one, because a wrong one gets read as a
 * verdict on somebody's work. When it does not work out, the reason travels
 * with the empty result instead of vanishing into a log nobody reads.
 */
export async function analyseSubmission(entry: ReviewEntry, token?: string): Promise<AnalysisResult> {
  const descriptor = descriptorFromSubmission(entry)
  if (!descriptor) {
    return { analysis: null, error: 'The yaml does not name a module, a package and a repository' }
  }

  const data = await analyzeModule(descriptor, token)
  if (!isComplete(data)) {
    const missing = [
      !data.npm && 'the npm package',
      !data.github && 'the repository',
      !data.vulnerabilities && 'the vulnerability check',
    ].filter(Boolean) as string[]

    const error = `${missing.join(' and ')} could not be read`
    console.warn(`[review] ${descriptor.npm}: no score, ${error}`)

    return { analysis: null, error }
  }

  const health = calculateHealth(data)

  return {
    analysis: {
      score: health.score,
      signals: health.signals,
      github: data.github,
      analysedAt: new Date().toISOString(),
    },
    error: null,
  }
}
