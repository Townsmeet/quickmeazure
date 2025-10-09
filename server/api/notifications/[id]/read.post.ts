import { db } from '../../../utils/drizzle'

/**
 * Mark a notification as read
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

    // Update notification
    const updatedNotification = await db
      .update(tables.notifications)
      .set({
        read: true,
        updatedAt: new Date(),
      })
      .where(and(eq(tables.notifications.id, id), eq(tables.notifications.userId, userId)))
      .returning()

    if (!updatedNotification.length) {
      throw createError({
        statusCode: 404,
        message: 'Notification not found or not owned by user',
      })
    }

    return {
      success: true,
      data: updatedNotification[0],
    }
  } catch (error: any) {
    console.error('Error marking notification as read:', error)

    if (error.statusCode) {
      throw error
    }

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'An error occurred while marking notification as read',
      message: 'An error occurred while marking notification as read',
    }
  }
})
