import { daysSince } from './fetchers'

/**
 * Calculate health score for a module based on various signals
 * Max score: 100 points
 */
export function calculateHealth(data: ModuleData): HealthScore {
  let score = 0
  const signals: HealthSignal[] = []

  // 1. Activity (max 20 points)
  const activityDays = data.github?.pushedAt ? daysSince(data.github.pushedAt) : null
  if (activityDays !== null) {
    if (activityDays < 30) {
      score += 20
      signals.push({ type: 'positive', msg: 'Active: commit within 30 days', points: 20, maxPoints: 20 })
    }
    else if (activityDays < 180) {
      score += 10
      signals.push({ type: 'warning', msg: `Inactive: ${Math.floor(activityDays / 30)} months since commit`, points: 10, maxPoints: 20 })
    }
    else if (activityDays < 365) {
      score += 5
      signals.push({ type: 'warning', msg: `Stale: ${Math.floor(activityDays / 30)} months since commit`, points: 5, maxPoints: 20 })
    }
    else {
      signals.push({ type: 'negative', msg: `Abandoned: ${Math.floor(activityDays / 365)}+ years since commit`, points: 0, maxPoints: 20 })
    }
  }
  else {
    signals.push({ type: 'warning', msg: 'Activity: no data', points: 0, maxPoints: 20 })
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

  // 4. Nuxt 4 compatible (20 points)
  const nuxt4Signals = [
    data.nuxtApiCompat?.supports4,
    data.topics?.hasNuxt4,
    data.keywords?.hasNuxt4,
    data.release?.nuxt4Mentioned,
  ].filter(Boolean).length

  if (nuxt4Signals >= 2) {
    score += 20
    signals.push({ type: 'positive', msg: 'Nuxt 4 compatible', points: 20, maxPoints: 20 })
  }
  else if (nuxt4Signals === 1) {
    score += 10
    signals.push({ type: 'warning', msg: 'Nuxt 4 partially confirmed', points: 10, maxPoints: 20 })
  }
  else {
    signals.push({ type: 'warning', msg: 'Nuxt 4 not confirmed', points: 0, maxPoints: 20 })
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

  // 6. Not deprecated (20 points)
  if (data.npm?.deprecated) {
    signals.push({ type: 'negative', msg: 'Deprecated on npm', points: 0, maxPoints: 20 })
  }
  else {
    score += 20
    signals.push({ type: 'positive', msg: 'Not deprecated', points: 20, maxPoints: 20 })
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

  return {
    score: Math.max(0, Math.min(100, score)),
    signals,
  }
}
