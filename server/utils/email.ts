import { useRuntimeConfig } from '#imports'

interface SendEmailOptions {
  to: string
  subject: string
  htmlContent: string
  textContent?: string
}

export async function sendEmail({ to, subject, htmlContent, textContent }: SendEmailOptions) {
  const config = useRuntimeConfig()

  // Validate API key
  if (!config.brevoApiKey) {
    const error = new Error('BREVO_API_KEY is not configured')
    console.error('[Email] Configuration error:', error.message)
    throw error
  }

  console.log('[Email] Attempting to send email:', {
    to,
    subject,
    hasApiKey: !!config.brevoApiKey,
    apiKeyPrefix: config.brevoApiKey.substring(0, 10) + '...',
  })

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'api-key': config.brevoApiKey,
      },
      body: JSON.stringify({
        sender: { email: 'townsmeet@gmail.com', name: 'QuickMeazure' },
        to: [{ email: to }],
        subject,
        htmlContent,
        textContent: textContent || htmlContent.replace(/<[^>]*>/g, ''),
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      let errorMessage = `Failed to send email: ${response.status} ${response.statusText}`

      try {
        const errorJson = JSON.parse(errorData)
        errorMessage += ` - ${JSON.stringify(errorJson)}`
        console.error('[Email] Brevo API error response:', errorJson)
      } catch {
        errorMessage += ` - ${errorData}`
        console.error('[Email] Brevo API error response (raw):', errorData)
      }

      console.error('[Email] Failed to send email:', {
        to,
        subject,
        status: response.status,
        statusText: response.statusText,
        errorData,
      })

      const error = new Error(errorMessage)
      throw error
    }

    const result = await response.json()
    console.log('[Email] Email sent successfully:', {
      to,
      subject,
      messageId: result.messageId,
    })

    return result
  } catch (error: any) {
    console.error('[Email] Error sending email:', {
      to,
      subject,
      error: error.message,
      stack: error.stack,
    })
    throw error
  }
}
