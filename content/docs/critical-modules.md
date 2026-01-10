---
title: Critical Modules
navigation:
  order: 4
---

# Critical Modules

Nuxamine highlights modules that may pose risks to your project. These are marked as "Critical" and displayed with a warning badge.

## What Makes a Module Critical?

A module is considered critical if **any** of these conditions are true:

### Security Vulnerabilities

- **Critical severity** - CVSS score >= 9.0
- **High severity** - CVSS score >= 7.0

Vulnerabilities are checked against the [OSV database](https://osv.dev/), which aggregates data from multiple sources including npm advisories and GitHub Security Advisories.

### Deprecated

The package is marked as deprecated on npm. This usually means:

- The maintainer recommends using an alternative
- The package has known issues that won't be fixed
- Development has moved to a different package

### Archived

The GitHub repository is archived, meaning:

- No more updates or fixes will be made
- Issues and PRs are closed
- The project is effectively abandoned

### Abandoned

No commits in over 1 year (365 days). This indicates:

- The project may not be actively maintained
- Security issues may not be addressed
- Compatibility with newer Nuxt versions is uncertain

## Using the Critical Filter

You can filter to show only critical modules:

1. **Header Badge** - Click the red "X Critical" badge in the header
2. **Filter Button** - Use the "Critical" toggle in the toolbar

This helps you:

- Audit modules in your current project
- Identify modules to avoid in new projects
- Find alternatives for problematic dependencies

## Recommendations

When you encounter a critical module:

1. **Check the specific issue** - Is it a vulnerability, deprecation, or abandonment?
2. **Look for alternatives** - Search for similar modules with better scores
3. **Assess the risk** - A deprecated module might still work fine for your use case
4. **Consider forking** - For critical functionality, you might maintain your own fork

::callout{type="warning"}
Not all critical modules are unusable. A module might be "complete" and not need updates, or a vulnerability might not affect your use case. Always evaluate the specific situation.
::
