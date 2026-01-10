---
title: Health Score
navigation:
  order: 2
---

# Health Score

Every module receives a health score from 0 to 100 points. The score is calculated based on 10 criteria that indicate how well-maintained and safe a module is.

## Scoring Criteria

| Criteria | Max Points | Description |
|----------|------------|-------------|
| Activity | 15 | Recent commit activity |
| Not Archived | 10 | Repository is not archived |
| Contributors | 10 | Multiple active contributors |
| Nuxt 4 Compatible | 15 | Works with Nuxt 4 |
| Recent Release | 10 | Published within 90 days |
| Not Deprecated | 15 | Not marked as deprecated on npm |
| No Vulnerabilities | 10 | No known security issues |
| Has Tests | 5 | Test script in package.json |
| CI Passing | 5 | GitHub Actions status |
| Pending Commits | 5 | Unreleased changes |

## Activity (15 points)

Measures how recently the repository was updated:

- **15 points** - Commit within the last 30 days
- **8 points** - Commit within the last 180 days
- **4 points** - Commit within the last year
- **0 points** - No commits for over a year

## Not Archived (10 points)

- **10 points** - Repository is active
- **0 points** - Repository is archived on GitHub

## Contributors (10 points)

Number of unique contributors in the last year:

- **10 points** - 3 or more contributors
- **5 points** - 2 contributors
- **0 points** - Single contributor (bus factor risk)

## Nuxt 4 Compatible (15 points)

See [Nuxt 4 Detection](/docs/nuxt4-detection) for details on how compatibility is determined.

- **15 points** - Confirmed Nuxt 4 support (2+ signals)
- **8 points** - Partially confirmed (1 signal)
- **0 points** - Nuxt 3 only or unknown

## Recent Release (10 points)

How recently a new version was published:

- **10 points** - Release within 90 days
- **5 points** - Release within 1 year
- **0 points** - No release for over a year

## Not Deprecated (15 points)

- **15 points** - Package is active
- **0 points** - Package is deprecated on npm

## No Vulnerabilities (10 points)

Based on the OSV (Open Source Vulnerabilities) database:

- **10 points** - No known vulnerabilities
- **5 points** - Only low/medium severity issues
- **3 points** - High severity vulnerabilities
- **0 points** - Critical vulnerabilities

## Has Tests (5 points)

Checks if the module has a test script defined in `package.json`:

- **5 points** - `scripts.test` exists and is not the default npm placeholder
- **0 points** - No test script found

## CI Passing (5 points)

GitHub Actions workflow status on the default branch:

- **5 points** - Last workflow run succeeded
- **2 points** - CI exists but no recent runs
- **0 points** - Last workflow run failed or no CI detected

## Pending Commits (5 points)

Unreleased commits since the last release. Chore, docs, style, and CI commits are filtered out.

- **5 points** - All changes have been released
- **3 points** - 1-5 unreleased changes
- **1 point** - 6-15 unreleased changes
- **0 points** - 16+ unreleased changes (may indicate abandoned maintenance)

## Score Interpretation

| Score | Rating | Meaning |
|-------|--------|---------|
| 80-100 | Excellent | Well-maintained, Nuxt 4 ready |
| 60-79 | Good | Actively maintained, minor issues possible |
| 40-59 | Fair | Limited maintenance, use with caution |
| 0-39 | Poor | Outdated or abandoned, seek alternatives |
