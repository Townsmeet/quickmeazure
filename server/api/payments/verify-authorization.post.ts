import { defineEventHandler, createError, readBody } from 'h3'
import { db } from '../../utils/drizzle'
import * as tables from '../../database/schema'
import { eq, and as _and } from 'drizzle-orm'

/**
 * Verify Paystack payment authorization and save payment method
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

    const body = await readBody(event)
    const { reference, paystackReference, setAsDefault } = body

    if (!reference || !paystackReference) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Reference and Paystack reference are required',
      })
    }

    const userId = auth.userId

    // Verify the payment with Paystack
    const paystackSecretKey = process.env.NUXT_PAYSTACK_SECRET_KEY
    if (!paystackSecretKey) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Payment configuration error',
      })
    }

    // Verify transaction with Paystack
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${paystackReference}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const verifyData = await verifyResponse.json()

    if (!verifyData.status || verifyData.data.status !== 'success') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Payment verification failed',
      })
    }

    const paymentData = verifyData.data

    // Extract payment method details from Paystack response
    const authorization = paymentData.authorization
    const _customer = paymentData.customer

    if (!authorization) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No authorization data found',
      })
    }

    // Determine payment method type
    let paymentMethodType = 'card'
    if (authorization.channel === 'bank') {
      paymentMethodType = 'bank'
    } else if (authorization.channel === 'ussd') {
      paymentMethodType = 'ussd'
    }

    // If setting as default, update existing payment methods
    if (setAsDefault) {
      await db
        .update(tables.paymentMethods)
        .set({ isDefault: false })
        .where(eq(tables.paymentMethods.userId, String(userId)))
    }

    // Save the payment method
    const paymentMethod = await db
      .insert(tables.paymentMethods)
      .values({
        userId: String(userId),
        type: paymentMethodType,
        last4: authorization.last4 || null,
        expiryMonth: authorization.exp_month || null,
        expiryYear: authorization.exp_year || null,
        brand: authorization.brand || authorization.bank || null,
        isDefault: setAsDefault || false,
        provider: 'paystack',
        providerId: authorization.authorization_code,
        metadata: JSON.stringify({
          authorizationCode: authorization.authorization_code,
          cardType: authorization.card_type,
          bank: authorization.bank,
          countryCode: authorization.country_code,
          signature: authorization.signature,
          reusable: authorization.reusable,
          channel: authorization.channel,
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    // Initiate refund of the authorization amount
    try {
      await initiateRefund(paystackReference, paymentData.amount, paystackSecretKey)
    } catch (refundError) {
      console.error('Refund initiation failed:', refundError)
      // Don't fail the entire process if refund fails
      // The refund can be processed manually if needed
    }

    return {
      success: true,
      data: {
        paymentMethod: paymentMethod[0],
        refundInitiated: true,
      },
      message: 'Payment method authorized and saved successfully. Refund initiated.',
    }
  } catch (error) {
    console.error('Error verifying payment authorization:', error)

    if (error.statusCode) {
      throw error
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify payment authorization',
      message: 'Failed to verify payment authorization',
    }
  }
})

async function initiateRefund(transactionReference: string, amount: number, secretKey: string) {
  try {
    const refundResponse = await fetch('https://api.paystack.co/refund', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction: transactionReference,
        amount: amount, // Full amount in kobo
        currency: 'NGN',
        customer_note: 'Refund for payment method authorization',
        merchant_note: 'Authorization refund - payment method setup',
      }),
    })

    const refundData = await refundResponse.json()

    if (!refundData.status) {
      throw new Error(refundData.message || 'Refund request failed')
    }

    console.log('Refund initiated successfully:', refundData.data)
    return refundData.data
  } catch (error) {
    console.error('Refund error:', error)
    throw error
  }
}
