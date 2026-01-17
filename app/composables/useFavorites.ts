const STORAGE_KEY = 'nuxt.care:favorites'

export function useFavorites() {
  const favorites = ref<string[]>([])

  onMounted(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      favorites.value = JSON.parse(stored)
    }
  })

  function toggleFavorite(moduleName: string) {
    const index = favorites.value.indexOf(moduleName)
    if (index === -1) {
      favorites.value.push(moduleName)
    }
    else {
      favorites.value.splice(index, 1)
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites.value))
  }

  function isFavorite(moduleName: string): boolean {
    return favorites.value.includes(moduleName)
  }

  return {
    favorites,
    toggleFavorite,
    isFavorite,
  }
}
