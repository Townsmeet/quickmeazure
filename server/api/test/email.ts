import { sendEmail } from '~/utils/email'

export default defineEventHandler(async event => {
  // Skip authentication check for this endpoint
  event.context.auth = { skip: true }

  // Get the config (properly handled in server context)
  const config = useRuntimeConfig()

  // Check if this is a development environment
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

  // Check if Brevo API key is configured
  if (!config.brevoApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Email service not configured: BREVO_API_KEY is missing',
    })
  }

  try {
    const body = await readBody(event)

    // Validate required fields
    if (!body.to || !body.subject || !body.html) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Required fields: to, subject, html',
      })
    }

    // Format email recipient
    const to = typeof body.to === 'string' ? [{ email: body.to }] : body.to

    // Send the test email
    const result = await sendEmail({
      to,
      subject: body.subject,
      htmlContent: body.html,
      textContent: body.text || body.html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
    })

    return {
      success: true,
      data: {
        success: result.success,
        messageId: result.messageId,
      },
    }
  } catch (error: any) {
    console.error('Test email error:', error)
    if (error.statusCode) {
      throw error
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send test email',
      message: 'Failed to send test email',
    }
  }
})
