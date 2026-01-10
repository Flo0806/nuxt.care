---
title: Features
navigation:
  order: 5
---

# Features

An overview of all Nuxamine features.

## Dashboard

The main dashboard shows:

- **Nuxt 4 Readiness Chart** - Distribution of Nuxt 4 compatible modules
- **Security Status Chart** - Overview of vulnerability status across modules
- **Health Distribution Chart** - Score distribution visualization

## Module Cards

Each module card displays:

- **Name & Health Score** - Module name with color-coded score badge
- **Category** - Module category with icon
- **Version** - Latest npm version
- **TypeScript** - TS badge if types are included
- **Stats** - Downloads, stars, contributors, activity, vulnerabilities, size
- **Quality Row** - Tests status, CI status, pending commits
- **Quick Links** - Direct links to GitHub and npm
- **License** - SPDX license identifier
- **Status Badges** - Official, Nuxt 4/3, Stale, Archived, Deprecated, Vulnerabilities

## Module Details

Click a module card to open the detail slideover with:

- **Header** - Name, category, type, TypeScript, version, license, size
- **Description** - Module description
- **Install Commands** - Copy-ready commands for nuxt, pnpm, npm, yarn
- **Statistics** - Downloads, stars, forks, open issues, contributors
- **Activity** - Last commit, last release
- **Compatibility** - Nuxt API compat string and interpretation
- **Quality** - Tests, CI status, pending commits with details
- **Health Signals** - All scoring criteria with individual points
- **External Links** - GitHub, npm

## Filtering & Sorting

### Search

Type to filter by module name, description, npm package name, or repo.

### Sort Options

- **Score (High)** - Health score descending (default)
- **Score (Low)** - Health score ascending (find modules that need attention)
- **Downloads** - npm download count
- **Stars** - GitHub stars
- **Activity** - Most recently updated
- **Name** - Alphabetical

### Dropdown Filters

- **Category** - Filter by module category (e.g., UI, Database, Auth)
- **Type** - Official, Community, 3rd Party
- **Compatibility** - Nuxt 4, Nuxt 3 only, Unknown
- **Maintainer** - Filter by repo owner/org (searchable dropdown with all owners)

### Toggle Filters

- **Critical** - Show only critical modules (vulnerabilities, deprecated, abandoned)
- **Favorites** - Show only favorited modules

### Chip Filters

Quick filters for common criteria:

**Quality - Positive:**
- Has Tests
- TypeScript
- CI Passing
- No Vulns

**Quality - Needs Attention:**
- No Tests
- No TypeScript
- CI Failing
- Has Vulns

**Popularity:**
- 100+ Stars
- 1K+ Stars
- 10K+ Downloads

**Score:**
- Score 70+
- Score < 50

## Favorites

Click the heart icon on any module to save it as a favorite. Favorites are stored in your browser's local storage.

## Pagination

Modules are displayed 12 per page with pagination controls at the bottom.

## Data Sync

Module data is synced from various APIs:

- **Automatic** - Every 8 hours via cron job
- **On Startup** - If no data exists or last sync was >8 hours ago
- **Manual** - POST to `/api/sync?force=true`

The sync status is shown in the header, including:

- Last sync time (e.g., "Updated 2h ago")
- Sync in progress indicator with count
