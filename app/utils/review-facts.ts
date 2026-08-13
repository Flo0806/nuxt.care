// The short facts behind a submission's grouping.
//
// Shared by the list row and the detail view so both say the same thing. Only
// what is actually known lands in here: an entry that was never looked up
// stays silent rather than claiming a defect.

import { formatRelative } from './format'

export interface ReviewFact {
  icon: string
  text: string
  tone?: string
}

const DANGER = 'text-red-600 dark:text-red-400'
const WARN = 'text-amber-600 dark:text-amber-400'

export function reviewFacts(entry: ReviewEntryView): ReviewFact[] {
  const { candidate, yamlError, npm, ci, conversation, waitingOn, duplicate, ownership, merge } = entry
  const facts: ReviewFact[] = []

  // Only a definite no is worth saying. Null means GitHub had not worked the
  // answer out yet, which is not the same as mergeable.
  if (merge?.mergeable === false) {
    facts.push({ icon: 'i-lucide-git-merge', text: 'merge conflict with main', tone: DANGER })
  }

  if (duplicate) {
    facts.push({
      icon: 'i-lucide-copy',
      text: `already listed as ${duplicate.name}`,
      tone: DANGER,
    })
  }

  if (!candidate) facts.push({ icon: 'i-lucide-file-x', text: 'no module file', tone: DANGER })
  else if (!candidate.isModulePath) facts.push({ icon: 'i-lucide-folder-x', text: candidate.filename, tone: DANGER })
  if (yamlError) facts.push({ icon: 'i-lucide-file-warning', text: 'yaml does not parse', tone: DANGER })

  if (npm?.deprecated) facts.push({ icon: 'i-lucide-ban', text: 'deprecated on npm', tone: DANGER })
  else if (npm?.status === 'not_found') facts.push({ icon: 'i-lucide-package-x', text: 'package not on npm', tone: DANGER })
  else if (npm?.status === 'invalid_name') facts.push({ icon: 'i-lucide-package-x', text: 'npm field is not a package name', tone: DANGER })
  else if (npm?.status === 'error') facts.push({ icon: 'i-lucide-package-search', text: 'npm could not be read', tone: WARN })
  else if (npm?.lastPublish) {
    facts.push({
      icon: 'i-lucide-package',
      text: `published ${formatRelative(npm.lastPublish)}`,
      tone: (npm.daysSincePublish ?? 0) > 365 ? WARN : undefined,
    })
  }

  if (ci?.conclusion === 'failure') {
    facts.push({ icon: 'i-lucide-circle-x', text: ci.failedNames.join(', ') || 'checks failed', tone: DANGER })

    // The point of the whole group: for most of these the fix does not need
    // the author at all.
    if (entry.merge?.maintainerCanModify === true) {
      facts.push({ icon: 'i-lucide-wrench', text: 'maintainers can push the fix themselves' })
    }
    else if (entry.merge?.maintainerCanModify === false) {
      facts.push({ icon: 'i-lucide-lock', text: 'only the author can push here', tone: WARN })
    }
  }
  else if (ci?.conclusion === 'success') {
    facts.push({ icon: 'i-lucide-circle-check', text: 'checks green' })
  }
  else if (ci?.conclusion === 'none') {
    facts.push({ icon: 'i-lucide-circle-dashed', text: 'no checks ran', tone: WARN })
  }

  const since = waitingOn === 'author'
    ? conversation?.lastMaintainerActivity
    : waitingOn === 'maintainer' ? conversation?.lastAuthorActivity : null

  if (waitingOn && since) {
    facts.push({
      icon: 'i-lucide-clock',
      text: `${waitingOn === 'author' ? 'author' : 'we'} owe a reply since ${formatRelative(since)}`,
      tone: WARN,
    })
  }

  // Worth a look rather than an objection: submitting somebody else's module
  // is allowed, it just deserves a second thought.
  if (ownership.unrelated) {
    facts.push({
      icon: 'i-lucide-user-round-x',
      text: `${ownership.prAuthor} owns neither the repo nor the package`,
      tone: WARN,
    })
  }

  return facts
}

/**
 * Where the module icon of a submission can be read.
 *
 * Icons live in `icons/` of nuxt/modules, and the file usually only exists in
 * the pull request. GitHub serves a PR head commit from the base repository,
 * so addressing nuxt/modules by that sha reaches both the file a PR adds and
 * one that was already there. No fork name needed.
 *
 * Returns null when the yaml names no icon or the head commit is unknown.
 */
export function reviewIconUrl(entry: ReviewEntryView): string | null {
  const icon = yamlText(entry.yaml, 'icon')
  if (!icon || !entry.headSha) return null
  // The name comes from a stranger's yaml. Rejected outright when it tries to
  // leave the folder; everything else is encoded, so a space or a question
  // mark cannot break the URL either.
  if (icon.includes('/') || icon.includes('..')) return null

  return `https://raw.githubusercontent.com/nuxt/modules/${entry.headSha}/icons/${encodeURIComponent(icon)}`
}
