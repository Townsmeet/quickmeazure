import { useAuthStore } from '~/store/modules/auth'

// Client-side plugin to refresh auth token periodically
export default defineNuxtPlugin({
  name: 'auth-refresh',
  setup(nuxtApp) {
    const authStore = useAuthStore()
    const { isLoggedIn } = storeToRefs(authStore)

    // Refresh interval - start at 15 minutes (in ms)
    const INITIAL_REFRESH_INTERVAL = 15 * 60 * 1000
    let currentRefreshInterval = INITIAL_REFRESH_INTERVAL
    const MAX_REFRESH_INTERVAL = 60 * 60 * 1000 // Maximum 1 hour

    // Refresh on initial load if logged in, with a 5 second delay
    if (isLoggedIn.value) {
      setTimeout(() => {
        authStore
          .refreshSession()
          .then(() => {
            console.log('Initial auth session refreshed successfully')
            // Reset interval to initial value after successful refresh
            currentRefreshInterval = INITIAL_REFRESH_INTERVAL
          })
          .catch(err => {
            console.error('Failed initial auth refresh:', err)
          })
      }, 5000)
    }

    // Set up periodic refresh
    let refreshTimer: NodeJS.Timeout | null = null

    // Start refresh timer
    const startRefreshTimer = () => {
      // Clear existing timer if it exists
      if (refreshTimer !== null) {
        clearTimeout(refreshTimer)
      }

      refreshTimer = setTimeout(async () => {
        if (isLoggedIn.value) {
          try {
            await authStore.refreshSession()
            console.log('Auth session refreshed successfully')
            // Reset interval to initial value after successful refresh
            currentRefreshInterval = INITIAL_REFRESH_INTERVAL
          } catch (error) {
            console.error('Failed to refresh auth session:', error)
            // Increase refresh interval for next attempt (exponential backoff)
            currentRefreshInterval = Math.min(currentRefreshInterval * 1.5, MAX_REFRESH_INTERVAL)
          } finally {
            // Schedule next refresh regardless of success/failure
            startRefreshTimer()
          }
        } else {
          // Stop the timer if not logged in
          if (refreshTimer !== null) {
            clearTimeout(refreshTimer)
            refreshTimer = null
          }
        }
      }, currentRefreshInterval)
    }

    // Start the timer if logged in
    if (isLoggedIn.value) {
      startRefreshTimer()
    }

    // Watch for login/logout events
    watch(isLoggedIn, newValue => {
      if (newValue) {
        // Reset interval when logging in
        currentRefreshInterval = INITIAL_REFRESH_INTERVAL
        startRefreshTimer()
      } else if (refreshTimer !== null) {
        clearTimeout(refreshTimer)
        refreshTimer = null
      }
    })

    // Use Nuxt's app:beforeMount hook for initialization
    nuxtApp.hook('app:mounted', () => {
      console.log('Auth refresh plugin initialized')
    })

    // Clean up timers when component unmounts
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        if (refreshTimer !== null) {
          clearTimeout(refreshTimer)
          refreshTimer = null
        }
      })
    }

    // Return an empty object to satisfy plugin interface
    return {
      provide: {},
    }
  },
})
