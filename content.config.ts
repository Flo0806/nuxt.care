import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    docs: defineCollection({
      type: 'page',
      source: 'docs/**/*.md',
      schema: z.object({
        navigation: z.object({
          order: z.number().optional(),
        }).optional(),
      }),
    }),
  },
})
