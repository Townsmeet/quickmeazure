import { defineEventHandler, getMethod, readBody, createError } from 'h3'
import { auth } from '../../utils/auth'

// Create a route that will handle user login with credentials
export default defineEventHandler(async event => {
  // Get the HTTP method
  const method = getMethod(event)

  // Handle POST requests (login)
  if (method === 'POST') {
    try {
      // Delegate to Better Auth email/password sign-in
      // Body should include { email, password }
      const body = await readBody(event)
      if (!body?.email || !body?.password) {
        throw createError({ statusCode: 400, message: 'Email and password are required' })
      }
      const result = await auth.api.signInWithPassword(event)
      return result
    } catch (error: any) {
      console.error('Auth error:', error)
      throw createError({
        statusCode: error.statusCode || 500,
        message: error.message || 'Authentication failed',
      })
    }
  }

  // Handle GET requests (get current session)
  else if (method === 'GET') {
    const session = await auth.api.getSession(event)
    return session || { user: null }
  }

  // Handle DELETE requests (logout)
  else if (method === 'DELETE') {
    await auth.api.signOut(event)
    return { success: true }
  }

  // Handle other methods
  else {
    throw createError({
      statusCode: 405,
      message: 'Method not allowed',
    })
  }
})
