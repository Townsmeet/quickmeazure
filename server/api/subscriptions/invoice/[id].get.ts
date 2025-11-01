import { defineEventHandler, createError, getRouterParam, setHeader } from 'h3'
import { db } from '../../../utils/drizzle'
import * as tables from '../../../database/schema'
import { eq, and } from 'drizzle-orm'

/**
 * Generate and download invoice for a payment
 */
export default defineEventHandler(async event => {
  try {
    // Get authenticated user from event context
    const auth = event.context.auth
    if (!auth || !auth.userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      })
    }

    const paymentId = getRouterParam(event, 'id')

    if (!paymentId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Payment ID is required',
      })
    }

    const userId = auth.userId

    // Get the payment details
    const payment = await db
      .select()
      .from(tables.subscriptionPayments)
      .where(
        and(
          eq(tables.subscriptionPayments.id, parseInt(paymentId)),
          eq(tables.subscriptionPayments.userId, String(userId))
        )
      )
      .limit(1)

    if (!payment || payment.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Payment not found',
      })
    }

    const paymentData = payment[0]

    // Get subscription details
    let subscription = null
    if (paymentData.subscriptionId) {
      const subResult = await db
        .select()
        .from(tables.subscriptions)
        .where(eq(tables.subscriptions.id, paymentData.subscriptionId))
        .limit(1)

      if (subResult.length > 0) {
        subscription = subResult[0]
      }
    }

    // Get user details
    const user = await db
      .select()
      .from(tables.user)
      .where(eq(tables.user.id, String(userId)))
      .limit(1)

    if (!user || user.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      })
    }

    // Generate invoice HTML
    const invoiceHtml = generateInvoiceHtml({
      payment: paymentData,
      subscription,
      user: user[0],
    })

    // Set headers for PDF download
    setHeader(event, 'Content-Type', 'text/html')
    setHeader(event, 'Content-Disposition', `inline; filename="invoice-${paymentData.id}.html"`)

    return invoiceHtml
  } catch (error) {
    console.error('Error generating invoice:', error)

    if (error.statusCode) {
      throw error
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate invoice',
      message: 'Failed to generate invoice',
    }
  }
})

function generateInvoiceHtml({ payment, subscription, user }: any): string {
  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date))
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price)
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice #${payment.id}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .company-name { font-size: 24px; font-weight: bold; color: #333; }
        .invoice-title { font-size: 20px; margin: 20px 0; }
        .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .invoice-table th, .invoice-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .invoice-table th { background-color: #f8f9fa; font-weight: bold; }
        .total-row { font-weight: bold; background-color: #f8f9fa; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">QuickMeazure</div>
        <div>Professional Measurement Management</div>
      </div>

      <div class="invoice-title">Invoice #${payment.id}</div>

      <div class="invoice-details">
        <div>
          <strong>Bill To:</strong><br>
          ${user.name || 'N/A'}<br>
          ${user.email}
        </div>
        <div>
          <strong>Invoice Date:</strong> ${formatDate(payment.createdAt)}<br>
          <strong>Payment Status:</strong> ${payment.status.toUpperCase()}<br>
          ${payment.reference ? `<strong>Reference:</strong> ${payment.reference}` : ''}
        </div>
      </div>

      <table class="invoice-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Period</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${payment.description || 'Subscription Payment'}</td>
            <td>${subscription ? `${formatDate(subscription.startDate)} - ${formatDate(subscription.endDate || new Date())}` : 'N/A'}</td>
            <td>${formatPrice(payment.amount)}</td>
          </tr>
          <tr class="total-row">
            <td colspan="2"><strong>Total</strong></td>
            <td><strong>${formatPrice(payment.amount)}</strong></td>
          </tr>
        </tbody>
      </table>

      <div class="footer">
        <p>Thank you for your business!</p>
        <p>This is a computer-generated invoice. No signature required.</p>
      </div>
    </body>
    </html>
  `
}
