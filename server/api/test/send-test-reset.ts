import { sendPasswordResetEmail } from '~/utils/email'

export default defineEventHandler(async event => {
  // Skip authentication check for this endpoint
  event.context.auth = { skip: true }

  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not found',
    })
  }

  // Only allow POST requests
  if (getMethod(event) !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed',
    })
  }

  try {
    const body = await readBody(event)

    // Validate required fields
    if (!body.email) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email is required',
      })
    }

    // Create a test reset URL
    const config = useRuntimeConfig()
    const testResetUrl = `${config.public.appUrl}/auth/reset-password?token=test-token-12345`

    // Log the config to help with debugging
    console.log('Runtime config:', {
      appUrl: config.public.appUrl,
      hasBrevoApiKey: !!config.brevoApiKey,
      brevoApiKeyLength: config.brevoApiKey ? config.brevoApiKey.length : 0,
    })

    // Send the test password reset email
    const result = await sendPasswordResetEmail(body.email, testResetUrl)

    console.log('Email sending result:', result)

    return {
      success: true,
      data: {
        success: result.success,
        messageId: result.messageId,
        error: result.error,
      },
    }
  } catch (error: any) {
    console.error('Test reset email error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send test reset email',
      message: error.message || 'Failed to send test reset email',
    }
  }
})
