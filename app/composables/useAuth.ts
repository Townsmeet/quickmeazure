import { authClient } from '~/utils/auth-client'
import type { User } from 'better-auth'
import {
  getCurrentOnboardingStep,
  getRequiredOnboardingPath,
  canAccessPath,
  getOnboardingProgress,
  getOnboardingStatusMessage,
} from '~/utils/onboarding'

// Extended user type with onboarding fields
type ExtendedUser = User & {
  hasActiveSubscription?: boolean
  hasCompletedSetup?: boolean
  subscriptionStatus?: string
  onboardingStep?: string
  onboardingCompletedAt?: Date | null
}

export const useAuth = () => {
  // Use persistent cookie storage for user data
  const user = useCookie<ExtendedUser | null>('auth_user', {
    default: () => null,
    httpOnly: false, // Accessible on client-side
    secure: true, // HTTPS only in production
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  const isAuthenticated = computed(() => !!user.value)
  const isLoading = useState<boolean>('auth_loading', () => false)
  const initialized = useState<boolean>('auth_initialized', () => false)
  const { isOnline, getNetworkError } = useOnline()

  // Onboarding computed properties
  const currentOnboardingStep = computed(() => getCurrentOnboardingStep(user.value))
  const requiredOnboardingPath = computed(() => getRequiredOnboardingPath(user.value))
  const onboardingProgress = computed(() => getOnboardingProgress(user.value))
  const onboardingStatusMessage = computed(() => getOnboardingStatusMessage(user.value))
  const isFullyOnboarded = computed(() => currentOnboardingStep.value === 'complete')

  // Initialize auth state once with Better Auth best practices
  const init = async () => {
    if (initialized.value) return

    // If we already have a user (e.g., just logged in), mark initialized and skip network
    if (user.value) {
      initialized.value = true
      return
    }

    try {
      isLoading.value = true

      // Better Auth recommendation: Always call getSession
      // Better Auth internally handles session validation and caching
      const { data, error } = await authClient.getSession()

      if (error) {
        user.value = null
      } else {
        user.value = data?.user || null
      }
    } catch {
      user.value = null
    } finally {
      isLoading.value = false
      initialized.value = true
    }
  }

  // Login with email/password
  // Update the login function in useAuth.ts
  const login = async (email: string, password: string, rememberMe = false) => {
    isLoading.value = true

    // Check if browser is offline first
    if (!isOnline.value) {
      isLoading.value = false
      return { error: String(getNetworkError()) }
    }

    try {
      // Sign in first
      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
        rememberMe,
      })

      if (signInError) {
        throw new Error(signInError.message)
      }

      // Then get the full session with additional fields
      const { data: sessionData, error: sessionError } = await authClient.getSession()

      if (sessionError) {
        throw new Error(sessionError.message)
      }

      // Update user state with the full session data
      user.value = sessionData?.user || null
      return { error: null }
    } catch (error: any) {
      return { error: new Error(error.message || 'Login failed') }
    } finally {
      isLoading.value = false
    }
  }

  // Register with email/password
  const register = async (name: string, email: string, password: string) => {
    isLoading.value = true

    // Check if browser is offline first
    if (!isOnline.value) {
      isLoading.value = false
      return { error: String(getNetworkError()) }
    }

    const { error } = await authClient.signUp.email({
      email,
      password,
      name,
    })

    // Handle Better Auth API errors
    if (error) {
      isLoading.value = false
      return { error: new Error(error.message) }
    }

    // Since we disabled automatic email sending, manually send verification email
    try {
      const { error: emailError } = await authClient.sendVerificationEmail({
        email,
        callbackURL: '/auth/verify-callback',
      })
      if (emailError) {
        console.warn('Failed to send verification email:', emailError)
        // Don't fail registration if email sending fails
      }
    } catch (emailError) {
      console.warn('Failed to send verification email:', emailError)
      // Don't fail registration if email sending fails
    }

    // With email verification enabled, user won't be automatically logged in
    // Instead, they need to verify their email first
    isLoading.value = false
    return {
      error: null,
      requiresVerification: true,
      email: email,
    }
  }

  // Request password reset
  const requestPasswordReset = async (email: string) => {
    isLoading.value = true

    // Check if browser is offline first
    if (!isOnline.value) {
      isLoading.value = false
      return { error: String(getNetworkError()) }
    }

    const { error } = await authClient.forgetPassword({
      email,
      redirectTo: '/auth/reset-password',
    })

    // Handle Better Auth API errors
    if (error) {
      isLoading.value = false
      return { error: new Error(error.message) }
    }

    isLoading.value = false
    return { error: null }
  }

  // Reset password with token
  const resetPassword = async (token: string, password: string) => {
    isLoading.value = true

    // Check if browser is offline first
    if (!isOnline.value) {
      isLoading.value = false
      return { error: String(getNetworkError()) }
    }

    const { error } = await authClient.resetPassword({
      token,
      newPassword: password,
    })

    // Handle Better Auth API errors
    if (error) {
      isLoading.value = false
      return { error: new Error(error.message) }
    }

    isLoading.value = false
    return { error: null }
  }

  // Send verification email
  const sendVerificationEmail = async (email: string) => {
    isLoading.value = true

    // Check if browser is offline first
    if (!isOnline.value) {
      isLoading.value = false
      return { error: String(getNetworkError()) }
    }

    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: '/auth/verify-callback',
    })

    // Handle Better Auth API errors
    if (error) {
      isLoading.value = false
      return { error: new Error(error.message) }
    }

    isLoading.value = false
    return { error: null }
  }

  // Google Sign In (for existing users)
  const signInWithGoogle = async () => {
    // Check if browser is offline first
    if (!isOnline.value) {
      return { error: String(getNetworkError()) }
    }

    try {
      const { error } = await authClient.linkSocial({
        provider: 'google',
        callbackURL: '/dashboard', // Direct redirect to dashboard for existing users
      })

      if (error) {
        return { error: new Error(error.message) }
      }

      return { error: null }
    } catch (error: any) {
      return { error: new Error(error.message || 'Google sign-in failed') }
    }
  }

  // Google Sign Up (for new users)
  const signUpWithGoogle = async () => {
    // Check if browser is offline first
    if (!isOnline.value) {
      return { error: String(getNetworkError()) }
    }

    try {
      const { error } = await authClient.linkSocial({
        provider: 'google',
        callbackURL: '/auth/confirm', // Direct redirect to plan selection for new users
      })
      if (error) {
        return { error: new Error(error.message) }
      }

      return { error: null }
    } catch (error: any) {
      return { error: new Error(error.message || 'Google sign-up failed') }
    }
  }

  // Logout
  const logout = async () => {
    const { error } = await authClient.signOut()

    // Clear user state regardless of server response
    user.value = null

    // Handle Better Auth API errors (but still navigate to login)
    if (error) {
      await navigateTo('/auth/login')
      return { error: new Error(error.message) }
    }

    return navigateTo('/auth/login')
  }

  // Helper function to check if user can access a path
  const canUserAccessPath = (path: string) => canAccessPath(user.value, path)

  // Change password with Better Auth
  const changePassword = async (
    currentPassword: string,
    newPassword: string,
    revokeOtherSessions: boolean = true
  ): Promise<{ success: boolean; error?: string }> => {
    isLoading.value = true

    try {
      if (!isOnline.value) {
        isLoading.value = false
        return { success: false, error: String(getNetworkError()) }
      }
      const { data, error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions,
      })
      isLoading.value = false
      if (error) {
        return { success: false, error: error.message }
      }
      return { success: true }
    } catch (err: any) {
      isLoading.value = false
      return { success: false, error: err?.message || 'Failed to change password' }
    }
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    init,
    login,
    register,
    logout,
    requestPasswordReset,
    resetPassword,
    sendVerificationEmail,
    signInWithGoogle,
    signUpWithGoogle,
    // Onboarding utilities
    currentOnboardingStep,
    requiredOnboardingPath,
    onboardingProgress,
    onboardingStatusMessage,
    isFullyOnboarded,
    canUserAccessPath,
    changePassword, // <-- add here
  }
}
