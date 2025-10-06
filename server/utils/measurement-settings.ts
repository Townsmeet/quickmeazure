import { userMeasurementSettings } from '../database/schema'
import { eq } from 'drizzle-orm'
import { db } from './drizzle'

/**
 * Get user's measurement settings
 * @param userId The user ID
 * @returns The user's measurement settings or null if not found
 */
export async function getUserMeasurementSettings(userId: number) {
  try {
    // db is already imported

    // Query the user's measurement settings
    const settings = await db
      .select()
      .from(userMeasurementSettings)
      .where(eq(userMeasurementSettings.userId, userId))
      .execute()
      .then(results => results[0] || null)

    return settings
  } catch (error) {
    console.error('Error in getUserMeasurementSettings:', error)
    throw error
  }
}

/**
 * Update user's measurement settings
 * @param userId The user ID
 * @param settings The settings to update
 * @returns The updated settings
 */
export async function updateUserMeasurementSettings(
  userId: number,
  settings: {
    defaultUnit?: 'in' | 'cm'
  }
) {
  try {
    // db is already imported

    // Check if settings exist for this user
    const existingSettings = await getUserMeasurementSettings(userId)

    if (existingSettings) {
      // Update existing settings
      const updatedSettings = await db
        .update(userMeasurementSettings)
        .set({
          ...settings,
          updatedAt: new Date(),
        })
        .where(eq(userMeasurementSettings.userId, userId))
        .returning()
        .then(results => results[0])

      return updatedSettings
    } else {
      // Create new settings
      const newSettings = await db
        .insert(userMeasurementSettings)
        .values({
          userId,
          ...settings,
        })
        .returning()
        .then(results => results[0])

      return newSettings
    }
  } catch (error) {
    console.error('Error in updateUserMeasurementSettings:', error)
    throw error
  }
}
