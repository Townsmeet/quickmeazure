import type { H3Event } from 'h3'
import { createTemplate } from '../../utils/templates'
import { db } from '../../utils/drizzle'
import * as tables from '../../database/schema'
import { measurementTemplates, measurementFields, user as userTable } from '../../database/schema'

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

    // Validate required fields
    if (!body.name) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Template name is required',
      })
    }

    // Check if a template with this name already exists for this user
    const existingTemplate = await db
      .select()
      .from(measurementTemplates)
      .where(
        and(
          eq(measurementTemplates.userId, user.id),
          eq(measurementTemplates.name, body.name),
          eq(measurementTemplates.gender, body.gender || 'unisex')
        )
      )
      .execute()
      .then(results => results[0])

    let template

    if (existingTemplate) {
      // If template exists, update it with new fields
      console.log(`Template '${body.name}' already exists for user ${user.id}, updating fields`)

      // First, delete existing fields to avoid duplicates
      await db
        .delete(measurementFields)
        .where(eq(measurementFields.templateId, existingTemplate.id))
        .execute()

      // Then add the new fields
      if (body.fields && body.fields.length > 0) {
        const newFields = body.fields.map((field, index) => ({
          templateId: existingTemplate.id,
          name: field.name,
          description: field.description || null,
          unit: field.unit || 'cm',
          isRequired: field.isRequired ?? true,
          displayOrder: field.order ?? index,
          metadata: field.category ? { category: field.category } : null,
        }))

        await db.insert(measurementFields).values(newFields)
      }

      // Fetch the updated template with its fields
      const updatedFields = await db
        .select()
        .from(measurementFields)
        .where(eq(measurementFields.templateId, existingTemplate.id))
        .execute()

      template = {
        ...existingTemplate,
        fields: updatedFields,
      }
    } else {
      // Create a new template if it doesn't exist
      template = await createTemplate(
        user.id,
        {
          name: body.name,
          gender: body.gender || 'unisex',
          isArchived: false,
        },
        body.fields || []
      )
    }

    // Check if this is part of the setup process (can be determined by a query parameter or request header)
    const isSetupProcess =
      event.node.req.url?.includes('setup') || event.node.req.headers['x-setup-process'] === 'true'

    // If this is part of the setup process, mark the user's setup as completed
    if (isSetupProcess) {
      await db
        .update(userTable)
        .set({ hasCompletedSetup: true })
        .where(eq(userTable.id, user.id))
        .execute()

      console.log(`User ${user.id} has completed setup`)
    }

    return {
      success: true,
      data: template,
      setupCompleted: isSetupProcess,
    }
  } catch (error: any) {
    console.error('Error creating measurement template:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create measurement template',
      message: error.message || 'Failed to create measurement template',
    }
  }
})
