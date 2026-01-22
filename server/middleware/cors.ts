// CORS headers for API v1 (needed for Nuxt Devtools access from localhost)

export default defineEventHandler((event) => {
  // Only apply to /api/v1/
  if (!event.path.startsWith('/api/v1')) return

  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*',
    'Access-Control-Allow-Headers': '*',
  })

  // Handle preflight requests
  if (event.method === 'OPTIONS') {
    event.node.res.statusCode = 204
    event.node.res.end()
    return
  }
})
