import { defineEventHandler, createError, getRequestHeaders } from 'h3'
import * as jwt from 'jsonwebtoken'
import { auth } from '../utils/auth'
import { eq } from 'drizzle-orm'
import { db } from '../utils/drizzle'
import * as tables from '../database/schema'
import { randomUUID } from 'crypto'

// Define the token payload type
interface TokenPayload {
  id: string | number
  email?: string
  name?: string
  subscriptionPlan?: string
  subscriptionExpiry?: number | null
  iat?: number
  exp?: number
}

export default defineEventHandler(async event => {
  const path = event.path || ''

  // Only apply auth checks to /api routes, skipping frontend routes entirely
  if (!path.startsWith('/api')) {
    return
  }

  // Skip auth for public API routes
  if (
    path.startsWith('/api/auth') ||
    path.startsWith('/api/public') ||
    path.includes('reset-password') ||
    path === '/api/test/config' ||
    path.startsWith('/api/_nuxt_icon') // Add exception for Nuxt UI icons
  ) {
    return
  }

  // Check if auth should be skipped (for specific endpoints)
  if (event.context.auth?.skip) {
    return
  }

  // Try Better Auth session first
  try {
    const session = await auth.api.getSession(event)
    const sessionUser: any = (session as any)?.user || null
    const email: string | undefined = sessionUser?.email
    const name: string | undefined = sessionUser?.name

    if (email) {
      try {
        // db is already imported
        // Resolve or create a local user mapped by email
        const existing = await db
          .select()
          .from(tables.user)
          .where(eq(tables.user.email, email))
          .limit(1)
          .then(r => r[0])

        let localUser = existing
        if (!localUser) {
          // Create a minimal local user; Better Auth manages auth separately
          const inserted = await db
            .insert(tables.user)
            .values({
              id: randomUUID(),
              name: name || email.split('@')[0],
              email,
              emailVerified: true, // Since they're coming from Better Auth session
            })
            .returning()
          localUser = inserted[0]
        }

        // Populate context
        event.context.auth = { userId: localUser.id, user: { id: localUser.id, email, name } }
        event.context.user = { id: localUser.id, email, name }
        return
      } catch (dbError: any) {
        // Database connection or query error - this is an infrastructure issue
        console.error('Database error during auth check:', dbError)

        // Check if it's a database connection error
        const errorMessage = dbError?.message || String(dbError)
        const isConnectionError =
          errorMessage.includes('SQLITE') ||
          errorMessage.includes('ECONNREFUSED') ||
          errorMessage.includes('ENOTFOUND') ||
          errorMessage.includes('ETIMEDOUT') ||
          errorMessage.includes('database') ||
          errorMessage.includes('connection') ||
          dbError?.code === 'SQLITE_ERROR' ||
          dbError?.code === 'ECONNREFUSED' ||
          dbError?.code === 'ENOTFOUND' ||
          dbError?.code === 'ETIMEDOUT'

        if (isConnectionError) {
          // Return 503 Service Unavailable for infrastructure errors
          throw createError({
            statusCode: 503,
            statusMessage: 'Service temporarily unavailable - database connection error',
            message: 'The service is temporarily unavailable. Please try again later.',
          })
        }

        // For other database errors, still return 503 but log for investigation
        throw createError({
          statusCode: 503,
          statusMessage: 'Service temporarily unavailable',
          message: 'The service is temporarily unavailable. Please try again later.',
        })
      }
    }
    // If session exists but no email, or session is null/undefined, continue to JWT fallback
    // This is normal - not an error, just no Better Auth session
  } catch (authError: any) {
    // Check if this is an infrastructure error from Better Auth
    const errorMessage = authError?.message || String(authError)
    const isInfrastructureError =
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('ENOTFOUND') ||
      errorMessage.includes('ETIMEDOUT') ||
      errorMessage.includes('database') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('SQLITE') ||
      authError?.code === 'ECONNREFUSED' ||
      authError?.code === 'ENOTFOUND' ||
      authError?.code === 'ETIMEDOUT' ||
      authError?.code === 'SQLITE_ERROR' ||
      authError?.statusCode === 503

    // If it's already a 503 error (from database error above), rethrow it
    if (authError?.statusCode === 503) {
      throw authError
    }

    // If it's an infrastructure error, return 503
    if (isInfrastructureError) {
      console.error('Infrastructure error during Better Auth session check:', authError)
      throw createError({
        statusCode: 503,
        statusMessage: 'Service temporarily unavailable - authentication service error',
        message: 'The authentication service is temporarily unavailable. Please try again later.',
      })
    }

    // For other errors (or no session), continue to JWT fallback
    // Better Auth might throw for various reasons, but if it's not infrastructure-related,
    // we should try JWT fallback rather than assuming it's an infrastructure issue
  }

  // If no valid session, check for Authorization header (JWT token)
  const headers = getRequestHeaders(event)
  const authHeader = headers.authorization || ''

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized - Authentication required',
    })
  }

  // Extract token from header
  const token = authHeader.substring(7)

  // Verify JWT token
  try {
    const config = useRuntimeConfig()
    const secret = config.jwtSecret || 'fallback-secret-for-development'
    const decoded = jwt.verify(token, secret) as TokenPayload

    // Set auth context with user ID from token
    event.context.auth = {
      userId: decoded.id,
      user: decoded,
    }
  } catch (error) {
    console.error('JWT verification failed:', error)
    throw createError({
      statusCode: 401,
      message: 'Invalid or expired token',
    })
  }
})
