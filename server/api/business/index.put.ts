import { eq } from 'drizzle-orm'
import { db } from '../../utils/drizzle'
import * as tables from '../../database/schema'
import { ok, validateBody } from '../../validators'
import { BusinessUpdateSchema, type BusinessUpdateInput } from '../../validators/business'

export default defineEventHandler(async event => {
  const auth = event.context.auth
  if (!auth || !auth.userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const input: BusinessUpdateInput = await validateBody(event, BusinessUpdateSchema)

  const existing = await db
    .select()
    .from(tables.businesses)
    .where(eq(tables.businesses.userId, auth.userId as string))
    .limit(1)
    .then(r => r[0])

  const updateData: any = {
    ...('shopName' in input ? { shopName: input.shopName ?? null } : {}),
    ...('businessType' in input ? { businessType: input.businessType ?? null } : {}),
    ...('yearsInBusiness' in input ? { yearsInBusiness: input.yearsInBusiness ?? null } : {}),
    ...('businessDescription' in input
      ? { businessDescription: input.businessDescription ?? null }
      : {}),
    ...('phone' in input ? { phone: input.phone ?? null } : {}),
    ...('address' in input ? { address: input.address ?? null } : {}),
    ...('city' in input ? { city: input.city ?? null } : {}),
    ...('state' in input ? { state: input.state ?? null } : {}),
    ...('specializations' in input ? { specializations: input.specializations ?? null } : {}),
    ...('services' in input ? { services: input.services ?? null } : {}),
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
