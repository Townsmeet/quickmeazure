import { useDrizzle, tables, eq } from '../../utils/drizzle'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'

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

  // Only allow POST requests
  if (getMethod(event) !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed',
    })
  }

  try {
    const db = useDrizzle()
    const body = await readBody(event)

    // Validate required fields
    if (!body.email) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email is required',
      })
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(tables.user)
      .where(eq(tables.user.email, body.email.toLowerCase()))

    if (existingUser.length > 0) {
      return {
        message: 'User already exists',
        userId: existingUser[0].id,
        email: existingUser[0].email,
        name: existingUser[0].name,
      }
    }

    // Create user for Better Auth (no password field in user table)
    const newUser = {
      id: uuidv4(),
      name: body.name || 'Test User',
      email: body.email.toLowerCase(),
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Insert user
    const [insertedUser] = await db.insert(tables.user).values(newUser).returning()

    return {
      message: 'Test user created successfully',
      userId: insertedUser.id,
      email: insertedUser.email,
      name: insertedUser.name,
    }
  } catch (error: any) {
    console.error('Create test user error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to create test user',
    })
  }
})
