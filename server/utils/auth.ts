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
  trustedOrigins: (() => {
    // Helper to normalize URL to origin (protocol + domain + port, no path)
    const normalizeToOrigin = (url: string): string => {
      try {
        const urlObj = new URL(url)
        return `${urlObj.protocol}//${urlObj.host}`
      } catch {
        // If it's already just an origin, return as-is
        return url
      }
    }

    const origins: string[] = []
    const originSet = new Set<string>()

    // Add baseURL if it exists (normalized to origin)
    if (process.env.NUXT_BETTER_AUTH_URL) {
      const origin = normalizeToOrigin(process.env.NUXT_BETTER_AUTH_URL)
      if (!originSet.has(origin)) {
        origins.push(origin)
        originSet.add(origin)
      }
    }

    // Add public site URL if it exists and is different (normalized to origin)
    if (process.env.NUXT_PUBLIC_SITE_URL) {
      const origin = normalizeToOrigin(process.env.NUXT_PUBLIC_SITE_URL)
      if (!originSet.has(origin)) {
        origins.push(origin)
        originSet.add(origin)
      }
    }

    // Support comma-separated list of trusted origins from env
    if (process.env.NUXT_BETTER_AUTH_TRUSTED_ORIGINS) {
      const envOrigins = process.env.NUXT_BETTER_AUTH_TRUSTED_ORIGINS.split(',')
        .map(origin => normalizeToOrigin(origin.trim()))
        .filter(origin => origin && !originSet.has(origin))
      envOrigins.forEach(origin => {
        origins.push(origin)
        originSet.add(origin)
      })
    }

    // In development, allow localhost origins
    if (process.env.NODE_ENV === 'development') {
      const localOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000']
      localOrigins.forEach(origin => {
        if (!originSet.has(origin)) {
          origins.push(origin)
          originSet.add(origin)
        }
      })
    }

    console.log('[Auth] Configured trusted origins:', origins)
    console.log('[Auth] Base URL:', process.env.NUXT_BETTER_AUTH_URL)
    console.log('[Auth] Public Site URL:', process.env.NUXT_PUBLIC_SITE_URL)
    return origins.length > 0 ? origins : undefined
  })(),
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24 * 7, // Update expiration every 7 days of active use
  },
})
