import { defineEventHandler, createError } from 'h3'
import { useDrizzle, tables, eq, and } from '../../../utils/drizzle'
import { ok } from '../../../validators'
import { z } from 'zod'

export default defineEventHandler(async event => {
  // Validate id param
  const ParamSchema = z.object({ id: z.coerce.number().int() })
  const id = ParamSchema.parse({ id: event.context.params?.id }).id

  // Auth
  const auth = event.context.auth
  if (!auth || !auth.userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const userId = String(auth.userId)
  const db = useDrizzle()

  // Check ownership
  const paymentMethod = await db
    .select()
    .from(tables.paymentMethods)
    .where(and(eq(tables.paymentMethods.id, id), eq(tables.paymentMethods.userId, userId)))
    .limit(1)

  if (!paymentMethod || paymentMethod.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Payment method not found or does not belong to the user',
    })
  }

  // Delete
  await db
    .delete(tables.paymentMethods)
    .where(and(eq(tables.paymentMethods.id, id), eq(tables.paymentMethods.userId, userId)))

  return ok({ id, deleted: true })
})
