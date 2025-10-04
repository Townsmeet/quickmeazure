import { defineEventHandler, createError, getRequestHeader } from 'h3'
import {
  generatePaymentReminders,
  generateSubscriptionExpirationAlerts,
  generateUsageLimitWarnings,
  cleanupExpiredNotifications,
} from '../../services/notificationService'
import { verifyToken } from '../../utils/auth'

export default defineEventHandler(async event => {
  try {
    // Get the authorization header
    const authHeader = getRequestHeader(event, 'authorization')
    const token = authHeader?.split(' ')[1] // Get the token part from 'Bearer <token>'

    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'No authentication token provided',
      })
    }

    // Verify the token
    const decoded = await verifyToken(token)

    if (!decoded) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'Invalid or expired authentication token',
      })
    }

    // Check if user is an admin
    // Note: You may need to adjust this based on how admin status is stored in your token
    if (decoded.role !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        message: 'You do not have permission to access this endpoint',
      })
    }

    const startTime = Date.now()

    // Clean up expired notifications first
    await cleanupExpiredNotifications()

    // Generate all types of notifications
    const paymentReminders = await generatePaymentReminders()
    const expirationAlerts = await generateSubscriptionExpirationAlerts()
    const usageWarnings = await generateUsageLimitWarnings()

    const totalTime = Date.now() - startTime

    // Return the results
    return {
      success: true,
      paymentReminders: paymentReminders.count,
      expirationAlerts: expirationAlerts.count,
      usageWarnings: usageWarnings.count,
      totalTime,
      message: 'Notifications generated successfully',
    }
  } catch (error) {
    console.error('Error generating notifications:', error)

    return {
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Failed to generate notifications',
      error: error.message,
    }
  }
})
