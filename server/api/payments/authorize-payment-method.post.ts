import { defineEventHandler, createError, readBody } from 'h3'
import { db as _db } from '../../utils/drizzle'
import * as _tables from '../../database/schema'
import { eq as _eq } from 'drizzle-orm'

/**
 * Initialize Paystack payment authorization for adding payment method
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
    const { email, name, phone, paymentType, setAsDefault } = body

    if (!email || !name) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email and name are required',
      })
    }

    const userId = auth.userId

    // Generate a unique reference for this authorization
    const reference = `auth_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Get Paystack public key from environment
    const publicKey = process.env.NUXT_PAYSTACK_PUBLIC_KEY
    if (!publicKey) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Payment configuration error',
      })
    }

    // Store the authorization request in database for verification later
    // You might want to create a separate table for this, but for now we'll use metadata
    const authRequest = {
      userId,
      email,
      name,
      phone,
      paymentType,
      setAsDefault,
      reference,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    // For demo purposes, we'll store this in a simple way
    // In production, you might want a dedicated table for payment authorizations
    console.log('Payment authorization request:', authRequest)

    return {
      success: true,
      data: {
        reference,
        publicKey,
        email,
        amount: 5000, // ₦50 in kobo
        currency: 'NGN',
      },
      message: 'Payment authorization initialized successfully',
    }
  } catch (err) {
    console.error('Error initializing payment authorization:', err)

    const error = err as Error & { statusCode?: number }

    if (error.statusCode) {
      throw error
    }

    return {
      success: false,
      error: error.message || 'Failed to initialize payment authorization',
      message: 'Failed to initialize payment authorization',
    }
  }
})
