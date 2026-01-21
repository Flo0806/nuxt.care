<p align="center">
  <img src="public/images/nuxt.care-logo.svg" alt="nuxt.care Logo" width="200">
</p>

<h1 align="center">nuxt.care</h1>

<p align="center">
  <strong>Health-Check & Audit Tool for Nuxt Modules</strong><br>
  Find out which modules are well-maintained, Nuxt 4 compatible, and which ones to avoid.
</p>

<p align="center">
  <a href="#health-badge-for-your-module">Badge</a> •
  <a href="#features">Features</a> •
  <a href="#how-scoring-works">Scoring</a> •
  <a href="#setup">Setup</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#support">Support</a>
</p>

<p align="center">
  <a href="https://github.com/Flo0806/nuxt.care/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/Flo0806/nuxt.care/ci.yml?style=flat&label=CI" alt="CI Status"></a>
  <a href="https://github.com/Flo0806/nuxt.care"><img src="https://img.shields.io/github/stars/Flo0806/nuxt.care?style=flat&logo=github" alt="GitHub Stars"></a>
  <a href="https://github.com/Flo0806/nuxt.care/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue?style=flat" alt="MIT License"></a>
  <a href="https://www.buymeacoffee.com/flo0806"><img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=flat&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me A Coffee"></a>
</p>

---

## Health Badge for Your Module

Show your module's health score in your README:

```markdown
[![nuxt.care health](https://img.shields.io/endpoint?url=https://nuxt.care/api/badge/YOUR-MODULE)](https://nuxt.care/?search=YOUR-MODULE)
```

Replace `YOUR-MODULE` with your npm package name (e.g., `nuxt-icon`, `@nuxt/image`).

**Example:**

[![nuxt.care health](https://img.shields.io/endpoint?url=https://nuxt.care/api/badge/nuxt-icon)](https://nuxt.care/?search=nuxt-icon)

---

## Features

- **Health Scoring** - Transparent 0-100 score based on reliable data
- **Security Audit** - Vulnerability detection via OSV database
- **Nuxt 4 Compatibility** - Check if modules are ready for Nuxt 4
- **Maintenance Status** - See pending commits, release freshness, CI status
- **Smart Filters** - Filter by category, type, compatibility, quality metrics
- **Favorites** - Track modules you care about
- **Health Badge** - Add a quality badge to your module's README
- **Auto-Sync** - Automatic data refresh every 8 hours

## How Scoring Works

nuxt.care calculates a **Risk/Quality Score** from 0-100. This is **not** a popularity contest - we focus on reliability, maintenance, and compatibility.

### Philosophy

- **85% of the score** comes from **reliable, verifiable data** (tests, types, CI, vulnerabilities)
- **15%** comes from weaker signals (Nuxt 4 compatibility indicators)
- Downloads and stars are shown but **don't affect the score** - a solo dev can build great modules

### Score Breakdown

| Category | Points | How it's calculated |
|----------|--------|---------------------|
| **Security** | 15 | No known vulnerabilities = 15 points |
| **Trust** | 5 | Official module = 5, Community = 3, 3rd-party = 0 |
| **Quality** | 30 | Tests (12) + TypeScript (10) + License (5) + CI passing (3) |
| **Maintenance** | 35 | Publish freshness (20) + All changes released (15) |
| **Nuxt 4** | 15 | Multiple compatibility signals = 15, one signal = 10 |

**Total: 100 points maximum**

### Quality Details

| Check | Points | What we look for |
|-------|--------|------------------|
| Has tests | 12 | `test` script in package.json |
| TypeScript | 10 | `types`/`typings` field or `typescript` in devDeps |
| License | 5 | License file in repo |
| CI passing | 3 | GitHub Actions with successful last run |

### Maintenance Details

| Check | Points | Criteria |
|-------|--------|----------|
| **Freshness** | 0-20 | |
| Published < 90 days | 20 | Very active |
| Published < 1 year | 12 | Active |
| Published > 1 year | 5 | Stale (but see "Stable & Done") |
| **Release Status** | 0-15 | |
| All changes released | 15 | No unreleased commits since last tag |
| Pending but active | 8 | Has pending commits, but recent activity |
| Pending commits | 3 | Has unreleased changes |
| Abandoned | 0 | Pending commits + no activity > 1 year |

### Nuxt 4 Compatibility

We check multiple sources for Nuxt 4 compatibility:
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

### Penalties (Deal Breakers)

These subtract from your score and can push it below zero:

| Issue | Penalty | Why |
|-------|---------|-----|
| Deprecated | -50 | Package author says don't use it |
| Critical vulnerabilities | -40 | Known security issues |
| Archived | -30 | No longer maintained |
| High vulnerabilities | -20 | Serious security concerns |

### Stable & Done Exception

Some modules are "done" - they work perfectly and don't need updates. Old doesn't mean bad!

A module gets the **Stable & Done** bonus (15 instead of 5 for freshness) if:
- Published > 1 year ago, **but**:
  - All changes released (no pending commits)
  - < 10 open issues
  - No known vulnerabilities
  - CI passing (or no CI)

### Score Interpretation

| Score | Meaning |
|-------|---------|
| 90-100 | Excellent - well maintained, high quality |
| 70-89 | Good - safe to use, minor concerns |
| 50-69 | Caution - review the signals before using |
| < 50 | Warning - significant issues, consider alternatives |

### What's NOT in the Score

These are shown as info but don't affect scoring:
- **Downloads** - Popular ≠ Good
- **Stars** - GitHub stars don't mean quality
- **Contributors** - One person can build great things

## Setup

```bash
# Clone
git clone https://github.com/Flo0806/nuxt.care.git
cd nuxt.care

# Install
pnpm install

# Configure
cp .env.example .env
# Add your GitHub token: NUXT_GITHUB_TOKEN=ghp_xxx

# Run
pnpm dev
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NUXT_GITHUB_TOKEN` | GitHub PAT for API access (module sync) | Yes |
| `NUXT_OAUTH_GITHUB_CLIENT_ID` | GitHub OAuth App Client ID | For login |
| `NUXT_OAUTH_GITHUB_CLIENT_SECRET` | GitHub OAuth App Client Secret | For login |
| `NUXT_SESSION_PASSWORD` | Session encryption key (min 32 chars) | For login |
| `NUXT_SYNC_LIMIT` | Limit modules for dev (0 = all) | No |

#### GitHub OAuth Setup (optional)

To enable "Login with GitHub" and starring:

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set callback URL to `http://localhost:3000/auth/github` (dev) or your domain
4. Copy Client ID and Client Secret to `.env`

## Tech Stack

- **[Nuxt 4](https://nuxt.com)** - Vue framework
- **[NuxtHub](https://hub.nuxt.com)** - KV storage
- **[Nuxt UI v3](https://ui.nuxt.com)** - Component library
- **[Tailwind CSS v4](https://tailwindcss.com)** - Styling

## Data Sources

- [Nuxt Modules API](https://api.nuxt.com/modules) - Module list & metadata
- [npm Registry](https://registry.npmjs.org) - Package info, publish dates
- [GitHub API](https://api.github.com) - Repo stats, CI status, releases
- [OSV Database](https://osv.dev) - Known vulnerabilities

## Support

nuxt.care is **free and open source**. If it helps you make better decisions about your Nuxt modules, consider supporting development:

<a href="https://www.buymeacoffee.com/flo0806" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="40"></a>

## License

MIT
