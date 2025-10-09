import { createAuthClient } from 'better-auth/vue'
import { inferAdditionalFields } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  baseURL: process.env.NUXT_BETTER_AUTH_URL,
  basePath: '/api/auth',
  plugins: [
    inferAdditionalFields({
      user: {
        hasActiveSubscription: { type: 'boolean', input: false },
        hasCompletedSetup: { type: 'boolean', input: false },
        subscriptionStatus: { type: 'string', input: false },
        onboardingStep: { type: 'string', input: false },
        onboardingCompletedAt: { type: 'date', input: false },
      },
    }),
  ],
})
