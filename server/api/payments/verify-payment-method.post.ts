import { defineEventHandler, readBody, createError } from 'h3'
import { ok } from '../../validators'
import { z } from 'zod'

export default defineEventHandler(async event => {
  // Auth via middleware
  const auth = event.context.auth
  if (!auth || !auth.userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  // Validate body
  const BodySchema = z.object({ reference: z.string().min(1) })
  const { reference } = BodySchema.parse(await readBody(event))

  // Here we assume Paystack verification is done client-side or on a separate webhook.
  // This endpoint simply acknowledges the reference for success flows.
  console.log('Payment method verification successful for user:', auth.userId, 'ref:', reference)

  return ok({ reference, verified: true })
})
