import { eq } from 'drizzle-orm'
import { db } from '../../utils/drizzle'
import * as tables from '../../database/schema'
import { validateBody, validate } from '../../validators'
import { BusinessUpdateSchema, type BusinessUpdateInput } from '../../validators/business'
import { extractFieldsFromMultipart, extractFileFromMultipart } from '../../utils/multipart'
import { uploadFileToS3, getFileExtension, getContentType } from '../../utils/s3'

export default defineEventHandler(async event => {
  const auth = event.context.auth
  if (!auth || !auth.userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  // Support multipart/form-data for image upload from the profile form
  const contentType = (event.node.req.headers['content-type'] || '').toString()
  let input: BusinessUpdateInput

  if (contentType.includes('multipart/form-data')) {
    // Extract text fields from multipart form data
    const fields = await extractFieldsFromMultipart(event)

    // Coerce numeric fields where applicable
    const coerced: any = {
      ...fields,
    }

    if (coerced.yearsInBusiness !== undefined && coerced.yearsInBusiness !== null) {
      const n = Number(coerced.yearsInBusiness)
      coerced.yearsInBusiness = Number.isNaN(n) ? undefined : n
    }

    // If there's a file part, upload it and set image field
    const filePart = await extractFileFromMultipart(event)
    if (filePart && filePart.buffer) {
      try {
        const fileExt = getFileExtension(filePart.filename)
        const contentType = getContentType(fileExt)
        const uploadedUrl = await uploadFileToS3(filePart.buffer, filePart.filename, contentType)
        coerced.image = uploadedUrl
      } catch (err) {
        console.error('Failed to upload business image:', err)
      }
    }

    // Validate coerced object against Zod schema
    input = validate(BusinessUpdateSchema, coerced, 'Invalid request body')
  } else {
    input = await validateBody(event, BusinessUpdateSchema)
  }

  const existing = await db
    .select()
    .from(tables.businesses)
    .where(eq(tables.businesses.userId, auth.userId as string))
    .limit(1)
    .then(r => r[0])

  const updateData: any = {
    ...('businessName' in input ? { businessName: input.businessName ?? null } : {}),
    ...('yearsInBusiness' in input ? { yearsInBusiness: input.yearsInBusiness ?? null } : {}),
    ...('businessDescription' in input
      ? { businessDescription: input.businessDescription ?? null }
      : {}),
    ...('phone' in input ? { phone: input.phone ?? null } : {}),
    ...('address' in input ? { address: input.address ?? null } : {}),
    ...('city' in input ? { city: input.city ?? null } : {}),
    ...('state' in input ? { state: input.state ?? null } : {}),
    ...('specializations' in input ? { specializations: input.specializations ?? null } : {}),
    ...('image' in input ? { image: input.image ?? null } : {}),
    updatedAt: new Date(),
  }

  const saved = existing
    ? await db
        .update(tables.businesses)
        .set(updateData)
        .where(eq(tables.businesses.userId, auth.userId as string))
        .returning()
        .then(res => res[0])
    : await db
        .insert(tables.businesses)
        .values({ userId: String(auth.userId), ...updateData, createdAt: new Date() })
        .returning()
        .then(res => res[0])

  try {
    return { success: true, data: saved }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed',
      message: 'Failed to update business',
    }
  }
})
