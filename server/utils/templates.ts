import {
  measurementTemplates,
  measurementFields,
  type NewMeasurementTemplate,
  type NewMeasurementField,
} from '../database/schema'
import { eq, and } from 'drizzle-orm'
import { db } from './drizzle'

/**
 * Get all measurement templates for a user
 * @param userId The user ID
 * @param includeArchived Whether to include archived templates
 * @returns Array of measurement templates with their fields
 */
export async function getUserTemplates(userId: number, includeArchived: boolean = false) {
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
          .execute()

        return {
          ...template,
          fields,
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
  userId: number,
  templateData: {
    name: string
    gender: 'male' | 'female' | 'unisex'
    isArchived?: boolean
    isDefault?: boolean
  },
  fields: Array<{
    name: string
    category?: string
    order?: number
    description?: string
    unit?: string
    isRequired?: boolean
  }>
) {
  try {
    // db is already imported

    // Create template
    const newTemplate: NewMeasurementTemplate = {
      userId,
      name: templateData.name,
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
        unit: field.unit || 'cm',
        isRequired: field.isRequired ?? true,
        displayOrder: field.order ?? index,
        metadata: field.category ? { category: field.category } : null,
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
      .execute()

    // Combine template with fields
    return {
      ...createdTemplate,
      fields: templateFields,
    }
  } catch (error) {
    console.error('Error in createTemplate:', error)
    throw error
  }
}
