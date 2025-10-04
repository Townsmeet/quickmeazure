import { defineNuxtPlugin } from '#app'
import { useAuthStore } from '~/store/modules/auth'
import { useToast } from '#imports'

export default defineNuxtPlugin(async nuxtApp => {
  // Only run on client-side
  if (import.meta.server) return

  const authStore = useAuthStore()
  const toast = useToast()
  const router = useRouter()

  // Session timeout configuration
  const SESSION_TIMEOUT_WARNING = 5 * 60 * 1000 // 5 minutes before expiry
  const SESSION_CHECK_INTERVAL = 60 * 1000 // Check every minute
  const SIGNUP_FLOW_PATHS = ['/auth/register', '/auth/confirm', '/auth/setup-measurements']

  let sessionTimeoutWarningTimer: NodeJS.Timeout | null = null
  let sessionCheckInterval: NodeJS.Timeout | null = null
  let _lastActivityTime = Date.now()

  // Function to check if we're in the signup flow
  const isInSignupFlow = () => {
    return (
      router?.currentRoute?.value?.path &&
      SIGNUP_FLOW_PATHS.includes(router.currentRoute.value.path)
    )
  }

  // Function to update last activity time
  const updateActivity = () => {
    _lastActivityTime = Date.now()
  }

  // Function to check session status
  const checkSession = () => {
    // Only check if user is authenticated
    if (!authStore.isLoggedIn) return

    const tokenExpiryTime = authStore.sessionExpiry
    if (!tokenExpiryTime) return

    const now = Date.now()
    const timeUntilExpiry = tokenExpiryTime - now

    // If in signup flow and session is about to expire, show warning
    if (
      isInSignupFlow() &&
      timeUntilExpiry <= SESSION_TIMEOUT_WARNING &&
      !sessionTimeoutWarningTimer
    ) {
      sessionTimeoutWarningTimer = setTimeout(
        () => {
          toast.info({
            title: 'Session Expiring Soon',
            description: 'Your session will expire soon. Would you like to extend it?',
            timeout: 0,
            actions: [
              {
                label: 'Extend Session',
                click: async () => {
                  try {
                    await authStore.refreshSession()
                    toast.success('Session extended successfully')
                  } catch (error) {
                    console.error('Failed to extend session:', error)
                    toast.error('Failed to extend session. Please log in again.')
                  }

                  // Clear the warning timer
                  if (sessionTimeoutWarningTimer) {
                    clearTimeout(sessionTimeoutWarningTimer)
                    sessionTimeoutWarningTimer = null
                  }
                },
              },
            ],
          })
        },
        Math.max(0, timeUntilExpiry - SESSION_TIMEOUT_WARNING)
      )
    }

    // If session has expired, handle it
    if (timeUntilExpiry <= 0) {
      // Save form data to localStorage if in signup flow
      if (isInSignupFlow()) {
        const currentPath = router.currentRoute.value.path

        // Store current progress in localStorage to recover later
        try {
          localStorage.setItem('signupFlowPath', currentPath)
          localStorage.setItem('signupFlowLastActive', new Date().toISOString())

          // Store form data based on current step
          if (currentPath === '/auth/register') {
            // Could save form data here if needed
          } else if (currentPath === '/auth/confirm') {
            // Could save selected plan here if needed
          } else if (currentPath === '/auth/setup-measurements') {
            // Could save measurement templates here if needed
          }
        } catch (e) {
          console.error('Error saving signup progress:', e)
        }
      }

      // Handle session expiry
      auth.logout()
      router.push('/auth/login?expired=true')

      toast.error('Your session has expired. Please log in again to continue.')

      // Clear timers
      if (sessionTimeoutWarningTimer) {
        clearTimeout(sessionTimeoutWarningTimer)
        sessionTimeoutWarningTimer = null
      }

      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval)
        sessionCheckInterval = null
      }
    }
  }

  // Set up event listeners for user activity
  if (import.meta.client) {
    window.addEventListener('mousemove', updateActivity)
    window.addEventListener('keypress', updateActivity)
    window.addEventListener('click', updateActivity)
    window.addEventListener('scroll', updateActivity)

    // Start the session check interval
    sessionCheckInterval = setInterval(checkSession, SESSION_CHECK_INTERVAL)

    // Check for saved signup progress on login
    nuxtApp.hook('page:finish', () => {
      // If user just logged in and there was a saved signup flow
      if (authStore.isLoggedIn && router?.currentRoute?.value?.path === '/dashboard') {
        try {
          const savedPath = localStorage.getItem('signupFlowPath')
          const lastActive = localStorage.getItem('signupFlowLastActive')

          // Only restore if saved within the last 24 hours
          if (savedPath && lastActive) {
            const lastActiveDate = new Date(lastActive)
            const now = new Date()
            const hoursSinceLastActive =
              (now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60)

            if (hoursSinceLastActive < 24 && SIGNUP_FLOW_PATHS.includes(savedPath)) {
              toast.info({
                title: 'Resume Signup',
                description: 'You have an unfinished signup process. Would you like to continue?',
                timeout: 0,
                actions: [
                  {
                    label: 'Continue Signup',
                    click: () => {
                      router.push(savedPath)
                      localStorage.removeItem('signupFlowPath')
                      localStorage.removeItem('signupFlowLastActive')
                    },
                  },
                  {
                    label: 'Start Fresh',
                    click: () => {
                      localStorage.removeItem('signupFlowPath')
                      localStorage.removeItem('signupFlowLastActive')
                    },
                  },
                ],
              })
            } else {
              // Clear old data
              localStorage.removeItem('signupFlowPath')
              localStorage.removeItem('signupFlowLastActive')
            }
          }
        } catch (e) {
          console.error('Error checking saved signup progress:', e)
        }
      }
    })
  }

  // Clean up on app unmount
  nuxtApp.hook('app:unmounted', () => {
    if (import.meta.client) {
      window.removeEventListener('mousemove', updateActivity)
      window.removeEventListener('keypress', updateActivity)
      window.removeEventListener('click', updateActivity)
      window.removeEventListener('scroll', updateActivity)

      if (sessionTimeoutWarningTimer) {
        clearTimeout(sessionTimeoutWarningTimer)
      }

      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval)
      }
    }
  })

  return {
    provide: {
      sessionTimeout: {
        updateActivity,
        checkSession,
      },
    },
  }
})
