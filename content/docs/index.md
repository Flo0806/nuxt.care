---
title: nuxt.care
navigation:
  order: 1
---

# nuxt.care

**Health-Check & Audit Tool for Nuxt Modules**

A health-check and audit tool for Nuxt modules. nuxt.care helps you discover which modules are actively maintained, Nuxt 4 compatible, and which ones you should avoid.

## Why nuxt.care?

Choosing the right Nuxt module can be challenging:

- Is it still maintained?
- Does it work with Nuxt 4?
- Are there known security vulnerabilities?
- Is the project abandoned?

nuxt.care answers these questions by analyzing data from multiple sources:

- **Nuxt Modules API** - Official module registry
- **GitHub API** - Repository activity, releases, CI status
- **npm Registry** - Package info, deprecation status, TypeScript support, tests
- **OSV Database** - Known security vulnerabilities

## Features

- **Health Score** - Every module gets a score (0-100) based on quality, maintenance, and security
- **Nuxt 4 Detection** - Multiple sources checked for compatibility
- **Critical Alerts** - Quickly identify problematic modules
- **Maintainer Filter** - Filter by repo owner/organization
- **Favorites** - Save modules you use or want to track
- **Filters & Search** - Find exactly what you need

## Scoring Philosophy

Unlike other tools, nuxt.care focuses on **reliability over popularity**:

- 85% of the score comes from verifiable data (tests, types, CI, vulnerabilities)
- Downloads and stars are shown but don't affect the score
- A solo developer can build a 100-point module

## Open Source

nuxt.care is open source and available on [GitHub](https://github.com/Flo0806/nuxt.care).

Found a bug or have a feature request? [Open an issue](https://github.com/Flo0806/nuxt.care/issues)!
