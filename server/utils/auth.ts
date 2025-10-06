import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './drizzle'
import * as schema from '../database/schema'
import { sendEmail } from './email'
import { createPasswordResetEmail, createEmailVerificationEmail } from '../email-templates'

// Better Auth server instance
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      const { subject, htmlContent } = createPasswordResetEmail(url, user.name ?? undefined)
      await sendEmail({ to: user.email, subject, htmlContent })
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      const { subject, htmlContent } = createEmailVerificationEmail(url, user.name ?? undefined)
      await sendEmail({ to: user.email, subject, htmlContent })
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.NUXT_GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.NUXT_GOOGLE_CLIENT_SECRET as string,
    },
  },
  baseURL: process.env.NUXT_BETTER_AUTH_URL,
  secret: process.env.NUXT_BETTER_AUTH_SECRET,
})
