import { calculateVersionScore, toSlimResponse } from '../../utils/version-score'

// GET /api/v1/score?package=@pinia/nuxt&version=2.0.0
// GET /api/v1/score?package=@pinia/nuxt&version=2.0.0&slim=true

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const pkg = query.package as string | undefined
  const version = query.version as string | undefined
  const slim = query.slim === 'true'

  if (!pkg) {
    throw createError({
      statusCode: 400,
      message: 'Missing required parameter: package',
    })
  }

  if (!version) {
    throw createError({
      statusCode: 400,
      message: 'Missing required parameter: version',
    })
  }

  const result = await calculateVersionScore(pkg, version)

  if (!result) {
    throw createError({
      statusCode: 404,
      message: `Package or version not found: ${pkg}@${version}`,
    })
  }

  if (slim) {
    return toSlimResponse(result)
  }

  return result
})
