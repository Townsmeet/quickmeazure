import { db } from '../../../utils/drizzle'

/**
 * Delete a notification
 */
export default defineEventHandler(async event => {
  try {
    // Get notification ID from URL
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Notification ID is required',
      })
    }

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

    // Delete notification
    const deletedNotification = await db
      .delete(tables.notifications)
      .where(and(eq(tables.notifications.id, id), eq(tables.notifications.userId, userId)))
      .returning()

    if (!deletedNotification.length) {
      throw createError({
        statusCode: 404,
        message: 'Notification not found or not owned by user',
      })
    }

    return {
      success: true,
      message: 'Notification deleted successfully',
    }
  } catch (error: any) {
    console.error('Error deleting notification:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: 'An error occurred while deleting notification',
    })
  }
})
