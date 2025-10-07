import { createAuthClient } from 'better-auth/vue'
import type { auth } from '~/server/utils/auth'

export const authClient = createAuthClient<typeof auth>({
  baseURL:
    process.env.NODE_ENV === 'production'
      ? process.env.NUXT_BETTER_AUTH_URL || 'http://localhost:3000'
      : 'http://localhost:3000',
  basePath: '/api/auth',
})
