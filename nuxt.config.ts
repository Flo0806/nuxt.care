// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/a11y',
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/test-utils',
    '@nuxt/ui',
    '@nuxthub/core',
  ],

  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    github: {
      token: '',
    },
  },
  compatibilityDate: '2025-07-15',

  nitro: {
    experimental: {
      tasks: true,
    },
    scheduledTasks: {
      // Every 8 hours: 0:00, 8:00, 16:00
      '0 */8 * * *': ['sync:modules'],
    },
  },

  hub: {
    kv: true,
    database: true,
  },

  eslint: {
    config: {
      stylistic: true,
    },
  },
})
