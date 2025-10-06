import { useRuntimeConfig } from '#imports'

interface SendEmailOptions {
  to: string
  subject: string
  htmlContent: string
  textContent?: string
}

export async function sendEmail({ to, subject, htmlContent, textContent }: SendEmailOptions) {
  const config = useRuntimeConfig()

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'api-key': config.brevoApiKey,
    },
    body: JSON.stringify({
      sender: { email: 'noreply@quickmeazure.com', name: 'QuickMeazure' },
      to: [{ email: to }],
      subject,
      htmlContent,
      textContent: textContent || htmlContent.replace(/<[^>]*>/g, ''),
    }),
  })

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`Failed to send email: ${response.statusText} - ${errorData}`)
  }

  return response.json()
}
