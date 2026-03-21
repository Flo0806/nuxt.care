// GET /api/stats - Visitor statistics (current + previous month)

export default defineEventHandler(async () => {
  const now = new Date()
  const today = now.toISOString().split('T')[0]

  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const previousMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`

  return {
    total: {
      views: await kv.get<number>('stats:views:total') || 0,
      visitors: await kv.get<number>('stats:visitors:total') || 0,
    },
    currentMonth: {
      period: currentMonth,
      views: await kv.get<number>(`stats:views:month:${currentMonth}`) || 0,
      visitors: await kv.get<number>(`stats:visitors:month:${currentMonth}`) || 0,
    },
    previousMonth: {
      period: previousMonth,
      views: await kv.get<number>(`stats:views:month:${previousMonth}`) || 0,
      visitors: await kv.get<number>(`stats:visitors:month:${previousMonth}`) || 0,
    },
    today: {
      date: today,
      views: await kv.get<number>(`stats:views:day:${today}`) || 0,
      visitors: await kv.get<number>(`stats:visitors:day:${today}`) || 0,
    },
  }
})
