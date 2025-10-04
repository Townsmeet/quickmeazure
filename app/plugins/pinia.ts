import { defineNuxtPlugin } from '#app'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { useAuthStore } from '~/store/modules/auth'

/**
 * Pinia plugin for state management
 * Adds persistence and handles store initialization
 * NOTE: Pinia itself is already set up by @pinia/nuxt module
 */
export default defineNuxtPlugin(nuxtApp => {
  // Get the existing Pinia instance that was created by @pinia/nuxt
  const pinia = nuxtApp.$pinia

  // Only add persistence plugin on client-side to avoid 'window is not defined' errors
  if (import.meta.client && pinia && !pinia._p.includes(piniaPluginPersistedstate)) {
    pinia.use(piniaPluginPersistedstate)
  }

  // Wait for app to be mounted before initializing stores
  // This helps avoid SSR hydration issues
  nuxtApp.hook('app:mounted', () => {
    // Only initialize on client-side
    if (import.meta.client) {
      try {
        // Initialize auth store to restore session
        const authStore = useAuthStore()
        authStore.init()
      } catch (error) {
        console.error('Failed to initialize auth store:', error)
      }
    }
  })

  // No need to provide pinia as it's already provided by @pinia/nuxt
  return {}
})
