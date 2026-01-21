import pkg from './package.json'

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
    'nuxt-auth-utils',
  ],

  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    github: {
      token: '',
    },
    oauth: {
      github: {
        clientId: '',
        clientSecret: '',
        redirectURL: '',
      },
    },
    session: {
      password: '',
    },
    public: {
      version: pkg.version,
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
    prerender: {
      crawlLinks: false,
      routes: ['/docs'],
      failOnError: false,
      ignore: ['/auth/**', '/__nuxt_content/**'],
    },
  },

  hub: {
    kv: true,
  },

  content: {
    database: {
      type: 'sqlite',
      binding: false,
    },
    build: {
      markdown: {
        highlight: false,
      },
    },
  },

  routeRules: {
    '/docs/**': { prerender: true },
  },

  eslint: {
    config: {
      stylistic: true,
    },
  },
})
