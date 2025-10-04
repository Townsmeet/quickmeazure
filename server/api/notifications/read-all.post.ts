import { useDrizzle, tables, eq } from '../../utils/drizzle'
import { verifyToken } from '../../utils/auth'

/**
 * Mark all notifications as read for the authenticated user
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

    // Get database instance
    const db = useDrizzle()

    // Update all unread notifications for the user
    await db
      .update(tables.notifications)
      .set({
        read: true,
        updatedAt: new Date(),
      })
      .where(eq(tables.notifications.userId, userId))

    return {
      success: true,
      message: 'All notifications marked as read',
    }
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: 'An error occurred while marking all notifications as read',
    })
  }
})
