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
[![nuxt.care](https://img.shields.io/endpoint?url=https://nuxt.care/api/v1/badge?module=icon)](https://nuxt.care/?search=icon)
```

**Pinia (by npm package):**
```markdown
[![nuxt.care](https://img.shields.io/endpoint?url=https://nuxt.care/api/v1/badge?package=@pinia/nuxt)](https://nuxt.care/?search=pinia)
```

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
