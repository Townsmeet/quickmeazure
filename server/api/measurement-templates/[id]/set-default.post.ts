import type { H3Event } from 'h3'
import { setDefaultTemplate } from '../../../repositories/measurementTemplateRepository'

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

    // Get the template ID from the route
    const templateId = parseInt(event.context.params?.id, 10)
    if (isNaN(templateId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid template ID',
      })
    }

    // Set the template as default
    await setDefaultTemplate(templateId, user.id)

    return {
      success: true,
      data: { isDefault: true },
      message: 'Template set as default successfully',
    }
  } catch (error: any) {
    console.error('Error setting default template:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to set default template',
      message: error.message || 'Failed to set default template',
    }
  }
})
