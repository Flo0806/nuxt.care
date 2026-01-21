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
[![nuxt.care health](https://img.shields.io/endpoint?url=https://nuxt.care/api/badge/YOUR-MODULE-NAME)](https://nuxt.care/?search=YOUR-MODULE-NAME)
```

Replace `YOUR-MODULE-NAME` with your module's name (e.g., `nuxt-icon`, `@nuxt/image`).

The badge links to your module on nuxt.care when clicked.

## Example

For the `nuxt-icon` module:

```markdown
[![nuxt.care health](https://img.shields.io/endpoint?url=https://nuxt.care/api/badge/nuxt-icon)](https://nuxt.care/?search=nuxt-icon)
```

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

## Finding Your Module Name

Your module name is the same as shown on nuxt.care. You can use either:

- The module name (e.g., `icon`)
- The npm package name (e.g., `nuxt-icon` or `@nuxt/image`)

## Badge Styles

You can customize the badge style using shields.io parameters:

```markdown
<!-- Flat style (default) -->
![health](https://img.shields.io/endpoint?url=https://nuxt.care/api/badge/nuxt-icon)

<!-- Flat square -->
![health](https://img.shields.io/endpoint?url=https://nuxt.care/api/badge/nuxt-icon&style=flat-square)

<!-- For the badge -->
![health](https://img.shields.io/endpoint?url=https://nuxt.care/api/badge/nuxt-icon&style=for-the-badge)

<!-- Plastic -->
![health](https://img.shields.io/endpoint?url=https://nuxt.care/api/badge/nuxt-icon&style=plastic)
```

See [shields.io styles](https://shields.io/badges/endpoint-badge) for more options.
