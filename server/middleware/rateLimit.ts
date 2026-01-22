// Simple in-memory rate limiting for API v1
// Note: Resets on server restart, not distributed across instances

const requests = new Map<string, { count: number, reset: number }>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of requests) {
    if (now > entry.reset) {
      requests.delete(ip)
    }
  }
}, 5 * 60 * 1000)

export default defineEventHandler((event) => {
  // Only rate limit /api/v1/
  if (!event.path.startsWith('/api/v1')) return

  const ip = getRequestIP(event) || 'unknown'
  const now = Date.now()
  const window = 60_000 // 1 minute
  const limit = 60 // 60 requests per minute

  const entry = requests.get(ip)

  if (!entry || now > entry.reset) {
    requests.set(ip, { count: 1, reset: now + window })
    return
  }

  entry.count++

  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.reset - now) / 1000)
    setResponseHeader(event, 'Retry-After', retryAfter)
    throw createError({
      statusCode: 429,
      message: 'Too Many Requests - limit 60/min',
    })
  }
})
