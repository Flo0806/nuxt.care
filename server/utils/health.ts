import { daysSince } from './fetchers'

/**
 * Health Score Calculation for Nuxt Modules
 * ==========================================
 *
 * The health score evaluates the quality and maintainability of a Nuxt module
 * on a scale from 0-100 points, based on 10 criteria:
 *
 * | #  | Signal            | Max | Description                                     |
 * |----|-------------------|-----|-------------------------------------------------|
 * | 1  | Activity          | 15  | Time since last commit                          |
 * |    |                   |     | <30d = 15p, <180d = 8p, <365d = 4p              |
 * | 2  | Not Archived      | 10  | Repository is not archived                      |
 * | 3  | Contributors      | 10  | Active contributors in last year                |
 * |    |                   |     | 3+ = 10p, 2 = 5p, 1 = 0p                        |
 * | 4  | Nuxt 4 Compatible | 15  | Compatibility from 4 sources:                   |
 * |    |                   |     | - nuxt.com API compat string                    |
 * |    |                   |     | - GitHub Topics (nuxt4, nuxt-4)                 |
 * |    |                   |     | - npm Keywords                                  |
 * |    |                   |     | - Release Notes Mentions                        |
 * |    |                   |     | 2+ signals = 15p, 1 = 8p, 0 = 0p                |
 * | 5  | Recent Release    | 10  | Time since last release                         |
 * |    |                   |     | <90d = 10p, <365d = 5p                          |
 * | 6  | Not Deprecated    | 15  | Package is not marked as deprecated             |
 * | 7  | No Vulnerabilities| 10  | No known security issues (OSV API)              |
 * |    |                   |     | 0 = 10p, low/med = 5p, high = 3p, critical = 0p |
 * | 8  | Has Tests         | 5   | `scripts.test` exists in package.json           |
 * | 9  | CI Passing        | 5   | GitHub Actions status on default branch         |
 * |    |                   |     | success = 5p, unknown = 2p, failure = 0p        |
 * | 10 | Pending Commits   | 5   | Unreleased changes (excl. chore/docs/style/ci)  |
 * |    |                   |     | 0 = 5p, 1-5 = 3p, 6-15 = 1p, 16+ = 0p           |
 * |----|-------------------|-----|                                                 |
 * |    | TOTAL             | 100 |                                                 |
 *
 * Score Interpretation:
 * - 80-100: Excellent - Well maintained, Nuxt 4 ready
 * - 60-79:  Good - Actively maintained, minor issues possible
 * - 40-59:  Fair - Limited maintenance, use with caution
 * - 0-39:   Poor - Outdated or abandoned, seek alternatives
 */
export function calculateHealth(data: ModuleData): HealthScore {
  let score = 0
  const signals: HealthSignal[] = []

  // 1. Activity (max 15 points)
  const activityDays = data.github?.pushedAt ? daysSince(data.github.pushedAt) : null
  if (activityDays !== null) {
    if (activityDays < 30) {
      score += 15
      signals.push({ type: 'positive', msg: 'Active: commit within 30 days', points: 15, maxPoints: 15 })
    }
    else if (activityDays < 180) {
      score += 8
      signals.push({ type: 'warning', msg: `Inactive: ${Math.floor(activityDays / 30)} months since commit`, points: 8, maxPoints: 15 })
    }
    else if (activityDays < 365) {
      score += 4
      signals.push({ type: 'warning', msg: `Stale: ${Math.floor(activityDays / 30)} months since commit`, points: 4, maxPoints: 15 })
    }
    else {
      signals.push({ type: 'negative', msg: `Abandoned: ${Math.floor(activityDays / 365)}+ years since commit`, points: 0, maxPoints: 15 })
    }
  }
  else {
    signals.push({ type: 'warning', msg: 'Activity: no data', points: 0, maxPoints: 15 })
  }

  // 2. Not archived (10 points)
  if (data.github?.archived) {
    signals.push({ type: 'negative', msg: 'Archived repository', points: 0, maxPoints: 10 })
  }
  else {
    score += 10
    signals.push({ type: 'positive', msg: 'Active repository', points: 10, maxPoints: 10 })
  }

  // 3. Multiple contributors (10 points)
  const contributors = data.contributors?.uniqueContributors || 0
  if (contributors >= 3) {
    score += 10
    signals.push({ type: 'positive', msg: `${contributors} contributors`, points: 10, maxPoints: 10 })
  }
  else if (contributors >= 2) {
    score += 5
    signals.push({ type: 'warning', msg: `Only ${contributors} contributors`, points: 5, maxPoints: 10 })
  }
  else {
    signals.push({ type: 'warning', msg: 'Single maintainer', points: 0, maxPoints: 10 })
  }

  // 4. Nuxt 4 compatible (15 points)
  const nuxt4Signals = [
    data.nuxtApiCompat?.supports4,
    data.topics?.hasNuxt4,
    data.keywords?.hasNuxt4,
    data.release?.nuxt4Mentioned,
  ].filter(Boolean).length

  if (nuxt4Signals >= 2) {
    score += 15
    signals.push({ type: 'positive', msg: 'Nuxt 4 compatible', points: 15, maxPoints: 15 })
  }
  else if (nuxt4Signals === 1) {
    score += 8
    signals.push({ type: 'warning', msg: 'Nuxt 4 partially confirmed', points: 8, maxPoints: 15 })
  }
  else {
    signals.push({ type: 'warning', msg: 'Nuxt 4 not confirmed', points: 0, maxPoints: 15 })
  }

  // 5. Recent release (10 points)
  const releaseDays = data.release?.daysSince
  if (releaseDays !== undefined) {
    if (releaseDays < 90) {
      score += 10
      signals.push({ type: 'positive', msg: `Released ${releaseDays}d ago`, points: 10, maxPoints: 10 })
    }
    else if (releaseDays < 365) {
      score += 5
      signals.push({ type: 'warning', msg: `Released ${Math.floor(releaseDays / 30)}mo ago`, points: 5, maxPoints: 10 })
    }
    else {
      signals.push({ type: 'warning', msg: `Released ${Math.floor(releaseDays / 365)}y+ ago`, points: 0, maxPoints: 10 })
    }
  }
  else {
    signals.push({ type: 'warning', msg: 'No releases', points: 0, maxPoints: 10 })
  }

  // 6. Not deprecated (15 points)
  if (data.npm?.deprecated) {
    signals.push({ type: 'negative', msg: 'Deprecated on npm', points: 0, maxPoints: 15 })
  }
  else {
    score += 15
    signals.push({ type: 'positive', msg: 'Not deprecated', points: 15, maxPoints: 15 })
  }

  // 7. No vulnerabilities (10 points)
  if (data.vulnerabilities) {
    if (data.vulnerabilities.count === 0) {
      score += 10
      signals.push({ type: 'positive', msg: 'No vulnerabilities', points: 10, maxPoints: 10 })
    }
    else {
      const { critical, high, count } = data.vulnerabilities
      if (critical > 0) {
        signals.push({ type: 'negative', msg: `${count} vulns (${critical} critical)`, points: 0, maxPoints: 10 })
      }
      else if (high > 0) {
        score += 3
        signals.push({ type: 'negative', msg: `${count} vulns (${high} high)`, points: 3, maxPoints: 10 })
      }
      else {
        score += 5
        signals.push({ type: 'warning', msg: `${count} vulns (low/medium)`, points: 5, maxPoints: 10 })
      }
    }
  }
  else {
    signals.push({ type: 'warning', msg: 'Vulnerabilities: no data', points: 0, maxPoints: 10 })
  }

  // 8. Has tests (5 points)
  if (data.npm?.hasTests) {
    score += 5
    signals.push({ type: 'positive', msg: 'Has tests', points: 5, maxPoints: 5 })
  }
  else {
    signals.push({ type: 'warning', msg: 'No tests detected', points: 0, maxPoints: 5 })
  }

  // 9. CI status (5 points)
  if (data.ciStatus?.hasCI) {
    if (data.ciStatus.lastRunConclusion === 'success') {
      score += 5
      signals.push({ type: 'positive', msg: 'CI passing', points: 5, maxPoints: 5 })
    }
    else if (data.ciStatus.lastRunConclusion === 'failure') {
      signals.push({ type: 'negative', msg: 'CI failing', points: 0, maxPoints: 5 })
    }
    else {
      score += 2
      signals.push({ type: 'warning', msg: 'CI: no recent runs', points: 2, maxPoints: 5 })
    }
  }
  else {
    signals.push({ type: 'warning', msg: 'No CI detected', points: 0, maxPoints: 5 })
  }

  // 10. Pending commits (5 points)
  if (data.pendingCommits) {
    const pending = data.pendingCommits.nonChore
    if (pending === 0) {
      score += 5
      signals.push({ type: 'positive', msg: 'All changes released', points: 5, maxPoints: 5 })
    }
    else if (pending <= 5) {
      score += 3
      signals.push({ type: 'warning', msg: `${pending} unreleased changes`, points: 3, maxPoints: 5 })
    }
    else if (pending <= 15) {
      score += 1
      signals.push({ type: 'warning', msg: `${pending} unreleased changes`, points: 1, maxPoints: 5 })
    }
    else {
      signals.push({ type: 'negative', msg: `${pending} unreleased changes`, points: 0, maxPoints: 5 })
    }
  }
  else {
    signals.push({ type: 'warning', msg: 'Pending: no release data', points: 0, maxPoints: 5 })
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    signals,
  }
}
