import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import * as jwt from 'jsonwebtoken'
import { useDrizzle } from './drizzle'
import * as schema from '../database/schema'
import { useRuntimeConfig } from '#imports'

// Better Auth server instance
export const auth = betterAuth({
  database: drizzleAdapter(useDrizzle(), {
    provider: 'sqlite',
    schema,
  }),
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: process.env.NUXT_GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.NUXT_GOOGLE_CLIENT_SECRET as string,
    },
  },
  baseURL: process.env.NUXT_BETTER_AUTH_URL,
})

// Define the token payload type
export interface TokenPayload {
  id: string | number // Using id instead of userId to match the middleware
  email?: string
  name?: string
  subscriptionPlan?: string
  subscriptionExpiry?: number | null
  iat?: number
  exp?: number
}

export const verifyToken = async (
  token: string,
  requireSubscription: boolean = false
): Promise<TokenPayload | null> => {
  try {
    const config = useRuntimeConfig()
    const decoded = jwt.verify(token, config.jwtSecret as jwt.Secret) as TokenPayload
    if (requireSubscription) {
      if (!decoded.subscriptionPlan) throw new Error('No active subscription found')
      if (decoded.subscriptionExpiry && decoded.subscriptionExpiry < Date.now() / 1000)
        throw new Error('Subscription has expired')
    }
    return decoded
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

export const generateToken = (payload: TokenPayload, expiresIn: string = '7d'): string => {
  const config = useRuntimeConfig()
  return jwt.sign(payload, config.jwtSecret as jwt.Secret, { expiresIn })
}
