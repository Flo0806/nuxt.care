// Is this module already in the registry?
//
// The listed modules sit in `modules:all` and are refreshed every eight hours,
// so the index is built once and kept in memory rather than read and parsed on
// every request. The blob is around a megabyte.

interface ListedIndex {
  byNpm: Map<string, ModuleData>
  byRepo: Map<string, ModuleData>
}

const INDEX_TTL_MS = 10 * 60 * 1000

let index: ListedIndex | null = null
let indexedAt = 0

export async function getListedIndex(): Promise<ListedIndex> {
  if (index && Date.now() - indexedAt < INDEX_TTL_MS) return index

  const modules = (await kv.get<ModuleData[]>('modules:all')) ?? []
  const byNpm = new Map<string, ModuleData>()
  const byRepo = new Map<string, ModuleData>()

  for (const mod of modules) {
    if (mod.npmPackage) byNpm.set(mod.npmPackage.toLowerCase(), mod)
    const repo = parseRepoField(mod.repo)
    if (repo) byRepo.set(repo.path.toLowerCase(), mod)
  }

  index = { byNpm, byRepo }
  indexedAt = Date.now()
  return index
}

/** Only relevant while the module is being added. */
export function findDuplicate(entry: ReviewEntry, listed: ListedIndex): ReviewDuplicate | null {
  // A PR that edits an existing entry is supposed to match a listed module.
  if (entry.candidate?.status !== 'added') return null

  const npmPackage = typeof entry.yaml?.npm === 'string' ? entry.yaml.npm.trim().toLowerCase() : null
  const byNpm = npmPackage ? listed.byNpm.get(npmPackage) : undefined
  if (byNpm) return toDuplicate('npm', byNpm)

  const repo = parseRepoField(typeof entry.yaml?.repo === 'string' ? entry.yaml.repo : null)
  const byRepo = repo ? listed.byRepo.get(repo.path.toLowerCase()) : undefined
  if (byRepo) return toDuplicate('repo', byRepo)

  return null
}

function toDuplicate(match: 'npm' | 'repo', mod: ModuleData): ReviewDuplicate {
  return { match, name: mod.name, npmPackage: mod.npmPackage }
}
