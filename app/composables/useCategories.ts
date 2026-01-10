export interface CategoryConfig {
  label: string
  icon: string
  color: string
}

// Known Nuxt module categories with icons and colors
const categoryConfig: Record<string, CategoryConfig> = {
  'AI': { label: 'AI', icon: 'i-lucide-sparkles', color: 'violet' },
  'Analytics': { label: 'Analytics', icon: 'i-lucide-bar-chart-3', color: 'blue' },
  'CMS': { label: 'CMS', icon: 'i-lucide-file-text', color: 'amber' },
  'CSS': { label: 'CSS', icon: 'i-lucide-palette', color: 'pink' },
  'Database': { label: 'Database', icon: 'i-lucide-database', color: 'emerald' },
  'Devtools': { label: 'Devtools', icon: 'i-lucide-wrench', color: 'orange' },
  'Ecommerce': { label: 'Ecommerce', icon: 'i-lucide-shopping-cart', color: 'green' },
  'Extensions': { label: 'Extensions', icon: 'i-lucide-puzzle', color: 'purple' },
  'Fonts': { label: 'Fonts', icon: 'i-lucide-type', color: 'slate' },
  'Images': { label: 'Images', icon: 'i-lucide-image', color: 'cyan' },
  'Libraries': { label: 'Libraries', icon: 'i-lucide-library', color: 'slate' },
  'Monitoring': { label: 'Monitoring', icon: 'i-lucide-activity', color: 'red' },
  'Payment': { label: 'Payment', icon: 'i-lucide-credit-card', color: 'emerald' },
  'Performance': { label: 'Performance', icon: 'i-lucide-zap', color: 'yellow' },
  'Request': { label: 'Request', icon: 'i-lucide-globe', color: 'blue' },
  'Security': { label: 'Security', icon: 'i-lucide-shield', color: 'red' },
  'SEO': { label: 'SEO', icon: 'i-lucide-search', color: 'green' },
  'UI': { label: 'UI', icon: 'i-lucide-layout', color: 'indigo' },
}

// Fallback for unknown categories
const defaultConfig: CategoryConfig = {
  label: 'Other',
  icon: 'i-lucide-box',
  color: 'neutral',
}

// Track warned categories to avoid spam
const warnedCategories = new Set<string>()

/**
 * Get category config by name (logs warning for unknown categories)
 */
export function getCategoryConfig(category: string): CategoryConfig {
  if (categoryConfig[category]) {
    return categoryConfig[category]
  }

  // Log warning for unknown category (once per category)
  if (!warnedCategories.has(category)) {
    console.warn(`[useCategories] Unknown category: "${category}" - please add to categoryConfig`)
    warnedCategories.add(category)
  }

  return { ...defaultConfig, label: category }
}

/**
 * Get category icon
 */
export function getCategoryIcon(category: string): string {
  return getCategoryConfig(category).icon
}

/**
 * Get category color
 */
export function getCategoryColor(category: string): string {
  return getCategoryConfig(category).color
}

/**
 * Check if category is known
 */
export function isKnownCategory(category: string): boolean {
  return category in categoryConfig
}

/**
 * Build category options from actual module data (dynamic)
 */
export function buildCategoryOptions(
  categoriesFromData: string[],
  includeAll = true,
): Array<{ label: string, value: string, icon: string }> {
  const uniqueCategories = [...new Set(categoriesFromData)].sort()

  const options = uniqueCategories.map((cat) => {
    const config = getCategoryConfig(cat)
    return {
      label: config.label,
      value: cat,
      icon: config.icon,
    }
  })

  if (includeAll) {
    return [{ label: 'All Categories', value: 'all', icon: 'i-lucide-layers' }, ...options]
  }

  return options
}
