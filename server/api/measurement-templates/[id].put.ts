import type { H3Event } from 'h3'

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

    // Parse the request body
    const body = await readBody(event)

    // Validate required fields
    if (body.name === '') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Template name cannot be empty',
      })
    }

    // Update the template
    const template = await updateTemplate(
      templateId,
      user.id,
      {
        name: body.name,
        gender: body.gender,
        isArchived: body.isArchived,
      },
      body.fields
    )

    return {
      success: true,
      data: template,
    }
  } catch (error: any) {
    console.error('Error updating measurement template:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update measurement template',
      message: error.message || 'Failed to update measurement template',
    }
  }
})
