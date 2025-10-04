import SibApiV3Sdk from 'sib-api-v3-sdk'

// Define API error interface for better type safety
interface _ApiError extends Error {
  response?: {
    text?: string
  }
  stack?: string
}

// Initialize SIB API instance
function getApiInstance() {
  try {
    const config = useRuntimeConfig()

    if (!config.brevoApiKey) {
      console.error('Brevo API key is missing from configuration')
      throw new Error('API key configuration error')
    }

    console.log(
      'Initializing Brevo API with key:',
      `${config.brevoApiKey.substring(0, 10)}...${config.brevoApiKey.substring(config.brevoApiKey.length - 5)}`
    )

    // Initialize the API client
    const defaultClient = SibApiV3Sdk.ApiClient.instance

    // Configure API key authorization: api-key
    const apiKey = defaultClient.authentications['api-key']
    apiKey.apiKey = config.brevoApiKey

    console.log('Brevo API client initialized successfully')

    // Create the API instance
    return new SibApiV3Sdk.TransactionalEmailsApi()
  } catch (error) {
    console.error('Error initializing Brevo API:', error)
    throw error
  }
}

/**
 * Send a transactional email using Brevo (formerly Sendinblue)
 */
export async function sendEmail({
  to,
  subject,
  htmlContent,
  textContent,
  fromName = 'QuickMeazure',
  fromEmail = 'townsmeet@gmail.com',
  replyTo = 'townsmeet@gmail.com',
}: {
  to: { email: string; name?: string }[]
  subject: string
  htmlContent: string
  textContent?: string
  fromName?: string
  fromEmail?: string
  replyTo?: string
}) {
  try {
    const config = useRuntimeConfig()

    console.log('SendEmail: Starting email send process')
    console.log('SendEmail: Recipients:', JSON.stringify(to))

    if (!config.brevoApiKey) {
      console.error('SendEmail ERROR: BREVO_API_KEY environment variable is not set')
      throw new Error('Email service configuration error')
    }

    console.log(
      `SendEmail: API Key available (${config.brevoApiKey.substring(0, 10)}...${config.brevoApiKey.substring(config.brevoApiKey.length - 5)})`
    )
    console.log(`SendEmail: Sending to ${to.map(r => r.email).join(', ')}`)

    try {
      const apiInstance = getApiInstance()

      console.log('SendEmail: API instance created, configuring email')
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail()

      sendSmtpEmail.subject = subject
      sendSmtpEmail.htmlContent = htmlContent

      if (textContent) {
        sendSmtpEmail.textContent = textContent
      }

      sendSmtpEmail.sender = {
        name: fromName,
        email: fromEmail,
      }

      sendSmtpEmail.to = to

      sendSmtpEmail.replyTo = {
        email: replyTo,
        name: fromName,
      }

      console.log('SendEmail: Email configuration complete')
      console.log('SendEmail: Sender:', JSON.stringify(sendSmtpEmail.sender))
      console.log('SendEmail: Subject:', sendSmtpEmail.subject)
      console.log('SendEmail: Attempting to send email now...')

      const result = await apiInstance.sendTransacEmail(sendSmtpEmail)
      console.log('SendEmail: SUCCESS!', result)
      return { success: true, messageId: result.messageId }
    } catch (apiError: _ApiError) {
      console.error('SendEmail: API Error:', apiError)
      console.error('SendEmail: Error message:', apiError.message)

      if (apiError.response && apiError.response.text) {
        try {
          const responseBody = JSON.parse(apiError.response.text)
          console.error('SendEmail: API Response:', responseBody)
        } catch {
          console.error('SendEmail: API Response (raw):', apiError.response.text)
        }
      }

      if (apiError.stack) {
        console.error('SendEmail: Stack trace:', apiError.stack)
      }

      return { success: false, error: apiError }
    }
  } catch (error: any) {
    console.error('SendEmail: General error:', error)
    console.error('SendEmail: Error message:', error.message)

    if (error.stack) {
      console.error('SendEmail: Stack trace:', error.stack)
    }

    return { success: false, error }
  }
}

/**
 * Send a welcome email to a new user
 */
export async function sendWelcomeEmail(userName: string, userEmail: string) {
  const subject = 'Welcome to QuickMeazure!'

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4f46e5;">Welcome to QuickMeazure!</h1>
      <p>Hello ${userName},</p>
      <p>Thank you for signing up with QuickMeazure. We're excited to have you on board!</p>
      <p>With QuickMeazure, you can:</p>
      <ul>
        <li>Manage client measurements efficiently</li>
        <li>Create and organize different style options</li>
        <li>Track orders and their progress</li>
        <li>Organize your tailoring business in one place</li>
      </ul>
      <p>If you have any questions or need assistance, feel free to contact our support team at <a href="mailto:townsmeet@gmail.com">townsmeet@gmail.com</a>.</p>
      <p>Best regards,<br>The QuickMeazure Team</p>
    </div>
  `

  const textContent = `
Welcome to QuickMeazure!

Hello ${userName},

Thank you for signing up with QuickMeazure. We're excited to have you on board!

With QuickMeazure, you can:
- Manage client measurements efficiently
- Create and organize different style options
- Track orders and their progress
- Organize your tailoring business in one place

If you have any questions or need assistance, feel free to contact our support team at townsmeet@gmail.com.

Best regards,
The QuickMeazure Team
  `

  return sendEmail({
    to: [{ email: userEmail, name: userName }],
    subject,
    htmlContent,
    textContent,
  })
}

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  console.log('sendPasswordResetEmail: Starting to send password reset email to', email)
  console.log('sendPasswordResetEmail: Reset URL:', resetUrl)

  // Generate HTML content with reset link
  const htmlContent = `
  <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #4a6cf7;">QuickMeazure</h1>
        </div>
        <div style="background-color: #f9f9f9; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">Password Reset</h2>
          <p>We received a request to reset your password. Please click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #4a6cf7; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
          </div>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
          <p>This link will expire in 1 hour for security reasons.</p>
        </div>
        <div style="text-align: center; color: #888; font-size: 12px;">
          <p>© ${new Date().getFullYear()} QuickMeazure. All rights reserved.</p>
        </div>
      </div>
    </body>
  </html>
  `

  // Generate plain text content as a fallback
  const textContent = `
  QuickMeazure - Password Reset

  We received a request to reset your password. Please follow the link below to create a new password:
  
  ${resetUrl}
  
  If you didn't request a password reset, you can safely ignore this email.
  
  This link will expire in 1 hour for security reasons.

  © ${new Date().getFullYear()} QuickMeazure. All rights reserved.
  `

  try {
    console.log('sendPasswordResetEmail: Preparing to call sendEmail function')

    // Use the direct approach (similar to our test endpoint)
    const config = useRuntimeConfig()

    if (!config.brevoApiKey) {
      console.error('sendPasswordResetEmail: BREVO_API_KEY not set')
      return { success: false, error: 'API key configuration error' }
    }

    try {
      // Initialize API directly
      console.log('sendPasswordResetEmail: Initializing Brevo API directly')
      const defaultClient = SibApiV3Sdk.ApiClient.instance

      // Configure API key authorization
      const apiKey = defaultClient.authentications['api-key']
      apiKey.apiKey = config.brevoApiKey

      // Create API instance
      const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi()

      // Create send email object
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail()

      // Configure the email
      sendSmtpEmail.subject = 'Reset Your QuickMeazure Password'
      sendSmtpEmail.htmlContent = htmlContent
      sendSmtpEmail.textContent = textContent
      sendSmtpEmail.sender = {
        name: 'QuickMeazure',
        email: 'townsmeet@gmail.com',
      }
      sendSmtpEmail.to = [{ email }]

      console.log('sendPasswordResetEmail: Email configured, attempting to send to:', email)

      // Send the email
      const result = await apiInstance.sendTransacEmail(sendSmtpEmail)
      console.log('sendPasswordResetEmail: Email sent successfully:', result)

      return { success: true, messageId: result.messageId }
    } catch (apiError: _ApiError) {
      console.error('sendPasswordResetEmail: API Error:', apiError.message)

      if (apiError.response && apiError.response.text) {
        try {
          const responseBody = JSON.parse(apiError.response.text)
          console.error('sendPasswordResetEmail: API Response:', responseBody)
        } catch {
          console.error('sendPasswordResetEmail: Raw Response:', apiError.response.text)
        }
      }

      return { success: false, error: apiError }
    }
  } catch (error: any) {
    console.error('sendPasswordResetEmail: General error:', error.message)
    return { success: false, error }
  }
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(
  userName: string,
  userEmail: string,
  orderNumber: string,
  orderDetails: {
    client: string
    items: { name: string; price: number }[]
    total: number
    dueDate: string
  }
) {
  const subject = `Order Confirmation #${orderNumber}`

  const itemsList = orderDetails.items
    .map(
      item =>
        `<tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₦${item.price.toLocaleString()}</td>
    </tr>`
    )
    .join('')

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4f46e5;">Order Confirmation</h1>
      <p>Hello ${userName},</p>
      <p>Thank you for your order! We've received your order for <strong>${orderDetails.client}</strong> and it's being processed.</p>
      
      <h2>Order Details</h2>
      <p><strong>Order Number:</strong> #${orderNumber}</p>
      <p><strong>Due Date:</strong> ${orderDetails.dueDate}</p>
      
      <h3>Items</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
          <th style="padding: 8px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
        </tr>
        ${itemsList}
        <tr>
          <td style="padding: 8px; font-weight: bold;">Total</td>
          <td style="padding: 8px; font-weight: bold; text-align: right;">₦${orderDetails.total.toLocaleString()}</td>
        </tr>
      </table>
      
      <p>You can track the status of your order in the QuickMeazure dashboard.</p>
      <p>If you have any questions about your order, please contact us at <a href="mailto:townsmeet@gmail.com">townsmeet@gmail.com</a>.</p>
      
      <p>Best regards,<br>The QuickMeazure Team</p>
    </div>
  `

  const textContent = `
Order Confirmation #${orderNumber}

Hello ${userName},

Thank you for your order! We've received your order for ${orderDetails.client} and it's being processed.

Order Details:
Order Number: #${orderNumber}
Due Date: ${orderDetails.dueDate}

Items:
${orderDetails.items.map(item => `- ${item.name}: ₦${item.price.toLocaleString()}`).join('\n')}

Total: ₦${orderDetails.total.toLocaleString()}

You can track the status of your order in the QuickMeazure dashboard.

If you have any questions about your order, please contact us at townsmeet@gmail.com.

Best regards,
The QuickMeazure Team
  `

  return sendEmail({
    to: [{ email: userEmail, name: userName }],
    subject,
    htmlContent,
    textContent,
  })
}
