import bcrypt from 'bcryptjs'
import { useDrizzle, tables, eq } from '../../utils/drizzle'
import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Get the authenticated user
    const user = event.context.user
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized. Please log in.',
      })
    }

    const userId = user.id

    // Get request body
    const { currentPassword, newPassword } = await readBody(event)

    // Validate inputs
    if (!currentPassword || !newPassword) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Current password and new password are required',
      })
    }

    // Validate new password
    if (newPassword.length < 8) {
      throw createError({
        statusCode: 400,
        statusMessage: 'New password must be at least 8 characters long',
      })
    }

    // Check for password complexity
    const hasUppercase = /[A-Z]/.test(newPassword)
    const hasLowercase = /[a-z]/.test(newPassword)
    const hasNumber = /\d/.test(newPassword)
    const hasSpecialChar = /[!@#$%^&*()_+\-={}();':"\\|,.<>/?]/.test(newPassword)

    if (!(hasUppercase && hasLowercase && hasNumber && hasSpecialChar)) {
      throw createError({
        statusCode: 400,
        statusMessage:
          'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character',
      })
    }

    // Get database connection
    const db = await useDrizzle()

    // Get user from database
    const users = await db.select().from(tables.users).where(eq(tables.users.id, userId))

    if (users.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      })
    }

    const userRecord = users[0]

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, userRecord.password)
    if (!isPasswordValid) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Current password is incorrect',
      })
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    // Update password in database
    await db
      .update(tables.users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(tables.users.id, userId))

    return {
      success: true,
      message: 'Password updated successfully',
    }
  } catch (error) {
    console.error('Error changing password:', error)
    throw createError({
      statusCode: 500,
      statusMessage:
        error instanceof Error ? error.message : 'An error occurred while changing password',
    })
  }
})
