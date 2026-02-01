---
title: Health Badge
navigation:
  order: 6
---

# Health Badge

Add a nuxt.care health badge to your module's README to show its quality score.

::callout{type="warning"}
**Important Update:** The Badge API has moved to `/api/v1/badge`. The old `/api/badge/{module}` endpoint is **deprecated** and will be removed in a future version. Please update your badges!
::

## Quick Start

Add this to your README.md:

```markdown
[![nuxt.care](https://img.shields.io/endpoint?url=https://nuxt.care/api/v1/badge?module=YOUR-MODULE)](https://nuxt.care/?search=YOUR-MODULE)
```

Replace `YOUR-MODULE` with your module's name as shown on nuxt.care.

## Examples

**Nuxt Icon:**
```markdown
[![nuxt.care](https://img.shields.io/endpoint?url=https://nuxt.care/api/v1/badge?module=icon)](https://nuxt.care/?search=npm:@nuxt/icon)
```

**Pinia (by npm package):**
```markdown
[![nuxt.care](https://img.shields.io/endpoint?url=https://nuxt.care/api/v1/badge?package=@pinia/nuxt)](https://nuxt.care/?search=npm:@pinia/nuxt)
```

## Search Parameter

Use `search=npm:PACKAGE` to link directly to a module by its exact npm package name:

| Search | Result |
|--------|--------|
| `?search=npm:@nuxt/icon` | Exact match for `@nuxt/icon` |
| `?search=npm:@pinia/nuxt` | Exact match for `@pinia/nuxt` |
| `?search=icon` | Fuzzy search, may return multiple results |

The `npm:` prefix ensures the link goes directly to the correct module.

## URL Encoding for shields.io

::callout{type="warning"}
**Important:** shields.io requires the entire `url` parameter to be URL-encoded!
::

When using the `package` parameter with scoped packages (like `@nuxt/ui`), you must encode the URL:

| Character | Encoded |
|-----------|---------|
| `@` | `%40` |
| `/` | `%2F` |
| `:` | `%3A` |
| `?` | `%3F` |
| `&` | `%26` |
| `=` | `%3D` |

**Example for @nuxt/ui:**

Unencoded (won't work in shields.io):
```
https://nuxt.care/api/v1/badge?package=@nuxt/ui
```

Encoded (correct):
```
https%3A%2F%2Fnuxt.care%2Fapi%2Fv1%2Fbadge%3Fpackage%3D%40nuxt%2Fui
```

Full badge markdown:
```markdown
[![nuxt.care](https://img.shields.io/endpoint?url=https%3A%2F%2Fnuxt.care%2Fapi%2Fv1%2Fbadge%3Fpackage%3D%40nuxt%2Fui)](https://nuxt.care/?search=npm:@nuxt/ui)
```

Use an [online URL encoder](https://www.urlencoder.org/) to encode your URLs.

## API Reference

### Endpoint

```
GET https://nuxt.care/api/v1/badge
```

### Query Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `module` | * | Module name as shown on nuxt.care |
| `package` | * | npm package name (alternative to module) |
| `mode` | | `score` (default) = "85/100", `status` = "stable" |

\* Either `module` or `package` is required.

### Response

```json
{
  "schemaVersion": 1,
  "label": "nuxt.care",
  "message": "85/100",
  "color": "green"
}
```

### Colors & Status

| Score | Color | Status |
|-------|-------|--------|
| 90+ | brightgreen | optimal |
| 70-89 | green | stable |
| 40-69 | yellow | degraded |
| <40 | red | critical |

## Display Modes

**Score (default):** Shows numeric score
```
/api/v1/badge?module=icon → "85/100"
```

**Status:** Shows status label
```
/api/v1/badge?module=icon&mode=status → "stable"
```

## Badge Styles

Customize with shields.io parameters:

```markdown
<!-- Flat (default) -->
![](https://img.shields.io/endpoint?url=https://nuxt.care/api/v1/badge?module=icon)

<!-- Flat square -->
![](https://img.shields.io/endpoint?url=https://nuxt.care/api/v1/badge?module=icon&style=flat-square)

<!-- For the badge -->
![](https://img.shields.io/endpoint?url=https://nuxt.care/api/v1/badge?module=icon&style=for-the-badge)
```

See [shields.io styles](https://shields.io/badges/endpoint-badge) for more options.

---

## Migration from Old API

::callout{type="error"}
**DEPRECATED:** `/api/badge/{module}` is deprecated and will be removed!
::

If you're using the old format, update your badges:

| Old (deprecated) | New |
|------------------|-----|
| `/api/badge/icon` | `/api/v1/badge?module=icon` |
| `/api/badge/pinia` | `/api/v1/badge?module=pinia` |
| `/api/badge/@pinia/nuxt` | `/api/v1/badge?package=@pinia/nuxt` |

**Before:**
```markdown
![](https://img.shields.io/endpoint?url=https://nuxt.care/api/badge/icon)
```

**After:**
```markdown
![](https://img.shields.io/endpoint?url=https://nuxt.care/api/v1/badge?module=icon)
```
