import { z } from 'zod'

export const ProfileUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  email: z.string().email().optional(),
  businessName: z.string().max(160).nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  location: z.string().max(160).nullable().optional(),
  bio: z.string().max(2000).nullable().optional(),
  avatar: z.string().url().nullable().optional(),
  specializations: z.union([z.string(), z.array(z.string())]).optional(),
  services: z.union([z.string(), z.array(z.string())]).optional(),
})

export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>
