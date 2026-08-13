// Turning a health score into the word that goes on a badge.
//
// Lives in shared because both sides need it: the server for the API and the
// badges, the page for the score of a submission. Moved here unchanged from
// server/utils/health.ts, thresholds and all.

import type { ModuleStatus } from '../types/modules'

export function scoreToStatus(score: number): ModuleStatus {
  if (!score) return 'unknown'
  if (score >= 90) return 'optimal'
  if (score >= 70) return 'stable'
  if (score >= 40) return 'degraded'
  return 'critical'
}
