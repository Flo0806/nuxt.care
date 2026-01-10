---
title: Nuxamine
navigation:
  order: 1
---

# Nuxamine

**Nuxt + Examine = Nuxamine**

A health-check and audit tool for Nuxt modules. Nuxamine helps you discover which modules are actively maintained, Nuxt 4 compatible, and which ones you should avoid.

## Why Nuxamine?

Choosing the right Nuxt module can be challenging:

- Is it still maintained?
- Does it work with Nuxt 4?
- Are there known security vulnerabilities?
- Is the project abandoned?

Nuxamine answers these questions by analyzing data from multiple sources:

- **Nuxt Modules API** - Official module registry
- **GitHub API** - Repository activity, contributors, releases, CI status
- **npm Registry** - Package info, deprecation status, TypeScript support, tests
- **OSV Database** - Known security vulnerabilities

## Features

- **Health Score** - Every module gets a score (0-100) based on 10 criteria
- **Nuxt 4 Detection** - Multiple sources checked for compatibility
- **Critical Alerts** - Quickly identify problematic modules
- **Favorites** - Save modules you use or want to track
- **Filters & Search** - Find exactly what you need

## Open Source

Nuxamine is open source and available on [GitHub](https://github.com/Flo0806/nuxamine).

Found a bug or have a feature request? [Open an issue](https://github.com/Flo0806/nuxamine/issues)!
