import SibApiV3Sdk from 'sib-api-v3-sdk'

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

    // Get runtime config
    const config = useRuntimeConfig()
    console.log('Config loaded:', !!config)
    console.log('Brevo API key available:', !!config.brevoApiKey)
    console.log(
      'API key preview:',
      config.brevoApiKey
        ? `${config.brevoApiKey.substring(0, 10)}...${config.brevoApiKey.substring(config.brevoApiKey.length - 5)}`
        : 'Not available'
    )

    try {
      // Initialize API directly
      console.log('Initializing Brevo API directly')
      const defaultClient = SibApiV3Sdk.ApiClient.instance

      // Configure API key authorization
      const apiKey = defaultClient.authentications['api-key']
      apiKey.apiKey = config.brevoApiKey

      // Create API instance
      const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi()
      console.log('API instance created')

      // Create send email object
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail()

      // Configure the email
      sendSmtpEmail.subject = 'Direct Test Email'
      sendSmtpEmail.htmlContent =
        '<html><body><h1>This is a direct test email</h1><p>This email was sent directly using the Brevo API without going through our utilities.</p></body></html>'
      sendSmtpEmail.sender = {
        name: 'QuickMeazure Test',
        email: 'townsmeet@gmail.com',
      }
      sendSmtpEmail.to = [{ email: body.email }]

      console.log('Email configured, attempting to send to:', body.email)

      // Send the email
      const result = await apiInstance.sendTransacEmail(sendSmtpEmail)
      console.log('Email sent successfully:', result)

      return {
        success: true,
        data: {
          message: 'Direct test email sent successfully',
          messageId: result.messageId,
        },
      }
    } catch (apiError: any) {
      console.error('API Error:', apiError)

      // Try to extract response details
      if (apiError.response && apiError.response.text) {
        try {
          const responseBody = JSON.parse(apiError.response.text)
          console.error('API Response:', responseBody)

          return { success: false, error: apiError.message, data: { apiResponse: responseBody } }
        } catch (_e) {
          console.error('Raw API Response:', apiError.response.text)

          return {
            success: false,
            error: apiError.message,
            data: { apiResponseRaw: apiError.response.text },
          }
        }
      }

      return { success: false, error: apiError.message || 'Unknown API error' }
    }
  } catch (error: any) {
    console.error('General error:', error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send direct test email',
      message: error.message || 'Failed to send direct test email',
    }
  }
})
