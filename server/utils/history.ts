import { calculateHealth } from './health'
import { resolveCiPassing, resolveNuxt4Compatible } from './analyzers'

const TODAY_KEY = () => new Date().toISOString().slice(0, 10) // YYYY-MM-DD

export function createSnapshot(mod: ModuleData): ModuleSnapshot {
  const health = calculateHealth(mod)

  const signals: Record<string, { points: number, maxPoints: number }> = {}
  for (const s of health.signals) {
    signals[s.key] = { points: s.points, maxPoints: s.maxPoints }
  }

  return {
    date: TODAY_KEY(),
    score: health.score,
    signals,
    meta: {
      version: mod.npm?.latestVersion ?? null,
      downloads: mod.npm?.downloads ?? null,
      stars: mod.github?.stars ?? null,
      contributors: mod.contributors?.uniqueContributors ?? null,
      lastCommit: mod.github?.pushedAt ?? null,
      lastRelease: mod.release?.date ?? null,
      openIssues: mod.github?.openIssues ?? null,
      pendingCommits: mod.pendingCommits?.nonChore ?? null,
      deprecated: !!mod.npm?.deprecated,
      archived: !!mod.github?.archived,
      vulnCount: mod.vulnerabilities?.count ?? null,
      hasTests: !!(mod.npm?.hasTests && mod.testFiles?.hasTestFiles),
      hasTypes: !!mod.npm?.hasTypes,
      ciPassing: resolveCiPassing(mod),
      nuxt4Compatible: resolveNuxt4Compatible(mod),
    },
  }
}

export async function saveSnapshots(modules: ModuleData[]): Promise<{ saved: number, skipped: number }> {
  const today = TODAY_KEY()
  let saved = 0
  let skipped = 0

  for (const mod of modules) {
    const key = `history:${mod.name}`
    const history = await kv.get<ModuleHistory>(key) || {
      moduleName: mod.name,
      npmPackage: mod.npmPackage,
      snapshots: [],
    }

    // Only one snapshot per day
    const alreadyHasToday = history.snapshots.some((s: ModuleSnapshot) => s.date === today)
    if (alreadyHasToday) {
      skipped++
      continue
    }

    const snapshot = createSnapshot(mod)
    history.snapshots.push(snapshot)
    await kv.set(key, history)
    saved++
  }

  return { saved, skipped }
}

export async function getModuleHistory(moduleName: string, options?: { from?: string, to?: string, days?: number }): Promise<ModuleHistory | null> {
  const history = await kv.get<ModuleHistory>(`history:${moduleName}`)
  if (!history) return null

  if (!options?.from && !options?.to && !options?.days) return history

  let snapshots = history.snapshots

  if (options.days) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - options.days)
    const cutoffStr = cutoff.toISOString().slice(0, 10)
    snapshots = snapshots.filter((s: ModuleSnapshot) => s.date >= cutoffStr)
  }

  if (options.from) {
    snapshots = snapshots.filter((s: ModuleSnapshot) => s.date >= options.from!)
  }
  if (options.to) {
    snapshots = snapshots.filter((s: ModuleSnapshot) => s.date <= options.to!)
  }

  return { ...history, snapshots }
}

export function diffBetweenDates(history: ModuleHistory, dateA: string, dateB: string): ModuleDiff | null {
  const snapshotA = history.snapshots.find(s => s.date === dateA)
  const snapshotB = history.snapshots.find(s => s.date === dateB)
  if (!snapshotA || !snapshotB) return null
  return computeDiff(history.moduleName, snapshotA, snapshotB)
}

export function computeDiff(moduleName: string, older: ModuleSnapshot, newer: ModuleSnapshot): ModuleDiff | null {
  // Only compare scoring signals (maxPoints > 0), skip info-only (downloads, stars, etc.)
  const allKeys = new Set([
    ...Object.keys(older.signals).filter(k => (older.signals[k]?.maxPoints ?? 0) > 0),
    ...Object.keys(newer.signals).filter(k => (newer.signals[k]?.maxPoints ?? 0) > 0),
  ])
  const changes: ScoreChange[] = []

  for (const key of allKeys) {
    const oldPts = older.signals[key]?.points ?? 0
    const newPts = newer.signals[key]?.points ?? 0
    const maxPts = newer.signals[key]?.maxPoints ?? older.signals[key]?.maxPoints ?? 0
    if (oldPts !== newPts) {
      changes.push({ signal: key, oldPoints: oldPts, newPoints: newPts, maxPoints: maxPts })
    }
  }

  if (changes.length === 0) return null
  return { moduleName, date: newer.date, oldScore: older.score, newScore: newer.score, changes }
}

export function getLatestDiff(history: ModuleHistory): ModuleDiff | null {
  if (history.snapshots.length < 2) return null
  const sorted = [...history.snapshots].sort((a, b) => b.date.localeCompare(a.date))
  return computeDiff(history.moduleName, sorted[1]!, sorted[0]!)
}
