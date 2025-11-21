// Google One Tap plugin - shows the floating Google sign-in prompt
export default defineNuxtPlugin(() => {
  // Only run on client side
  if (import.meta.server) return

  const { showOneTap, disableOneTap } = useGoogleOneTap()
  const { isAuthenticated } = useAuth()
  const route = useRoute()

  // Configuration
  // const allowedPages = ['/', '/auth/login', '/auth/register']
  const allowedPages = ['/this-disables-one-tap']
  const delay = 1500 // 1.5 seconds after page load

  // Show One Tap conditionally
  const showOneTapConditionally = () => {
    // Don't show if user is authenticated
    if (isAuthenticated.value) {
      disableOneTap()
      return
    }

    // Only show on allowed pages
    if (allowedPages.includes(route.path)) {
      showOneTap({
        delay,
        allowedPages,
      })
    }
  }

  // Initialize when app is mounted
  onMounted(() => {
    // Small delay to ensure auth state is loaded
    setTimeout(() => {
      showOneTapConditionally()
    }, 500)
  })

  // Handle route changes
  watch(
    () => route.path,
    () => {
      // Disable current One Tap instance
      disableOneTap()

      // Show on new page if applicable
      setTimeout(() => {
        showOneTapConditionally()
      }, 500)
    }
  )

  // Handle auth state changes
  watch(isAuthenticated, newValue => {
    if (newValue) {
      // User just authenticated, disable One Tap
      disableOneTap()
    } else {
      // User logged out, potentially show One Tap again
      setTimeout(() => {
        showOneTapConditionally()
      }, 1000)
    }
  })
})
