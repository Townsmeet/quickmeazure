import { db } from '../../utils/drizzle'
import * as tables from '../../database/schema'

/**
 * Get all notifications for the authenticated user
 */
export default defineEventHandler(async event => {
  try {
    // Get user from auth token
    const headers = getRequestHeaders(event)
    const authHeader = headers.authorization || ''

    if (!authHeader) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized - No token provided',
      })
    }

    // Extract token
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader

    if (!token) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized - Empty token',
      })
    }

    // Verify token
    const decoded = await verifyToken(token)
    if (!decoded || !decoded.id) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized - Invalid token',
      })
    }

    const userId = decoded.id

    // Get notifications for the user
    const notifications = await db.query.notifications.findMany({
      where: eq(tables.notifications.userId, userId),
      orderBy: [desc(tables.notifications.createdAt)],
      limit: 50, // Limit to most recent 50 notifications
    })

    return {
      success: true,
      notifications,
    }
  } catch (error: any) {
    console.error('Error fetching notifications:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: 'An error occurred while fetching notifications',
    })
  }
})
