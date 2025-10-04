import { z } from 'zod'

export const BusinessUpdateSchema = z.object({
  shopName: z.string().max(160).nullable().optional(),
  businessType: z.string().max(120).nullable().optional(),
  yearsInBusiness: z.number().int().min(0).max(200).nullable().optional(),
  businessDescription: z.string().max(2000).nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  address: z.string().max(200).nullable().optional(),
  city: z.string().max(120).nullable().optional(),
  state: z.string().max(120).nullable().optional(),
  // Keep as string (JSON text) to align with DB text storage
  specializations: z.string().nullable().optional(),
  services: z.string().nullable().optional(),
})

export type BusinessUpdateInput = z.infer<typeof BusinessUpdateSchema>
