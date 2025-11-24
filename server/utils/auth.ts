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
      try {
        console.log('[Auth] Sending password reset email to:', user.email)
        const { subject, htmlContent } = createPasswordResetEmail(url, user.name ?? undefined)
        await sendEmail({ to: user.email, subject, htmlContent })
        console.log('[Auth] Password reset email sent successfully to:', user.email)
      } catch (error: any) {
        console.error('[Auth] Failed to send password reset email:', {
          email: user.email,
          error: error.message,
          stack: error.stack,
        })
        // Re-throw to let Better Auth handle the error
        throw error
      }
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      try {
        console.log('[Auth] Sending verification email to:', user.email)
        const { subject, htmlContent } = createEmailVerificationEmail(url, user.name ?? undefined)
        await sendEmail({ to: user.email, subject, htmlContent })
        console.log('[Auth] Verification email sent successfully to:', user.email)
      } catch (error: any) {
        console.error('[Auth] Failed to send verification email:', {
          email: user.email,
          error: error.message,
          stack: error.stack,
        })
        // Re-throw to let Better Auth handle the error
        throw error
      }
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
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24 * 7,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7,
    },
  },
})
