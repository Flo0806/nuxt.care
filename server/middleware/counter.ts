// Visitor counter - tracks page views and unique visitors
// Bots are detected and excluded from counts

const BOT_PATTERNS = [
  /bot/i, /crawl/i, /spider/i, /slurp/i, /feed/i,
  /googlebot/i, /bingbot/i, /yandex/i, /baidu/i,
  /facebookexternalhit/i, /twitterbot/i, /linkedinbot/i,
  /whatsapp/i, /telegrambot/i, /discordbot/i,
  /applebot/i, /duckduckbot/i, /semrush/i, /ahrefs/i,
  /mj12bot/i, /dotbot/i, /petalbot/i, /bytespider/i,
  /gptbot/i, /claudebot/i, /anthropic/i, /chatgpt/i,
  /headless/i, /phantom/i, /selenium/i, /puppeteer/i,
  /lighthouse/i, /pagespeed/i, /pingdom/i, /uptimerobot/i,
]

function isBot(userAgent: string | undefined): boolean {
  if (!userAgent) return true
  return BOT_PATTERNS.some(pattern => pattern.test(userAgent))
}

function hashIP(ip: string): string {
  let hash = 0
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

export default defineEventHandler(async (event) => {
  // Only count page requests, not API calls or assets
  const path = getRequestURL(event).pathname
  if (path.startsWith('/api/') || path.startsWith('/_') || path.includes('.')) {
    return
  }

  const userAgent = getHeader(event, 'user-agent')
  if (isBot(userAgent)) return

  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Increment raw view counters
  const total = await kv.get<number>('stats:views:total') || 0
  const dayViews = await kv.get<number>(`stats:views:day:${today}`) || 0
  const monthViews = await kv.get<number>(`stats:views:month:${month}`) || 0
  await kv.set('stats:views:total', total + 1)
  await kv.set(`stats:views:day:${today}`, dayViews + 1)
  await kv.set(`stats:views:month:${month}`, monthViews + 1)

  // Unique visitor counting via hashed IP
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const ipHash = hashIP(ip)

  const alreadyToday = await kv.get(`stats:ip:day:${today}:${ipHash}`)
  if (!alreadyToday) {
    await kv.set(`stats:ip:day:${today}:${ipHash}`, true)
    const dayVisitors = await kv.get<number>(`stats:visitors:day:${today}`) || 0
    await kv.set(`stats:visitors:day:${today}`, dayVisitors + 1)
  }

  const alreadyMonth = await kv.get(`stats:ip:month:${month}:${ipHash}`)
  if (!alreadyMonth) {
    await kv.set(`stats:ip:month:${month}:${ipHash}`, true)
    const monthVisitors = await kv.get<number>(`stats:visitors:month:${month}`) || 0
    await kv.set(`stats:visitors:month:${month}`, monthVisitors + 1)
  }

  const alreadyEver = await kv.get(`stats:ip:total:${ipHash}`)
  if (!alreadyEver) {
    await kv.set(`stats:ip:total:${ipHash}`, true)
    const totalVisitors = await kv.get<number>('stats:visitors:total') || 0
    await kv.set('stats:visitors:total', totalVisitors + 1)
  }
})
