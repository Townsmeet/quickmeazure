// Google One Tap implementation
export const useGoogleOneTap = () => {
  const { signInWithGoogle, isAuthenticated } = useAuth()
  const toast = useToast()
  const config = useRuntimeConfig()
  const route = useRoute()

  // State to track if One Tap is initialized
  const isInitialized = ref(false)
  const isLoading = ref(false)

  // Initialize Google One Tap
  const initializeOneTap = () => {
    if (typeof window === 'undefined' || isInitialized.value) return
    if (!config.public.googleClientId) return

    // Don't show if user is already authenticated
    if (isAuthenticated.value) return

    // Load Google Identity Services script if not already loaded
    if (!document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = setupOneTap
      document.head.appendChild(script)
    } else {
      setupOneTap()
    }
  }

  // Setup Google One Tap
  const setupOneTap = () => {
    if (!window.google || isInitialized.value) return

    try {
      window.google.accounts.id.initialize({
        client_id: config.public.googleClientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
        context: 'signin',
        ux_mode: 'popup',
        itp_support: true,
      })

      // Show the One Tap prompt
      window.google.accounts.id.prompt()

      isInitialized.value = true
    } catch (error) {
      // Silently fail if Google One Tap setup fails
    }
  }

  // Handle the credential response from One Tap
  const handleCredentialResponse = async (response: CredentialResponse) => {
    if (isLoading.value) return

    isLoading.value = true

    try {
      // Use Better Auth's Google OAuth flow
      const { error } = await signInWithGoogle()

      if (error) {
        toast.add({
          title: 'Sign-in Failed',
          description: error.message,
          color: 'error',
        })
      } else {
        toast.add({
          title: 'Welcome back!',
          description: 'Successfully signed in with Google',
          color: 'success',
        })
      }
    } catch (error) {
      toast.add({
        title: 'Sign-in Failed',
        description: 'Something went wrong. Please try again.',
        color: 'error',
      })
    } finally {
      isLoading.value = false
    }
  }

  // Show One Tap on specific conditions
  const showOneTap = (conditions: any = {}) => {
    const defaultConditions = {
      delay: 1000,
      allowedPages: ['/', '/auth/login', '/auth/register'],
    }

    const finalConfig = { ...defaultConditions, ...conditions }

    // Check if current page is allowed
    if (!finalConfig.allowedPages.includes(route.path)) return

    // Don't show if already authenticated
    if (isAuthenticated.value) return

    setTimeout(() => {
      initializeOneTap()
    }, finalConfig.delay)
  }

  // Disable One Tap (useful for cleanup)
  const disableOneTap = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.cancel()
    }
  }

  return {
    initializeOneTap,
    showOneTap,
    disableOneTap,
    isLoading: readonly(isLoading),
    isInitialized: readonly(isInitialized),
  }
}
