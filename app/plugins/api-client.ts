import { defineNuxtPlugin } from '#app'

/**
 * API Client plugin that provides a centralized way to make API requests
 * with automatic authentication, error handling, and response formatting
 * IMPORTANT: This plugin must run AFTER Pinia is initialized
 */
export default defineNuxtPlugin({
  name: 'api-client',
  enforce: 'post', // Run after Pinia is initialized
  setup(nuxtApp) {
    // Helper functions to safely access auth store data
    const getAuthToken = () => {
      try {
        // Access the auth token from the Pinia state
        if (nuxtApp.$pinia && nuxtApp.$pinia.state.value && nuxtApp.$pinia.state.value.auth) {
          return nuxtApp.$pinia.state.value.auth.token || null
        }
        return null
      } catch (error) {
        console.error('Failed to access auth token:', error)
        return null
      }
    }

    const getAuthStore = async () => {
      try {
        // Dynamically import to avoid module-level initialization
        const storeModule = await import('~/store')
        const authStore = storeModule.useAuthStore()
        return authStore
      } catch (error) {
        console.error('Failed to access auth store:', error)
        return null
      }
    }

    // Create a custom fetch instance with interceptors
    const customFetch = async <T = unknown>(
      url: string,
      options: Record<string, unknown> = {}
    ): Promise<T> => {
      // Add base URL if the URL is relative
      const baseUrl = import.meta.client
        ? window.location.origin
        : process.env.APP_URL || 'http://localhost:3000'

      const fullUrl = url.startsWith('http')
        ? url
        : `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`

      // Add auth headers if available and not already set
      const token = getAuthToken()
      if (!options.headers?.Authorization && token) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        }
      }

      // Ensure headers object exists
      options.headers = options.headers || {}

      // Add content-type if not set
      if (!options.headers['Content-Type'] && !options.headers['content-type']) {
        options.headers['Content-Type'] = 'application/json'
      }

      // Check if we need to avoid error toasts during intentional logout
      if (import.meta.client && localStorage.getItem('intentionalLogout') === 'true') {
        // Skip error handling for intentional logouts
        options.skipErrorHandling = true
      }

      // Add debugging
      console.log(`API Request: ${fullUrl}`, {
        method: options.method || 'GET',
        headers: options.headers,
      })

      try {
        // Make the API call
        const response = await $fetch<T>(fullUrl, options)

        // Log successful response for debugging
        console.log(`API Response: ${fullUrl}`, response)

        return response
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        // Log error for debugging
        console.error(`API Error: ${fullUrl}`, error)

        // Handle API errors
        await handleApiError(error, options)

        // Rethrow the error for the caller to handle
        throw error
      }
    }

    /**
     * Handle API errors including 401 unauthorized responses
     */
    const handleApiError = async (
      error: unknown,
      options: Record<string, unknown> = {}
    ): Promise<void> => {
      if (!error) return

      // Skip error handling if explicitly requested
      if (options.skipErrorHandling) return

      // Get route and toast safely
      const route = useRoute ? useRoute() : { path: '/' }
      const toast = useToast ? useToast() : { add: () => {} }

      // Extract status code
      const statusCode = error.statusCode || error.status || 500

      // Handle 401 errors (unauthorized) - try to refresh token first
      if (statusCode === 401 && !route.path.includes('/auth/')) {
        // Check if we're already handling a refresh to prevent loops
        const isHandlingRefresh =
          import.meta.client && localStorage.getItem('isHandlingTokenRefresh') === 'true'

        if (!isHandlingRefresh) {
          try {
            // Get auth store safely
            const authStore = await getAuthStore()
            if (!authStore) return

            // Try to refresh the token
            const result = await authStore.refreshSession()

            // If refresh failed, handle session expiry
            if (!result.success) {
              authStore.handleSessionExpiry(true)
            }

            return // Exit early if we've handled the refresh
          } catch (_) {
            // If refresh failed, proceed with session expiry
            const authStore = await getAuthStore()
            if (authStore) {
              authStore.handleSessionExpiry(true)
            }
            return
          }
        } else {
          // We're already handling a refresh, just proceed with session expiry
          const authStore = await getAuthStore()
          if (authStore) {
            authStore.handleSessionExpiry(true)
          }
        }
      }

      // Handle other common API errors with appropriate UI feedback
      else if (statusCode === 403) {
        toast.add({
          title: 'Access Denied',
          description: 'You do not have permission to perform this action',
          color: 'error',
        })
      } else if (statusCode === 404) {
        toast.add({
          title: 'Not Found',
          description: 'The requested resource could not be found',
          color: 'warning',
        })
      } else if (statusCode >= 500) {
        toast.add({
          title: 'Server Error',
          description: 'A server error occurred. Please try again later',
          color: 'error',
        })
      }
    }

    // Create API client methods
    const apiClient = {
      /**
       * Make a GET request
       */
      get: <T = unknown>(url: string, options: Record<string, unknown> = {}) => {
        return customFetch<T>(url, { ...options, method: 'GET' })
      },

      /**
       * Make a POST request
       */
      post: <T = unknown>(url: string, data: unknown, options: Record<string, unknown> = {}) => {
        return customFetch<T>(url, { ...options, method: 'POST', body: data })
      },

      /**
       * Make a PUT request
       */
      put: <T = unknown>(url: string, data: unknown, options: Record<string, unknown> = {}) => {
        return customFetch<T>(url, { ...options, method: 'PUT', body: data })
      },

      /**
       * Make a DELETE request
       */
      delete: <T = unknown>(url: string, options: Record<string, unknown> = {}) => {
        return customFetch<T>(url, { ...options, method: 'DELETE' })
      },

      /**
       * Make a PATCH request
       */
      patch: <T = unknown>(url: string, data: unknown, options: Record<string, unknown> = {}) => {
        return customFetch<T>(url, { ...options, method: 'PATCH', body: data })
      },

      /**
       * Format API response into a consistent structure
       */
      formatResponse: <T>(
        response: unknown
      ): { data: T | null; success: boolean; error?: string; statusCode?: number } => {
        // If response is already in our expected format, return it
        if (response && typeof response === 'object' && 'success' in response) {
          return response
        }

        // Otherwise, format it into our standard structure
        return {
          data: response,
          success: true,
        }
      },
    }

    // Provide the API client to the app
    return {
      provide: {
        api: apiClient,
      },
    }
  },
})
