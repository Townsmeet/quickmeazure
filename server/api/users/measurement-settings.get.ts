import type { H3Event } from 'h3'
import { getUserMeasurementSettings } from '../../utils/measurement-settings'

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Get the authenticated user
    const user = event.context.user
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      })
    }

    // Get user's measurement settings
    const settings = await getUserMeasurementSettings(user.id)

    // If no settings exist, return default values
    if (!settings) {
      return { success: true, data: { defaultUnit: 'in' } }
    }

    return { success: true, data: settings }
  } catch (error: any) {
    console.error('Error fetching measurement settings:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch measurement settings',
      message: error.message || 'Failed to fetch measurement settings',
    }
  }
})
