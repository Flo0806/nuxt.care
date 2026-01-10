---
title: Health Score
navigation:
  order: 2
---

# Health Score

Every module receives a health score from 0 to 100 points. This score is **not** a popularity contest - it focuses on reliability, maintenance, and compatibility.

## Philosophy

- **85% of the score** comes from reliable, verifiable data (tests, types, CI, vulnerabilities)
- **15%** comes from weaker signals (Nuxt 4 compatibility indicators)
- Downloads and stars are shown but **don't affect the score** - a solo dev can build great modules

## Score Breakdown

| Category | Max Points | What it measures |
|----------|------------|------------------|
| **Security** | 15 | No known vulnerabilities |
| **Trust** | 5 | Official / Community / 3rd-party |
| **Quality** | 30 | Tests, TypeScript, License, CI |
| **Maintenance** | 35 | Publish freshness, release status |
| **Nuxt 4** | 15 | Compatibility signals |

**Total: 100 points maximum**

## Security (15 points)

Based on the [OSV database](https://osv.dev/):

- **15 points** - No known vulnerabilities
- **0 points** - Has vulnerabilities (also applies penalties, see below)

## Trust (5 points)

Based on module type:

- **5 points** - Official Nuxt module
- **3 points** - Community module (nuxt-community org)
- **0 points** - 3rd-party module

## Quality (30 points)

| Check | Points | What we look for |
|-------|--------|------------------|
| Has Tests | 12 | `test` script in package.json |
| TypeScript | 10 | `types`/`typings` field or `typescript` in devDeps |
| License | 5 | License file in repo |
| CI Passing | 3 | GitHub Actions with successful last run |

## Maintenance (35 points)

### Publish Freshness (0-20 points)

| Criteria | Points |
|----------|--------|
| Published < 90 days | 20 |
| Published < 1 year | 12 |
| Published > 1 year | 5 |
| Published > 1 year + "Stable & Done" | 15 |

### Release Status (0-15 points)

| Criteria | Points |
|----------|--------|
| All changes released | 15 |
| Pending commits but active | 8 |
| Has pending commits | 3 |
| Abandoned (pending + no activity > 1 year) | 0 |

## Nuxt 4 Compatibility (15 points)

We check multiple sources:

- Nuxt API compatibility string (`>=3.x <5`)
- GitHub topics (`nuxt4`, `nuxt-4`)
- npm keywords
- Release notes mentioning Nuxt 4

| Signals found | Points |
|---------------|--------|
| 2+ signals | 15 (confirmed) |
| 1 signal | 10 (partial) |
| Official module, 0 signals | 5 (benefit of doubt) |
| 0 signals | 0 (unconfirmed) |

See [Nuxt 4 Detection](/docs/nuxt4-detection) for more details.

## Penalties (Deal Breakers)

These subtract from the score and can push it below zero:

| Issue | Penalty | Why |
|-------|---------|-----|
| Deprecated | -50 | Package author says don't use it |
| Critical vulnerabilities | -40 | Known security issues |
| Archived | -30 | No longer maintained |
| High vulnerabilities | -20 | Serious security concerns |

## Stable & Done Exception

Some modules are "done" - they work perfectly and don't need updates. Old doesn't mean bad!

A module gets the **Stable & Done** bonus (15 instead of 5 for freshness) if:

- Published > 1 year ago, **but**:
  - All changes released (no pending commits)
  - < 10 open issues
  - No known vulnerabilities
  - CI passing (or no CI)

## Score Interpretation

| Score | Rating | Meaning |
|-------|--------|---------|
| 90-100 | Excellent | Well maintained, high quality |
| 70-89 | Good | Safe to use, minor concerns |
| 50-69 | Caution | Review the signals before using |
| < 50 | Warning | Significant issues, consider alternatives |

## What's NOT in the Score

These are shown as info but don't affect scoring:

- **Downloads** - Popular doesn't mean good
- **Stars** - GitHub stars don't indicate quality
- **Contributors** - One person can build great things
