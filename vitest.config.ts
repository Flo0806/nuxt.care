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
    ],
    coverage: {
      provider: 'v8',
      include: ['server/utils/**/*.ts', 'app/composables/**/*.ts', 'app/components/**/*.vue'],
      exclude: ['**/*.d.ts'],
      reporter: ['text', 'html'],
    },
  },
})
