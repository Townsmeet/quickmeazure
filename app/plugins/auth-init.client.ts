// Auth initialization plugin - ensures auth state is loaded on app startup
export default defineNuxtPlugin(async () => {
  // Only run on client side
  if (import.meta.server) return

  const { init } = useAuth()

  // Initialize auth state on app startup
  try {
    await init()
  } catch (error) {
    // Silently fail - auth state will be null/unauthenticated
    console.warn('Failed to initialize auth state:', error)
  }
})
