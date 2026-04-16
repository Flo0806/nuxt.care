import type { HealthSignal, ModuleData } from '~~/shared/types/modules'

export interface ActionSnippet {
  label: string
  code: string
  lang?: string
}

export interface ActionLink {
  label: string
  url: string
}

export interface ActionHint {
  key: string
  title: string
  description: string
  gain: number
  docsUrl?: string
  details?: string
  snippets?: ActionSnippet[]
  links?: ActionLink[]
}

function buildRepoUrl(data: ModuleData, path = ''): string | undefined {
  const fullName = data.github?.fullName
  if (!fullName) return
  return `https://github.com/${fullName}${path}`
}

export function signalToActionHint(signal: HealthSignal, data: ModuleData): ActionHint | null {
  const gap = signal.maxPoints - signal.points
  if (gap <= 0) return null

  switch (signal.key) {
    case 'tests':
      return {
        key: signal.key,
        title: 'Add tests',
        description: 'Add a `test` script to package.json and at least one test file.',
        gain: gap,
        details: 'Vitest is the recommended runner for Nuxt modules. Install it as a devDep, add the script below to `package.json`, and put a test file under `test/` (e.g. `test/basic.test.ts`).',
        snippets: [
          { label: 'package.json scripts', lang: 'json', code: `"scripts": {\n  "test": "vitest run"\n}` },
          { label: 'Install vitest', lang: 'bash', code: 'pnpm add -D vitest' },
        ],
        links: [
          { label: 'Nuxt docs: module testing', url: 'https://nuxt.com/docs/guide/going-further/modules#testing' },
          { label: 'Vitest getting started', url: 'https://vitest.dev/guide/' },
        ],
      }
    case 'types':
      return {
        key: signal.key,
        title: 'Add TypeScript support',
        description: 'Publish TypeScript declarations (`types` or `exports.types` in package.json).',
        gain: gap,
      }
    case 'license':
      return {
        key: signal.key,
        title: 'Add a license',
        description: 'Add a LICENSE file to the repository and set `"license"` in package.json.',
        gain: gap,
        details: 'The three most common OSI licenses for Nuxt modules. Pick one, drop it into a `LICENSE` file, and set `"license": "<spdx-id>"` in `package.json`.',
        snippets: [
          { label: 'package.json', lang: 'json', code: `"license": "MIT"` },
        ],
        links: [
          { label: 'MIT (permissive, most common)', url: 'https://opensource.org/license/mit' },
          { label: 'Apache-2.0 (permissive + patent grant)', url: 'https://opensource.org/license/apache-2-0' },
          { label: 'ISC (minimal, MIT-equivalent)', url: 'https://opensource.org/license/isc-license-txt' },
          { label: 'choosealicense.com (compare)', url: 'https://choosealicense.com/' },
        ],
      }
    case 'ci':
      return {
        key: signal.key,
        title: 'Fix CI',
        description: 'Your GitHub Actions workflow is failing or missing. Set up CI that runs lint + tests on every push.',
        gain: gap,
        docsUrl: buildRepoUrl(data, '/actions'),
      }
    case 'freshness':
      return {
        key: signal.key,
        title: 'Commit something recent',
        description: 'Last activity was a while ago. Even a docs or dependency-bump commit refreshes the signal.',
        gain: gap,
        docsUrl: buildRepoUrl(data, '/commits'),
      }
    case 'pending':
      return {
        key: signal.key,
        title: 'Cut a release',
        description: 'There are unreleased commits on the default branch. `npm version patch` + `npm publish` clears the backlog.',
        gain: gap,
        docsUrl: buildRepoUrl(data, '/releases'),
      }
    case 'archived':
      return {
        key: signal.key,
        title: 'Unarchive the repository',
        description: 'The repo is marked as archived on GitHub. If you\'re still maintaining it, unarchive it under Settings → Danger Zone.',
        gain: gap,
        docsUrl: buildRepoUrl(data, '/settings'),
      }
    case 'deprecated':
      return {
        key: signal.key,
        title: 'Undeprecate the npm package',
        description: 'The npm package is marked deprecated. If this was unintended, run `npm deprecate <pkg> ""` to clear the message.',
        gain: gap,
      }
    case 'nuxt4':
      return {
        key: signal.key,
        title: 'Declare Nuxt 4 compatibility',
        description: 'Add a `compatibility` entry to the module definition and list `nuxt-module` + `nuxt4` as keywords.',
        gain: gap,
        details: 'Two cheap signals: a compatibility flag in your `defineNuxtModule({ meta: ... })` call, plus keywords in `package.json` so nuxt.care can pick it up from npm metadata.',
        snippets: [
          { label: 'src/module.ts', lang: 'ts', code: `export default defineNuxtModule({\n  meta: {\n    name: 'your-module',\n    compatibility: { nuxt: '>=3.0.0' },\n  },\n})` },
          { label: 'package.json', lang: 'json', code: `"keywords": ["nuxt", "nuxt-module", "nuxt4"]` },
        ],
        links: [
          { label: 'Nuxt docs: defineNuxtModule', url: 'https://nuxt.com/docs/api/kit/modules#definenuxtmodule' },
        ],
      }
    case 'security':
      return {
        key: signal.key,
        title: 'Fix vulnerabilities',
        description: 'Run `pnpm audit --fix` or bump affected dependencies to clear the reported advisories.',
        gain: gap,
      }
    case 'trust':
      // Can't be fixed by the maintainer - it's a classification
      return null
    default:
      return null
  }
}

export function getActionHints(data: ModuleData): ActionHint[] {
  if (!data.health?.signals) return []
  const hints = data.health.signals
    .map(s => signalToActionHint(s, data))
    .filter((h): h is ActionHint => h !== null)

  // Fixing vulnerabilities removes both the 'security' gap AND the 'vulns-penalty'
  // negative signal. Merge the penalty's gap into the security hint so the gain
  // reflects the real total impact.
  const vulnsPenalty = data.health.signals.find(s => s.key === 'vulns-penalty')
  if (vulnsPenalty) {
    const penaltyGap = vulnsPenalty.maxPoints - vulnsPenalty.points
    const security = hints.find(h => h.key === 'security')
    if (security) {
      security.gain += penaltyGap
    }
    else {
      hints.push({
        key: 'security',
        title: 'Fix vulnerabilities',
        description: 'Active vulnerabilities are penalizing your score. Run `pnpm audit --fix` or bump affected dependencies.',
        gain: penaltyGap,
      })
    }
  }

  return hints.sort((a, b) => b.gain - a.gain)
}

export function potentialScore(data: ModuleData): number {
  const current = data.health?.score ?? 0
  const gains = getActionHints(data).reduce((sum, h) => sum + h.gain, 0)
  return Math.min(100, current + gains)
}
