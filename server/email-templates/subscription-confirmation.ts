export function createSubscriptionConfirmationEmail(
  planName: string,
  billingPeriod: string,
  amount: number,
  userName?: string
) {
  const subject = `Welcome to QuickMeazure ${planName} Plan!`

  const formatAmount = (amount: number) => {
    if (amount === 0) return 'Free'
    return `₦${amount.toLocaleString()}`
  }

  const formatBillingPeriod = (period: string) => {
    return period === 'monthly' ? 'month' : 'year'
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to QuickMeazure ${planName} Plan!</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
        <h1 style="color: #0d9488; margin: 0; font-size: 28px;">QuickMeazure</h1>
      </div>
      
      <h2 style="color: #1f2937; margin-bottom: 20px;">🎉 Welcome to QuickMeazure!</h2>
      
      <p style="margin-bottom: 20px;">Hello${userName ? ` ${userName}` : ''},</p>
      
      <p style="margin-bottom: 20px;">Congratulations! Your subscription to the <strong>${planName}</strong> plan has been successfully activated. You're now ready to take your tailoring business to the next level!</p>
      
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #15803d; margin-top: 0; margin-bottom: 15px;">📋 Subscription Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #374151;">Plan:</td>
            <td style="padding: 8px 0; color: #6b7280;">${planName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #374151;">Billing:</td>
            <td style="padding: 8px 0; color: #6b7280;">${formatBillingPeriod(billingPeriod)}ly</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #374151;">Amount:</td>
            <td style="padding: 8px 0; color: #6b7280;">${formatAmount(amount)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #374151;">Status:</td>
            <td style="padding: 8px 0; color: #059669; font-weight: bold;">Active ✅</td>
          </tr>
        </table>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NUXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/settings/templates" style="background: #0d9488; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Complete Your Setup</a>
      </div>
      
      <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px;">
        <h3 style="color: #1f2937; margin-bottom: 15px;">🚀 What's Next?</h3>
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">
          To get the most out of your QuickMeazure subscription, we recommend completing these setup steps:
        </p>
        <ul style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">
          <li style="margin-bottom: 8px;"><strong>Create measurement templates</strong> - Set up your standard measurement forms</li>
          <li style="margin-bottom: 8px;"><strong>Add your first client</strong> - Start building your customer database</li>
          <li style="margin-bottom: 8px;"><strong>Customize your business profile</strong> - Add your business information</li>
          <li style="margin-bottom: 8px;"><strong>Explore advanced features</strong> - Discover tools to grow your business</li>
        </ul>
        
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="color: #1e40af; font-size: 14px; margin: 0; font-weight: bold;">
            💡 Pro Tip: Complete your setup within the next 7 days to unlock a special bonus guide on growing your tailoring business!
          </p>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">
          Need help? Our support team is here to assist you. Simply reply to this email or visit our help center.
        </p>
        
        <p style="margin-bottom: 0;">
          Welcome to the QuickMeazure family!<br>
          <strong>The QuickMeazure Team</strong>
        </p>
      </div>
    </body>
    </html>
  `

  return { subject, htmlContent }
}
