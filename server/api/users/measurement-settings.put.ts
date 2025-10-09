import type { H3Event } from 'h3'
import { updateUserMeasurementSettings } from '../../utils/measurement-settings'

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

    // Parse the request body
    const body = await readBody(event)

    // Validate the default unit
    if (body.defaultUnit && !['in', 'cm'].includes(body.defaultUnit)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid unit of measurement. Must be "in" or "cm"',
      })
    }

    // Update the user's measurement settings
    const settings = await updateUserMeasurementSettings(user.id, {
      defaultUnit: body.defaultUnit,
    })

    return { success: true, data: settings }
  } catch (error: any) {
    console.error('Error updating measurement settings:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update measurement settings',
      message: error.message || 'Failed to update measurement settings',
    }
  }
})
