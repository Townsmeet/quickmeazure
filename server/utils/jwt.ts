import * as jwt from 'jsonwebtoken'

interface TokenPayload {
  id: string | number
  email?: string
  name?: string
  subscriptionPlan?: string
  subscriptionExpiry?: number | null
  iat?: number
  exp?: number
}

export function generateToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  const config = useRuntimeConfig()
  const secret = config.jwtSecret || 'fallback-secret-for-development'

  return jwt.sign(payload, secret, {
    expiresIn: '30d', // Token expires in 30 days
  })
}

export function verifyToken(token: string): TokenPayload {
  const config = useRuntimeConfig()
  const secret = config.jwtSecret || 'fallback-secret-for-development'

  return jwt.verify(token, secret) as TokenPayload
}
