---
title: Nuxt 4 Detection
navigation:
  order: 3
---

# Nuxt 4 Detection

Nuxamine checks multiple sources to determine if a module supports Nuxt 4.

## Detection Sources

We check 4 different sources for Nuxt 4 compatibility signals:

1. **Nuxt API Compatibility String**
2. **GitHub Topics**
3. **npm Keywords**
4. **Release Notes**

## Compatibility String Logic

The Nuxt Modules API provides a compatibility string (e.g., `^3.0.0`, `>=3.0.0`). We parse this using semver rules:

| String | Nuxt 4? | Reason |
|--------|---------|--------|
| `^3.0.0` | No | Semver caret = `>=3.0.0 <4.0.0` |
| `>=3.0.0` | Yes | Open-ended, includes 4.x |
| `>=3.0.0 <4.0.0` | No | Explicitly excludes 4 |
| `^4` or `>=4` | Yes | Explicitly requires Nuxt 4 |
| `*` | Yes | Wildcard matches everything |

::callout{type="info"}
**Why `^3.0.0` means Nuxt 3 only:**

In semver, the caret (`^`) allows changes that don't modify the left-most non-zero digit. So `^3.0.0` means `>=3.0.0 <4.0.0` - it locks the major version.
::

## GitHub Topics

We look for these topics on the repository:

- `nuxt4` or `nuxt-4` → Nuxt 4 confirmed
- `nuxt3` or `nuxt-3` → Nuxt 3 (no Nuxt 4 signal)

## npm Keywords

Package keywords are checked for:

- `nuxt4` or `nuxt-4` → Nuxt 4 confirmed
- `nuxt3` or `nuxt-3` → Nuxt 3 only

## Release Notes

Recent releases (last 5) are scanned for mentions of "Nuxt 4" in:

- Release title
- Release body/description

## Result Display

In the UI, modules show compatibility badges:

- **Nuxt 4** (green) - Confirmed Nuxt 4 support
- **Nuxt 3** (blue) - Nuxt 3 only, no Nuxt 4 signal
- **Compat?** (gray) - Unknown, no clear signals

::callout{type="warning"}
**Note:** The absence of Nuxt 4 signals doesn't mean a module won't work with Nuxt 4. Many modules are compatible but haven't updated their metadata yet.
::

## Future Improvements

The Nuxt team is working on a new API format ([PR #1353](https://github.com/nuxt/modules/pull/1353)) that will provide explicit version arrays like `"nuxt": [3, 4]`. When this lands, detection will be more reliable.
