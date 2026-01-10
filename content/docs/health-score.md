---
title: Health Score
navigation:
  order: 2
---

# Health Score

Every module receives a health score from 0 to 100 points. The score is calculated based on 7 criteria that indicate how well-maintained and safe a module is.

## Scoring Criteria

| Criteria | Max Points | Description |
|----------|------------|-------------|
| Activity | 20 | Recent commit activity |
| Not Archived | 10 | Repository is not archived |
| Contributors | 10 | Multiple active contributors |
| Nuxt 4 Compatible | 20 | Works with Nuxt 4 |
| Recent Release | 10 | Published within 90 days |
| Not Deprecated | 20 | Not marked as deprecated on npm |
| No Vulnerabilities | 10 | No known security issues |

## Activity (20 points)

Measures how recently the repository was updated:

- **20 points** - Commit within the last 30 days
- **10 points** - Commit within the last 180 days
- **0 points** - No commits for over 180 days

## Not Archived (10 points)

- **10 points** - Repository is active
- **0 points** - Repository is archived on GitHub

## Contributors (10 points)

Number of unique contributors in the last year:

- **10 points** - 3 or more contributors
- **5 points** - 2 contributors
- **0 points** - Single contributor (bus factor risk)

## Nuxt 4 Compatible (20 points)

See [Nuxt 4 Detection](/docs/nuxt4-detection) for details on how compatibility is determined.

- **20 points** - Confirmed Nuxt 4 support
- **0 points** - Nuxt 3 only or unknown

## Recent Release (10 points)

How recently a new version was published:

- **10 points** - Release within 90 days
- **5 points** - Release within 180 days
- **0 points** - No release for over 180 days

## Not Deprecated (20 points)

- **20 points** - Package is active
- **0 points** - Package is deprecated on npm

## No Vulnerabilities (10 points)

Based on the OSV (Open Source Vulnerabilities) database:

- **10 points** - No known vulnerabilities
- **5 points** - Only low/medium severity issues
- **3 points** - High severity vulnerabilities
- **0 points** - Critical vulnerabilities

## Score Interpretation

| Score | Rating | Meaning |
|-------|--------|---------|
| 90+ | Excellent | Well-maintained, safe to use |
| 70-89 | Good | Generally reliable |
| 40-69 | Fair | Some concerns, review before using |
| <40 | Poor | Significant issues, consider alternatives |
