import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['test/unit/**/*.{test,spec}.ts'],
          environment: 'node',
          alias: {
            '~~': fileURLToPath(new URL('./', import.meta.url)),
            '~': fileURLToPath(new URL('./', import.meta.url)),
          },
        },
      },
      await defineVitestProject({
        // Workaround: https://github.com/nuxt/test-utils/issues/1490
        resolve: {
          alias: { 'bun:test': fileURLToPath(new URL('./vitest.config.ts', import.meta.url)) },
        },
        test: {
          name: 'nuxt',
          include: ['test/nuxt/**/*.{test,spec}.ts'],
          environment: 'nuxt',
          environmentOptions: {
            nuxt: {
              rootDir: fileURLToPath(new URL('.', import.meta.url)),
              domEnvironment: 'happy-dom',
            },
          },
        },
      }),
      await defineVitestProject({
        // Workaround: https://github.com/nuxt/test-utils/issues/1490
        resolve: {
          alias: { 'bun:test': fileURLToPath(new URL('./vitest.config.ts', import.meta.url)) },
        },
        test: {
          name: 'integration',
          include: ['test/integration/**/*.{test,spec}.ts'],
          testTimeout: 60000, // Build + server startup takes time
          environmentOptions: {
            nuxt: {
              rootDir: fileURLToPath(new URL('.', import.meta.url)),
            },
          },
        },
      }),
    ],
    coverage: {
      provider: 'v8',
      include: ['server/utils/**/*.ts', 'app/composables/**/*.ts', 'app/components/**/*.vue'],
      exclude: ['**/*.d.ts'],
      reporter: ['text', 'html'],
    },
  },
})
