import type { H3Event } from 'h3'
import { getUserTemplates } from '../../repositories/measurementTemplateRepository'

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Get the authenticated user
    const user = event.context.user
    console.log('API endpoint called, user context:', user ? 'User found' : 'No user')

    if (!user) {
      console.log('No authenticated user found in context')
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      })
    }

    // Get query parameters
    const query = getQuery(event)
    const includeArchived = query.includeArchived === 'true'
    console.log(`Fetching templates for user ID: ${user.id}, includeArchived: ${includeArchived}`)

    // Get user's templates
    const templates = await getUserTemplates(user.id, includeArchived)
    console.log(`Found ${templates.length} templates`)

    return {
      success: true,
      data: templates,
    }
  } catch (error: any) {
    console.error('Error fetching measurement templates:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch measurement templates',
      message: error.message || 'Failed to fetch measurement templates',
    }
  }
})
