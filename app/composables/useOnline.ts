/**
 * Composable for tracking online/offline status
 * Provides reactive online status and utility functions
 */
export const useOnline = () => {
  // Reactive online status
  const isOnline = ref(true)

  // Initialize and set up event listeners (client-side only)
  const init = () => {
    if (typeof window !== 'undefined') {
      // Set initial status
      isOnline.value = navigator.onLine

      // Listen for online/offline events
      const handleOnline = () => {
        isOnline.value = true
      }

      const handleOffline = () => {
        isOnline.value = false
      }

      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      // Cleanup function
      const cleanup = () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }

      // Auto-cleanup on unmount
      onUnmounted(cleanup)

      return cleanup
    }
  }

  // Computed properties
  const isOffline = computed(() => !isOnline.value)

  // Utility functions
  const checkOnlineStatus = () => {
    if (typeof navigator !== 'undefined') {
      isOnline.value = navigator.onLine
      return navigator.onLine
    }
    return true // Assume online on server
  }

  const getNetworkError = () => {
    return new Error('Network error. Please check your internet connection.')
  }

  const throwIfOffline = () => {
    if (!isOnline.value) {
      throw getNetworkError()
    }
  }

  // Initialize on first use
  if (typeof window !== 'undefined') {
    init()
  }

  return {
    isOnline: readonly(isOnline),
    isOffline,
    checkOnlineStatus,
    getNetworkError,
    throwIfOffline,
  }
}
