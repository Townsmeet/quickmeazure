import { eq } from 'drizzle-orm'
import { db } from '../../utils/drizzle'
import * as tables from '../../database/schema'

export default defineEventHandler(async event => {
  // Skip authentication check for this endpoint
  event.context.auth = { skip: true }

  // Only available in development mode
  if (process.env.NODE_ENV !== 'development') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not found',
    })
  }

  // Only allow GET requests
  if (getMethod(event) !== 'GET') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed',
    })
  }

  try {
    // db is already imported
    const query = getQuery(event)

    // Validate required fields
    if (!query.email) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email is required',
      })
    }

    // Get user from database
    const userResults = await db
      .select()
      .from(tables.user)
      .where(eq(tables.user.email, query.email.toString().toLowerCase()))

    return {
      userExists: userResults.length > 0,
      email: query.email,
      userCount: userResults.length,
    }
  } catch (error: any) {
    console.error('Check user error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to check user',
    })
  }
})
