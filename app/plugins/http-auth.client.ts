import type { FetchError, FetchOptions } from 'ofetch'

declare module 'ofetch' {
  interface FetchOptions {
    /**
     * When true, the auth interceptor will ignore 401 responses for this request.
     * Useful for endpoints where a 401 is expected (e.g. login attempts).
     */
    ignoreAuth401?: boolean
  }
}

export default defineNuxtPlugin(nuxtApp => {
  // Only run on the client where redirects/logouts make sense
  if (import.meta.server) return

  const isLoggingOut = useState<boolean>('auth_401_logging_out', () => false)
  const baseFetch = $fetch

  const enhancedFetch = baseFetch.create({
    async onResponseError(ctx) {
      const error = ctx.error as FetchError | undefined
      const status = ctx.response?.status ?? error?.response?.status
      const opts = ctx.options as FetchOptions & { ignoreAuth401?: boolean }

      if (opts?.ignoreAuth401) return
      if (status !== 401) return
      if (isLoggingOut.value) return

      isLoggingOut.value = true

      try {
        const { logout } = useAuth()
        await logout()
      } catch (error) {
        console.error('[AuthInterceptor] Failed to logout after 401:', error)
        await navigateTo('/auth/login')
      } finally {
        isLoggingOut.value = false
      }
    },
  })

  // Replace the default $fetch instance so all composables benefit
  nuxtApp.$fetch = enhancedFetch
  globalThis.$fetch = enhancedFetch
})
