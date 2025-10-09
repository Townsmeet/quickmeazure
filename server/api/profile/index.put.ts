import { db } from '../../utils/drizzle'
import * as tables from '../../database/schema'
import { ok, validateBody } from '../../validators'
import { ProfileUpdateSchema, type ProfileUpdateInput } from '../../validators/profile'

export default defineEventHandler(async event => {
  const auth = event.context.auth
  if (!auth || !auth.userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const input: ProfileUpdateInput = await validateBody(event, ProfileUpdateSchema)

  // Upsert into businesses table (user profile)
  const existing = await db
    .select()
    .from(tables.businesses)
    .where(eq(tables.businesses.userId, auth.userId as string))
    .limit(1)
    .then(r => r[0])

  const updateData: any = {
    ...('businessName' in input ? { businessName: input.businessName ?? null } : {}),
    ...('phone' in input ? { phone: input.phone ?? null } : {}),
    ...('location' in input ? { location: input.location ?? null } : {}),
    ...('bio' in input ? { bio: input.bio ?? null } : {}),
    ...('avatar' in input ? { image: input.avatar ?? null } : {}),
    ...('specializations' in input
      ? {
          specializations:
            typeof input.specializations === 'string'
              ? input.specializations
              : input.specializations
                ? JSON.stringify(input.specializations)
                : null,
        }
      : {}),
    ...('services' in input
      ? {
          services:
            typeof input.services === 'string'
              ? input.services
              : input.services
                ? JSON.stringify(input.services)
                : null,
        }
      : {}),
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

  // Parse JSON text fields for response
  const parsedSpecializations = saved?.specializations
    ? (() => {
        try {
          return JSON.parse(saved.specializations as unknown as string)
        } catch {
          return saved.specializations
        }
      })()
    : null

  const parsedServices = saved?.services
    ? (() => {
        try {
          return JSON.parse(saved.services as unknown as string)
        } catch {
          return saved.services
        }
      })()
    : null

  return {
    success: true,
    data: {
      userId: saved.userId,
      name: saved.name,
      email: saved.email,
      businessName: saved.businessName,
      phone: saved.phone,
      location: saved.location,
      bio: saved.bio,
      avatar: saved.avatar,
      specializations: parsedSpecializations,
      services: parsedServices,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    },
  }
})
