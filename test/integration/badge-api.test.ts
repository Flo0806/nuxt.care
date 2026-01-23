import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('Badge API Integration', async () => {
  // Start actual Nuxt server before tests
  await setup({
    server: true,
    build: true, // Build first for stability
  })

  it('returns 400 without package or module param', async () => {
    try {
      await $fetch('/api/v1/badge')
      expect.fail('Should have thrown')
    }
    catch (error) {
      expect((error as { statusCode: number }).statusCode).toBe(400)
    }
  })

  it('returns shields.io schema for valid module', async () => {
    // Note: This needs actual data in KV - might fail if no data synced
    const response = await $fetch('/api/v1/badge?module=pinia')

    expect(response).toMatchObject({
      schemaVersion: 1,
      label: 'nuxt.care',
    })
    expect(response.message).toBeDefined()
    expect(response.color).toBeDefined()
  })
})
