import { defineEventHandler, readBody, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../utils/drizzle'
import * as tables from '../../database/schema'
import { ok } from '../../validators'
import { z } from 'zod'

/**
 * Record payment for an order
 */
export default defineEventHandler(async event => {
  try {
    // Auth via middleware
    const auth = event.context.auth
    if (!auth || !auth.userId) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    // Validate body
    const BodySchema = z.object({
      orderId: z.coerce.number().int(),
      amount: z.coerce.number().positive(),
      paymentMethod: z.string().min(1),
      paymentDate: z.union([z.string(), z.date()]),
      notes: z.string().nullable().optional(),
    })
    const { orderId, amount, paymentMethod, paymentDate, notes } = BodySchema.parse(
      await readBody(event)
    )

    // Verify order exists
    const order = await db.query.orders.findFirst({ where: eq(tables.orders.id, orderId) })
    if (!order) {
      throw createError({ statusCode: 404, statusMessage: 'Order not found' })
    }

    // Insert payment
    const result = await db
      .insert(tables.payments)
      .values({
        orderId,
        amount,
        paymentMethod,
        paymentDate: new Date(paymentDate as any),
        notes: notes || '',
        createdAt: new Date(),
        createdBy: String(auth.userId),
      })
      .returning({ id: tables.payments.id })

    const paymentId = result[0]?.id
    return ok({ paymentId, amount, orderId })
  } catch (error: any) {
    console.error('Error recording payment:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'An error occurred while recording payment',
    })
  }
})
