// Vue and Pinia imports
import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { useRuntimeConfig } from '#imports'
import { navigateTo } from '#imports'

// Types - Use relative paths from the store module
import type { User } from '../../types/auth'
import type { AuthHeaders } from '../../types/api'

// Stores
import { useUserStore } from './user'

// Constants - Use relative paths from the store module
import { STORAGE_KEYS } from '../../constants/storage'

// Utils - Use relative paths from the store module
import { 
  getLocalStorage, 
  setLocalStorage, 
  removeLocalStorage,
  getStringFromStorage,
  setStringToStorage,
  removeFromStorage,
  getFromStorage,
  setToStorage
} from '../../utils'
import { migrateTokenStorage } from '../../utils/storage-migration'

// Composables
// Note: useAuthApi removed - using direct API calls

/**
 * Auth store for managing authentication state
 * Consolidates JWT and Nuxt Auth approaches with proper session management
 */
export const useAuthStore = defineStore(
  'auth',
  () => {
    // Get runtime config for auth settings (used throughout the store)
    const _config = useRuntimeConfig()

    // State
    const user = ref<User | null>(null)
    const token = ref<string | null>(null)
    const refreshToken = ref<string | null>(null)
    const sessionExpiry = ref<number | null>(null)
    const isRefreshing = ref(false)
    const sessionTimeoutId = ref<NodeJS.Timeout | null>(null)

    // Constants for session management
    const SESSION_DURATION = 90 * 24 * 60 * 60 * 1000 // 90 days (WhatsApp-like persistence)
    const TOKEN_REFRESH_THRESHOLD = 7 * 24 * 60 * 60 * 1000 // 7 days before expiry

    // Computed properties
    const isLoggedIn = computed(() => {
      return !!token.value && !!sessionExpiry.value && Date.now() < sessionExpiry.value
    })

    const isSubscriptionActive = computed(() => {
      if (!user.value) return false

      // Free plan is always active
      if (user.value.subscription?.plan === 'free') return true

      // Check if paid subscription is expired
      if (user.value.subscription?.expiryDate) {
        return Date.now() < new Date(user.value.subscription.expiryDate).getTime()
      }

      return false
    })

    const status = computed(() => {
      return isLoggedIn.value ? 'authenticated' : 'unauthenticated'
    })

    // Watch for auth state changes to set up session timeout
    watch(
      () => isLoggedIn.value,
      isLoggedIn => {
        if (isLoggedIn) {
          setupSessionTimeout()
        } else {
          clearSessionTimeout()
        }
      }
    )

    // We don't need activity tracking since we removed inactivity detection

    /**
     * Set up session timeout to handle token expiry and refreshing
     * Modified for WhatsApp-like behavior - no auto-logout, only background refresh
     */
    function setupSessionTimeout() {
      if (typeof window === 'undefined') return

      // Clear any existing timeout
      clearSessionTimeout()

      // Set up a new timeout that only handles token refresh, no auto-logout
      sessionTimeoutId.value = setInterval(() => {
        const now = Date.now()

        // Only refresh token if within threshold, never auto-logout
        if (sessionExpiry.value && sessionExpiry.value - now < TOKEN_REFRESH_THRESHOLD) {
          console.log('Token expiring soon, refreshing in background')
          refreshSession()
        }
      }, 60000) // Check every minute
    }

    /**
     * Clear session timeout
     */
    function clearSessionTimeout() {
      if (sessionTimeoutId.value) {
        clearInterval(sessionTimeoutId.value)
        sessionTimeoutId.value = null
      }
    }

    /**
     * Parse JWT token to extract user information
     */
    function parseJwtToken(token: string): User | null {
      try {
        const base64Payload = token.split('.')[1]
        const payload = JSON.parse(atob(base64Payload))
        return {
          id: payload.id || payload.sub,
          name: payload.name,
          email: payload.email,
          hasCompletedSetup: payload.hasCompletedSetup || false,
          createdAt: payload.createdAt || new Date().toISOString(),
          subscription: payload.subscription || {
            plan: 'free',
            status: 'active',
            expiryDate: null,
          },
        }
      } catch (e) {
        console.error('Failed to decode JWT token', e)
        return null
      }
    }

    /**
     * Persist auth state to localStorage using standardized storage utilities
     */
    function persistAuthState() {
      if (typeof window === 'undefined') return

      if (token.value && sessionExpiry.value) {
        // Use the standardized storage utility for consistent error handling
        setToStorage(STORAGE_KEYS.USER, user.value)
        setStringToStorage(STORAGE_KEYS.AUTH_TOKEN, token.value)
        if (refreshToken.value) {
          setStringToStorage(STORAGE_KEYS.REFRESH_TOKEN, refreshToken.value)
        }
        setToStorage('lastLoginTime', Date.now())
      } else {
        // Use the standardized storage utility for consistent error handling
        removeFromStorage(STORAGE_KEYS.USER)
        removeFromStorage(STORAGE_KEYS.AUTH_TOKEN)
        removeFromStorage(STORAGE_KEYS.REFRESH_TOKEN)
        removeFromStorage('lastLoginTime')
      }
    }

    // Actions
    /**
     * Initialize the auth store
     * Restores session from localStorage if available
     * Safe to call during SSR
     */
    function init() {
      // Skip initialization during SSR
      if (import.meta.server) return

      // Only run on client
      if (typeof window !== 'undefined') {
        console.log('Initializing auth store on client')

        // Migrate any legacy token storage formats
        migrateTokenStorage()

        // Get user store instance
        const userStore = useUserStore()

        // Use standardized storage utility to load auth data
        const storedUser = getFromStorage<any>(STORAGE_KEYS.USER)
        const storedToken = getStringFromStorage(STORAGE_KEYS.AUTH_TOKEN)
        const storedRefreshToken = getStringFromStorage(STORAGE_KEYS.REFRESH_TOKEN)
        const authData = storedToken
          ? {
              token: storedToken,
              refreshToken: storedRefreshToken,
              sessionExpiry: Date.now() + SESSION_DURATION,
            }
          : null

        if (authData) {
          // Check if token exists and is not expired
          if (authData.token && authData.sessionExpiry && Date.now() < authData.sessionExpiry) {
            console.log('Found valid auth data in localStorage')

            // Set token and expiry
            token.value = authData.token
            refreshToken.value = authData.refreshToken || null
            sessionExpiry.value = authData.sessionExpiry

            // Extract user info from JWT payload
            const userData = parseJwtToken(authData.token)
            if (userData) {
              // Store user data in auth store for backward compatibility
              user.value = userData

              // Initialize user store with user data
              userStore.init(userData)

              // Set up session timeout
              setupSessionTimeout()

              console.log('Auth state restored successfully')
            } else {
              console.error('Failed to parse user data from token')
              clearAuthState()
              userStore.reset()
            }
          } else {
            console.log('Found expired auth data in localStorage')
            clearAuthState()
            userStore.reset()
          }
        } else {
          console.log('No auth data found in localStorage')
        }
      }
    }

    /**
     * Clear all auth state
     */
    function clearAuthState() {
      user.value = null
      token.value = null
      refreshToken.value = null
      sessionExpiry.value = null

      if (typeof window !== 'undefined') {
        // Use standardized storage utilities for consistent error handling
        removeFromStorage(STORAGE_KEYS.USER)
        removeFromStorage(STORAGE_KEYS.AUTH_TOKEN)
        removeFromStorage(STORAGE_KEYS.REFRESH_TOKEN)
        removeFromStorage('lastLoginTime')
        removeFromStorage('isHandlingAuthError')
        removeFromStorage('isHandlingTokenRefresh')
      }

      clearSessionTimeout()
    }

    /**
     * Set user authentication state after successful login
     * Modified for WhatsApp-like behavior - always use 90-day sessions
     */
    function setAuthState({
      user: userData,
      token: authToken,
      refreshToken: authRefreshToken,
    }: {
      user: User
      token: string
      refreshToken?: string
    }) {
      if (!authToken) {
        throw new Error('No token provided')
      }

      // Store user and token in auth store
      user.value = userData
      token.value = authToken
      refreshToken.value = authRefreshToken || null

      // Initialize user store with user data
      const userStore = useUserStore()
      userStore.init(userData)

      // Always use 90-day session for WhatsApp-like persistence
      const now = Date.now()
      sessionExpiry.value = now + SESSION_DURATION // 90 days

      // Set up session timeout
      setupSessionTimeout()

      // Save to localStorage
      persistAuthState()

      return { success: true, user: userData }
    }

    /**
     * Set user data after successful registration
     */
    function setUser(userData: User) {
      user.value = userData
      return { success: true, user: userData }
    }

    /**
     * Logout the current user (client-side only)
     */
    function logout() {
      console.log('Starting client-side logout process')

      // Mark this as an intentional logout if not already set
      if (typeof window !== 'undefined' && !getFromStorage('intentionalLogout')) {
        setToStorage('intentionalLogout', 'true')
      }

      // Clear session timeout
      clearSessionTimeout()

      // Clear all auth state
      clearAuthState()

      // Reset user store state
      const userStore = useUserStore()
      userStore.reset()
      console.log('Client-side logout completed')

      // Clear the intentional logout flag after successful logout
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          removeFromStorage('intentionalLogout')
        }, 1000) // Small delay to ensure other operations complete
      }

      return { success: true }
    }

    /**
     * Set a new token and optionally update the refresh token
     */
    function setToken(newToken: string, newRefreshToken?: string) {
      if (!newToken) {
        console.error('Cannot set empty token')
        return { success: false, error: 'Cannot set empty token' }
      }

      console.log('Updating auth token')
      token.value = newToken

      // Update refresh token if provided
      if (newRefreshToken) {
        refreshToken.value = newRefreshToken
      }

      return { success: true }
    }

    /**
     * Update the user profile in the auth store
     */
    function updateUserProfile(userData: User) {
      if (!userData) {
        console.error('Cannot update user profile with empty data')
        return { success: false, error: 'Invalid user data' }
      }

      console.log('Updating user profile in auth store')
      user.value = userData

      // Update user store if needed
      const userStore = useUserStore()
      userStore.updateProfile(userData)

      return { success: true }
    }

    /**
     * Handle session expiry or forced logout
     * @param showNotification Whether to show a notification to the user
     * @param reason Optional reason for the session expiry (for logging)
     */
    async function handleSessionExpiry(showNotification = true, reason = 'Session expired') {
      // Check if this is an intentional logout
      const isIntentionalLogout =
        typeof window !== 'undefined' && getFromStorage('intentionalLogout') === 'true'

      console.log(`Handling session expiry: ${reason}`, { isIntentionalLogout })

      // Clear session timeout immediately
      clearSessionTimeout()

      // Call logout to clear state and notify server
      await logout()

      // Show notification only if not an intentional logout
      if (showNotification && typeof window !== 'undefined' && !isIntentionalLogout) {
        console.error('Session Expired: Your session has expired. Please log in again.')
      }

      // Redirect to login page with return URL if possible
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        const isAuthPage = currentPath.startsWith('/auth/')

        // Only include return URL if not already on an auth page
        if (!isAuthPage && currentPath !== '/') {
          navigateTo(`/auth/login?returnTo=${encodeURIComponent(currentPath)}`)
        } else {
          navigateTo('/auth/login')
        }
      } else {
        // Server-side redirect
        navigateTo('/auth/login')
      }
    }

    /**
     * Get client limit based on subscription plan
     */
    function getClientLimit() {
      if (!user.value) return 0

      switch (user.value.subscription?.plan) {
        case 'free':
          return 100
        case 'standard':
          return 500
        case 'premium':
          return Infinity // Unlimited
        default:
          return 0
      }
    }

    /**
     * Get authorization headers for API calls
     */
    function getAuthHeaders(): AuthHeaders {
      // Ensure we have a token
      const currentToken = token.value
      if (!currentToken) {
        console.warn('No authentication token available')
        return {}
      }

      return {
        Authorization: `Bearer ${currentToken}`,
        'Content-Type': 'application/json',
      }
    }

    /**
     * Update the token with a new one, typically after subscription changes
     * @param newToken The new token to use
     */
    function updateToken(newToken: string) {
      if (!newToken) {
        console.error('Cannot update token: No token provided')
        return
      }

      try {
        // Parse the new token
        const userData = parseJwtToken(newToken)
        if (!userData) {
          console.error('Failed to parse user data from new token')
          return
        }

        // Update token and user data
        token.value = newToken
        user.value = userData

        // Update user store
        const userStore = useUserStore()
        userStore.init(userData)

        // Recalculate session expiry if needed (maintain the same expiry time)
        if (!sessionExpiry.value || sessionExpiry.value < Date.now()) {
          sessionExpiry.value = Date.now() + SESSION_DURATION
        }

        // Update session timeout
        setupSessionTimeout()

        // Save to localStorage
        persistAuthState()

        console.log('Token updated successfully with new subscription data')
      } catch (error) {
        console.error('Error updating token:', error)
      }
    }

    /**
     * Refresh the authentication session by getting a new access token
     * Background refresh for WhatsApp-like behavior
     */
    async function refreshSession() {
      // Skip if already refreshing
      if (isRefreshing.value) {
        console.log('Refresh already in progress, skipping...')
        return { success: false, error: 'Refresh already in progress' }
      }

      // Set refreshing flag
      isRefreshing.value = true

      try {
        // Direct API call to refresh token
        const response = await $fetch<{
          success: boolean
          user: User
          token: string
          refreshToken?: string
        }>('/api/auth/refresh', {
          method: 'POST',
          headers: getAuthHeaders() as Record<string, string>,
        })

        if (response.token) {
          // Update token and extend session
          token.value = response.token
          if (response.refreshToken) {
            refreshToken.value = response.refreshToken
          }

          // Extend session by another 90 days
          sessionExpiry.value = Date.now() + SESSION_DURATION

          // Update user data if provided
          if (response.user) {
            user.value = response.user
            const userStore = useUserStore()
            userStore.init(response.user)
          }

          // Save to localStorage
          persistAuthState()

          console.log('Session refreshed successfully in background')
          return { success: true }
        } else {
          console.error('Failed to refresh session: No token received')
          return { success: false, error: 'No token received' }
        }
      } catch (error) {
        console.error('Error refreshing session:', error)
        // Don't logout on refresh failure for WhatsApp-like behavior
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      } finally {
        // Always clear the refreshing flag
        isRefreshing.value = false
      }
    }

    // Return public store interface
    return {
      // State
      user,
      token,
      refreshToken,
      sessionExpiry,
      isRefreshing,
      sessionTimeoutId,

      // Getters
      isLoggedIn,
      isSubscriptionActive,
      status,

      // Actions
      init,
      clearAuthState,
      setAuthState,
      setUser,
      setToken,
      updateUserProfile,
      logout,
      refreshSession,
      handleSessionExpiry,
      getClientLimit,
      getAuthHeaders,
      updateToken,
    }
  },
  {
    persist:
      typeof window !== 'undefined'
        ? {
            storage: window.localStorage,
          }
        : false,
  }
)
