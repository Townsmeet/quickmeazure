import { measurementTemplates, measurementFields } from '../database/schema'
import { eq, and } from 'drizzle-orm'
import { db } from '../utils/drizzle'

// Type definitions for insert operations
type NewMeasurementTemplate = typeof measurementTemplates.$inferInsert
type NewMeasurementField = typeof measurementFields.$inferInsert

/**
 * Get all measurement templates for a user
 * @param userId The user ID
 * @param includeArchived Whether to include archived templates
 * @returns Array of measurement templates with their fields
 */
export async function getUserTemplates(userId: string, includeArchived: boolean = false) {
  try {
    // db is already imported

    // Log the request parameters
    console.log(`Getting templates for user ${userId}, includeArchived: ${includeArchived}`)

    // First, fetch the templates without the relation to avoid the map error
    let templatesQuery

    if (includeArchived) {
      // If includeArchived is true, only filter by userId
      templatesQuery = db
        .select()
        .from(measurementTemplates)
        .where(eq(measurementTemplates.userId, userId))
        .orderBy(measurementTemplates.isDefault, measurementTemplates.name)
    } else {
      // If includeArchived is false, filter by both userId and isArchived
      templatesQuery = db
        .select()
        .from(measurementTemplates)
        .where(
          and(eq(measurementTemplates.userId, userId), eq(measurementTemplates.isArchived, false))
        )
        .orderBy(measurementTemplates.isDefault, measurementTemplates.name)
    }

    const templatesResult = await templatesQuery.execute()

    // Now fetch fields for each template
    const templates = await Promise.all(
      templatesResult.map(async template => {
        const fields = await db
          .select()
          .from(measurementFields)
          .where(eq(measurementFields.templateId, template.id))
          .orderBy(measurementFields.displayOrder)
          .execute()

        // Parse metadata and add category field for frontend convenience
        const processedFields = fields.map(field => {
          let category = 'upper' // default
          if (field.metadata) {
            try {
              const metadata = JSON.parse(field.metadata)
              category = metadata.category || 'upper'
            } catch (e) {
              // If metadata parsing fails, keep default
            }
          }

          return {
            ...field,
            category,
          }
        })

        return {
          ...template,
          fields: processedFields,
        }
      })
    )

    // Log the result count
    console.log(`Found ${templates.length} templates for user ${userId}`)

    return templates
  } catch (error) {
    console.error('Error in getUserTemplates:', error)
    throw error
  }
}

/**
 * Create a new measurement template with fields
 * @param userId The user ID
 * @param templateData The template data
 * @param fields The template fields
 * @returns The created template with its fields
 */
export async function createTemplate(
  userId: string,
  templateData: {
    name: string
    unit: string
    description?: string
    gender: 'male' | 'female' | 'unisex'
    isArchived?: boolean
    isDefault?: boolean
  },
  fields: Array<{
    name: string
    category?: string
    order?: number
    description?: string
    isRequired?: boolean
  }>
) {
  try {
    // db is already imported

    // Create template
    const newTemplate: NewMeasurementTemplate = {
      userId,
      name: templateData.name,
      unit: templateData.unit,
      description: templateData.description || null,
      gender: templateData.gender,
      isArchived: templateData.isArchived ?? false,
      isDefault: templateData.isDefault ?? false,
    }

    // Insert template and get the ID
    const [insertedTemplate] = await db.insert(measurementTemplates).values(newTemplate).returning()

    if (!insertedTemplate) {
      throw new Error('Failed to create measurement template')
    }

    // If there are fields, insert them
    if (fields.length > 0) {
      const newFields: NewMeasurementField[] = fields.map((field, index) => ({
        templateId: insertedTemplate.id,
        name: field.name,
        description: field.description || null,
        unit: templateData.unit, // Use template's unit for all fields
        isRequired: field.isRequired ?? true,
        displayOrder: field.order ?? index,
        metadata: field.category ? JSON.stringify({ category: field.category }) : null,
      }))

      await db.insert(measurementFields).values(newFields)
    }

    // Fetch the created template
    const createdTemplate = await db
      .select()
      .from(measurementTemplates)
      .where(eq(measurementTemplates.id, insertedTemplate.id))
      .execute()
      .then(results => results[0])

    // Fetch the fields separately
    const templateFields = await db
      .select()
      .from(measurementFields)
      .where(eq(measurementFields.templateId, insertedTemplate.id))
      .orderBy(measurementFields.displayOrder)
      .execute()

    // Parse metadata and add category field for frontend convenience
    const processedFields = templateFields.map(field => {
      let category = 'upper' // default
      if (field.metadata) {
        try {
          const metadata = JSON.parse(field.metadata)
          category = metadata.category || 'upper'
        } catch (e) {
          // If metadata parsing fails, keep default
        }
      }

      return {
        ...field,
        category,
      }
    })

    // Combine template with fields
    return {
      ...createdTemplate,
      fields: processedFields,
    }
  } catch (error) {
    console.error('Error in createTemplate:', error)
    throw error
  }
}

/**
 * Update an existing measurement template
 * @param templateId The template ID
 * @param userId The user ID (for authorization)
 * @param templateData The updated template data
 * @param fields The updated template fields
 * @returns The updated template with its fields
 */
export async function updateTemplate(
  templateId: number,
  userId: string,
  templateData: {
    name?: string
    unit?: string
    description?: string
    gender?: 'male' | 'female' | 'unisex'
    isArchived?: boolean
    isDefault?: boolean
  },
  fields?: Array<{
    id?: string | number
    name: string
    category?: string
    order?: number
    description?: string
    isRequired?: boolean
  }>
) {
  try {
    // First, verify the template belongs to the user
    const existingTemplate = await db
      .select()
      .from(measurementTemplates)
      .where(and(eq(measurementTemplates.id, templateId), eq(measurementTemplates.userId, userId)))
      .execute()
      .then(results => results[0])

    if (!existingTemplate) {
      throw new Error('Template not found or access denied')
    }

    // Update template
    const updateData: Partial<NewMeasurementTemplate> = {}
    if (templateData.name !== undefined) updateData.name = templateData.name
    if (templateData.unit !== undefined) updateData.unit = templateData.unit
    if (templateData.description !== undefined) updateData.description = templateData.description
    if (templateData.gender !== undefined) updateData.gender = templateData.gender
    if (templateData.isArchived !== undefined) updateData.isArchived = templateData.isArchived
    if (templateData.isDefault !== undefined) updateData.isDefault = templateData.isDefault

    if (Object.keys(updateData).length > 0) {
      await db
        .update(measurementTemplates)
        .set(updateData)
        .where(eq(measurementTemplates.id, templateId))
        .execute()
    }

    // Update fields if provided
    if (fields) {
      // Delete existing fields
      await db
        .delete(measurementFields)
        .where(eq(measurementFields.templateId, templateId))
        .execute()

      // Insert new fields
      if (fields.length > 0) {
        const newFields: NewMeasurementField[] = fields.map((field, index) => ({
          templateId,
          name: field.name,
          description: field.description || null,
          unit: templateData.unit || existingTemplate.unit, // Use updated unit or existing unit
          isRequired: field.isRequired ?? true,
          displayOrder: field.order ?? index,
          metadata: field.category ? JSON.stringify({ category: field.category }) : null,
        }))

        await db.insert(measurementFields).values(newFields).execute()
      }
    }

    // Fetch and return the updated template with fields
    const updatedTemplate = await db
      .select()
      .from(measurementTemplates)
      .where(eq(measurementTemplates.id, templateId))
      .execute()
      .then(results => results[0])

    const templateFields = await db
      .select()
      .from(measurementFields)
      .where(eq(measurementFields.templateId, templateId))
      .orderBy(measurementFields.displayOrder)
      .execute()

    // Parse metadata and add category field for frontend convenience
    const processedFields = templateFields.map(field => {
      let category = 'upper' // default
      if (field.metadata) {
        try {
          const metadata = JSON.parse(field.metadata)
          category = metadata.category || 'upper'
        } catch (e) {
          // If metadata parsing fails, keep default
        }
      }

      return {
        ...field,
        category,
      }
    })

    return {
      ...updatedTemplate,
      fields: processedFields,
    }
  } catch (error) {
    console.error('Error in updateTemplate:', error)
    throw error
  }
}

/**
 * Delete a measurement template
 * @param templateId The template ID
 * @param userId The user ID (for authorization)
 */
export async function deleteTemplate(templateId: number, userId: string) {
  try {
    // First, verify the template belongs to the user
    const existingTemplate = await db
      .select()
      .from(measurementTemplates)
      .where(and(eq(measurementTemplates.id, templateId), eq(measurementTemplates.userId, userId)))
      .execute()
      .then(results => results[0])

    if (!existingTemplate) {
      throw new Error('Template not found or access denied')
    }

    // Delete the template (fields will be deleted automatically due to cascade)
    await db.delete(measurementTemplates).where(eq(measurementTemplates.id, templateId)).execute()

    return true
  } catch (error) {
    console.error('Error in deleteTemplate:', error)
    throw error
  }
}

/**
 * Set a template as the default template for a user
 * @param templateId The template ID
 * @param userId The user ID
 */
export async function setDefaultTemplate(templateId: number, userId: string) {
  try {
    // First, verify the template belongs to the user
    const existingTemplate = await db
      .select()
      .from(measurementTemplates)
      .where(and(eq(measurementTemplates.id, templateId), eq(measurementTemplates.userId, userId)))
      .execute()
      .then(results => results[0])

    if (!existingTemplate) {
      throw new Error('Template not found or access denied')
    }

    // First, set all user's templates to not default
    await db
      .update(measurementTemplates)
      .set({ isDefault: false })
      .where(eq(measurementTemplates.userId, userId))
      .execute()

    // Then set the specified template as default
    await db
      .update(measurementTemplates)
      .set({ isDefault: true })
      .where(eq(measurementTemplates.id, templateId))
      .execute()

    return true
  } catch (error) {
    console.error('Error in setDefaultTemplate:', error)
    throw error
  }
}
