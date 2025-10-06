import { createAuthClient } from 'better-auth/vue'

export const authClient = createAuthClient({
  baseURL:
    process.env.NODE_ENV === 'production'
      ? process.env.NUXT_BETTER_AUTH_URL || 'http://localhost:3000'
      : 'http://localhost:3000',
  basePath: '/api/auth',
})
