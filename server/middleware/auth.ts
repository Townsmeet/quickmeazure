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
    }
  } catch {
    // ignore and continue to JWT fallback
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
