export default defineEventHandler(async event => {
  // Skip authentication check for this endpoint
  event.context.auth = { skip: true }

  // Only available in development mode
  if (process.env.NODE_ENV !== 'development') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not found',
    })
  }

  // Get runtime config
  const config = useRuntimeConfig()

  // Check API keys (mask sensitive parts)
  const hasBrevoApiKey = !!config.brevoApiKey
  const brevoApiKeyPrefix = config.brevoApiKey ? config.brevoApiKey.substring(0, 10) + '...' : null

  return {
    success: true,
    data: {
      environment: process.env.NODE_ENV,
      appUrl: config.public.appUrl,
      hasBrevoApiKey,
      brevoApiKeyPrefix,
      brevoApiKeyLength: config.brevoApiKey ? config.brevoApiKey.length : 0,
    },
  }
})
