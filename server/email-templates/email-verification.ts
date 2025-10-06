export function createEmailVerificationEmail(verificationUrl: string, userName?: string) {
  const subject = 'Verify your QuickMeazure email address'
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify your QuickMeazure email address</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
        <h1 style="color: #0d9488; margin: 0; font-size: 28px;">QuickMeazure</h1>
      </div>
      
      <h2 style="color: #1f2937; margin-bottom: 20px;">Welcome to QuickMeazure!</h2>
      
      <p style="margin-bottom: 20px;">Hello${userName ? ` ${userName}` : ''},</p>
      
      <p style="margin-bottom: 20px;">Thank you for signing up for QuickMeazure! To complete your registration and start managing your tailor business, please verify your email address by clicking the button below:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="background: #0d9488; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email Address</a>
      </div>
      
      <p style="margin-bottom: 20px;">If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p style="word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 14px;">${verificationUrl}</p>
      
      <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px;">
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">
          <strong>What's next?</strong> Once verified, you'll be able to:
        </p>
        <ul style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">
          <li>Add and manage your clients</li>
          <li>Create measurement templates</li>
          <li>Track orders and payments</li>
          <li>Grow your tailor business</li>
        </ul>
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">
          This verification link will expire in 24 hours for your security.
        </p>
        <p style="margin-bottom: 0;">
          Best regards,<br>
          <strong>The QuickMeazure Team</strong>
        </p>
      </div>
    </body>
    </html>
  `
  return { subject, htmlContent }
}
