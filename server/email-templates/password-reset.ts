export function createPasswordResetEmail(resetUrl: string, userName?: string) {
  const subject = 'Reset your QuickMeazure password'
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset your QuickMeazure password</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
        <h1 style="color: #0d9488; margin: 0; font-size: 28px;">QuickMeazure</h1>
      </div>
      
      <h2 style="color: #1f2937; margin-bottom: 20px;">Reset your password</h2>
      
      <p style="margin-bottom: 20px;">Hello${userName ? ` ${userName}` : ''},</p>
      
      <p style="margin-bottom: 20px;">You requested to reset your password for your QuickMeazure account. Click the button below to create a new password:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background: #0d9488; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      
      <p style="margin-bottom: 20px;">If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p style="word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 14px;">${resetUrl}</p>
      
      <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px;">
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">
          <strong>Security note:</strong> If you didn't request this password reset, please ignore this email. Your account remains secure.
        </p>
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">
          This link will expire in 1 hour for your security.
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
