// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/a11y',
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
  },

  hub: {
    kv: true,
  },

  eslint: {
    config: {
      stylistic: true,
    },
  },
})
