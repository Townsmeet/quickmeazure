import { defineEventHandler, readBody, createError } from 'h3'
import { useDrizzle, tables, eq } from '../../utils/drizzle'
import { ok } from '../../validators'
import { z } from 'zod'

export default defineEventHandler(async event => {
  // Get authenticated user from event context (set by auth middleware)
  const auth = event.context.auth
  if (!auth || !auth.userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  // Validate body
  const BodySchema = z.object({
    reference: z.string().min(1),
    cardDetails: z
      .object({
        type: z.string().optional(),
        last4: z.string().optional(),
        expiryMonth: z.string().optional(),
        expiryYear: z.string().optional(),
        brand: z.string().optional(),
        providerId: z.string().optional(),
        metadata: z.union([z.string(), z.record(z.any())]).optional(),
      })
      .optional(),
  })
  const { reference, cardDetails } = BodySchema.parse(await readBody(event))

  const userId = String(auth.userId)
  const db = useDrizzle()

  // Check if the user already has a payment method
  const existingPaymentMethod = await db.query.paymentMethods.findFirst({
    where: eq(tables.paymentMethods.userId, userId),
  })

  let paymentMethod

  const metadataValue = cardDetails?.metadata
    ? typeof cardDetails.metadata === 'string'
      ? cardDetails.metadata
      : JSON.stringify(cardDetails.metadata)
    : undefined

  if (existingPaymentMethod) {
    paymentMethod = await db
      .update(tables.paymentMethods)
      .set({
        type: cardDetails?.type || 'card',
        last4: cardDetails?.last4,
        expiryMonth: cardDetails?.expiryMonth,
        expiryYear: cardDetails?.expiryYear,
        brand: cardDetails?.brand,
        provider: 'paystack',
        providerId: cardDetails?.providerId || reference,
        ...(metadataValue !== undefined ? { metadata: metadataValue } : {}),
        updatedAt: new Date(),
      })
      .where(eq(tables.paymentMethods.id, existingPaymentMethod.id))
      .returning()
  } else {
    paymentMethod = await db
      .insert(tables.paymentMethods)
      .values({
        userId,
        type: cardDetails?.type || 'card',
        last4: cardDetails?.last4,
        expiryMonth: cardDetails?.expiryMonth,
        expiryYear: cardDetails?.expiryYear,
        brand: cardDetails?.brand,
        isDefault: true,
        provider: 'paystack',
        providerId: cardDetails?.providerId || reference,
        ...(metadataValue !== undefined ? { metadata: metadataValue } : {}),
      })
      .returning()
  }

  const result = paymentMethod[0]
  return ok({
    id: result.id,
    type: result.type,
    last4: result.last4,
    expiryMonth: result.expiryMonth,
    expiryYear: result.expiryYear,
    brand: result.brand,
    isDefault: true,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  })
})
