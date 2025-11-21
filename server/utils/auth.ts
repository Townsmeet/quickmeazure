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
  user: {
    additionalFields: {
      hasActiveSubscription: {
        type: 'boolean',
        defaultValue: false,
      },
      hasCompletedSetup: {
        type: 'boolean',
        defaultValue: false,
      },
      subscriptionStatus: {
        type: 'string',
        defaultValue: 'none',
      },
      onboardingStep: {
        type: 'string',
        defaultValue: 'verification',
      },
      onboardingCompletedAt: {
        type: 'date',
        required: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
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
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24 * 7, // Update expiration every 7 days of active use
  },
})
