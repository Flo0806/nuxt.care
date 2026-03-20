import { getModuleHistory, getLatestDiff, diffBetweenDates } from '../../utils/history'

// GET /api/v1/history?module=pinia                          - full history
// GET /api/v1/history?module=pinia&days=30                  - last 30 days
// GET /api/v1/history?module=pinia&from=2026-01-01&to=2026-03-01  - date range
// GET /api/v1/history?module=pinia&diff=true                - latest diff (yesterday vs today)
// GET /api/v1/history?module=pinia&diff=2026-03-01,2026-03-19  - diff between two dates

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const moduleName = query.module as string | undefined

  if (!moduleName) {
    throw createError({ statusCode: 400, message: 'Missing ?module= parameter' })
  }

  const diff = query.diff as string | undefined
  const days = query.days ? Number(query.days) : undefined
  const from = query.from as string | undefined
  const to = query.to as string | undefined

  // Diff between two specific dates
  if (diff && diff !== 'true') {
    const [dateA, dateB] = diff.split(',')
    if (!dateA || !dateB) {
      throw createError({ statusCode: 400, message: 'diff must be "true" or "YYYY-MM-DD,YYYY-MM-DD"' })
    }
    // Need full history to find the dates
    const history = await getModuleHistory(moduleName)
    if (!history) {
      throw createError({ statusCode: 404, message: `No history for module: ${moduleName}` })
    }
    const result = diffBetweenDates(history, dateA, dateB)
    return { moduleName, from: dateA, to: dateB, diff: result }
  }

  const history = await getModuleHistory(moduleName, { days, from, to })
  if (!history) {
    throw createError({ statusCode: 404, message: `No history for module: ${moduleName}` })
  }

  // Latest diff
  if (diff === 'true') {
    const result = getLatestDiff(history)
    return { moduleName, diff: result }
  }

  return history
})
