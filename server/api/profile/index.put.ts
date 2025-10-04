import { eq } from 'drizzle-orm'
import * as bcrypt from 'bcryptjs'
import { db } from '~/server/database'
import { users } from '~/server/database/schema'

export default defineEventHandler(async event => {
  try {
    const auth = event.context.auth
    if (!auth || !auth.userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      })
    }

    const body = await readBody(event)
    const {
      name,
      email,
      businessName,
      phone,
      location,
      bio,
      specializations,
      services,
      avatar,
      currentPassword,
      newPassword,
    } = body

    // Get current user
    const currentUser = await db
      .select()
      .from(users)
      .where(eq(users.id, auth.userId))
      .limit(1)
      .then(results => results[0])

    if (!currentUser) {
      throw createError({
        statusCode: 404,
        message: 'User not found',
      })
    }

    // Build update object with all profile fields
    const updateData: any = {
      name,
      email,
      businessName,
      phone,
      location,
      bio,
      updatedAt: new Date(),
    }

    // Only update these fields if they are provided
    if (avatar !== undefined) updateData.avatar = avatar
    if (specializations !== undefined)
      updateData.specializations =
        typeof specializations === 'string' ? specializations : JSON.stringify(specializations)
    if (services !== undefined)
      updateData.services = typeof services === 'string' ? services : JSON.stringify(services)

    // Handle password change if provided
    if (currentPassword && newPassword) {
      // Verify the current password
      const isPasswordValid = await bcrypt.compare(currentPassword, currentUser.password)
      if (!isPasswordValid) {
        throw createError({
          statusCode: 400,
          message: 'Current password is incorrect',
        })
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10)

      // Update the password in the database
      updateData.password = hashedPassword
    }

    // Update user
    const result = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, auth.userId))
      .returning()

    if (!result.length) {
      throw createError({
        statusCode: 500,
        message: 'Failed to update user',
      })
    }

    // Return updated user (exclude password)
    const updatedUser = result[0]
    // Parse JSON text fields for response
    const parsedSpecializations =
      typeof updatedUser.specializations === 'string' && updatedUser.specializations
        ? (() => {
            try {
              return JSON.parse(updatedUser.specializations as unknown as string)
            } catch {
              return updatedUser.specializations
            }
          })()
        : updatedUser.specializations
    const parsedServices =
      typeof updatedUser.services === 'string' && updatedUser.services
        ? (() => {
            try {
              return JSON.parse(updatedUser.services as unknown as string)
            } catch {
              return updatedUser.services
            }
          })()
        : updatedUser.services
    return {
      success: true,
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        businessName: updatedUser.businessName,
        phone: updatedUser.phone,
        location: updatedUser.location,
        bio: updatedUser.bio,
        specializations: parsedSpecializations,
        services: parsedServices,
        avatar: updatedUser.avatar,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    }
  } catch (error: any) {
    console.error('Error updating user profile:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to update user profile',
    })
  }
})
