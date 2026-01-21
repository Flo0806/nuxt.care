---
title: Health Badge
navigation:
  order: 6
---

# Health Badge

Add a nuxt.care health badge to your module's README to show its quality score.

## Usage

Add this to your README.md:

```markdown
[![nuxt.care health](https://img.shields.io/endpoint?url=https://nuxt.care/api/badge/YOUR-MODULE)](https://nuxt.care/?search=YOUR-MODULE)
```

Replace `YOUR-MODULE` with your module's name as shown on nuxt.care (the card title).

The badge links to your module on nuxt.care when clicked.

## Example

For Nuxt UI:

```markdown
[![nuxt.care health](https://img.shields.io/endpoint?url=https://nuxt.care/api/badge/ui)](https://nuxt.care/?search=ui)
```

For Nuxt Icon:

```markdown
[![nuxt.care health](https://img.shields.io/endpoint?url=https://nuxt.care/api/badge/icon)](https://nuxt.care/?search=icon)
```

## Finding Your Module Name

Use the **module name as shown on nuxt.care** (the title on the module card):

| Module | Badge URL |
|--------|-----------|
| Nuxt UI | `/api/badge/ui` |
| Nuxt Icon | `/api/badge/icon` |
| Nuxt Image | `/api/badge/image` |
| Pinia | `/api/badge/pinia` |

## Badge Colors

The badge color reflects the health score:

| Score | Color |
|-------|-------|
| 80-100 | Green |
| 60-79 | Light Green |
| 40-59 | Yellow |
| 20-39 | Orange |
| 0-19 | Red |

## API Endpoint

The badge data comes from:

```
GET https://nuxt.care/api/badge/{module-name}
```

Response (shields.io endpoint schema):

```json
{
  "schemaVersion": 1,
  "label": "nuxt.care",
  "message": "85/100",
  "color": "brightgreen"
}
```

## Badge Styles

You can customize the badge style using shields.io parameters:

```markdown
<!-- Flat style (default) -->
![health](https://img.shields.io/endpoint?url=https://nuxt.care/api/badge/icon)

<!-- Flat square -->
![health](https://img.shields.io/endpoint?url=https://nuxt.care/api/badge/icon&style=flat-square)

<!-- For the badge -->
![health](https://img.shields.io/endpoint?url=https://nuxt.care/api/badge/icon&style=for-the-badge)

<!-- Plastic -->
![health](https://img.shields.io/endpoint?url=https://nuxt.care/api/badge/icon&style=plastic)
```

See [shields.io styles](https://shields.io/badges/endpoint-badge) for more options.
