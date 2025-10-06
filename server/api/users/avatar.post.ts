import { eq } from 'drizzle-orm'
import { db } from '../../utils/drizzle'
import * as tables from '../../database/schema'
import { uploadFileToS3, getFileExtension, getContentType } from '../../utils/s3'

export default defineEventHandler(async event => {
  try {
    const auth = event.context.auth
    if (!auth || !auth.userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      })
    }

    // Get the current user from businesses (user profile)
    const currentUser = await db
      .select()
      .from(tables.businesses)
      .where(eq(tables.businesses.userId, auth.userId))
      .limit(1)
      .then(results => results[0])

    if (!currentUser) {
      throw createError({
        statusCode: 404,
        message: 'User not found',
      })
    }

    // Parse the multipart form data
    const formData = await readMultipartFormData(event)
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No file uploaded',
      })
    }

    const avatarFile = formData.find(part => part.name === 'avatar')
    if (!avatarFile || !avatarFile.data) {
      throw createError({
        statusCode: 400,
        message: 'Invalid file upload',
      })
    }

    // Get the file extension and content type
    const fileName = avatarFile.filename || `avatar-${Date.now()}.jpg`
    const fileExt = getFileExtension(fileName)
    const contentType = getContentType(fileExt)

    // Upload the file to S3
    let avatarUrl: string
    try {
      avatarUrl = await uploadFileToS3(avatarFile.data, fileName, contentType)
    } catch (uploadError) {
      console.error('Error uploading avatar to S3:', uploadError)
      throw createError({
        statusCode: 500,
        message: 'Failed to upload avatar to storage',
      })
    }

    // Update the user's avatar in the database
    const result = await db
      .update(tables.businesses)
      .set({
        image: avatarUrl,
        updatedAt: new Date(),
      })
      .where(eq(tables.businesses.userId, auth.userId))
      .returning()

    if (!result.length) {
      throw createError({
        statusCode: 500,
        message: 'Failed to update avatar',
      })
    }

    // Return the updated user data
    return {
      success: true,
      avatarUrl,
      message: 'Avatar updated successfully',
    }
  } catch (error: any) {
    console.error('Error uploading avatar:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to upload avatar',
    })
  }
})
