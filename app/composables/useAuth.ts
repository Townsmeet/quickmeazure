import { authClient } from '~/utils/auth-client'
import type { User } from 'better-auth'

export const useAuth = () => {
  const user = useState<User | null>('auth_user', () => null)
  const isAuthenticated = computed(() => !!user.value)
  const isLoading = useState<boolean>('auth_loading', () => false)
  const initialized = useState<boolean>('auth_initialized', () => false)
  const { isOnline, getNetworkError } = useOnline()

  // Initialize auth state once
  const init = async () => {
    if (initialized.value) return
    // If we already have a user (e.g., just logged in), mark initialized and skip network
    if (user.value) {
      initialized.value = true
      return
    }
    try {
      isLoading.value = true
      const { data } = await authClient.getSession()
      user.value = data?.user || null
    } catch {
      user.value = null
    } finally {
      isLoading.value = false
      initialized.value = true
    }
  }

  // Login with email/password
  const login = async (email: string, password: string, rememberMe = false) => {
    isLoading.value = true

    // Check if browser is offline first
    if (!isOnline.value) {
      isLoading.value = false
      return { error: getNetworkError() }
    }

    const { data, error } = await authClient.signIn.email({
      email,
      password,
      rememberMe,
    })

    // Handle Better Auth API errors
    if (error) {
      isLoading.value = false
      return { error: new Error(error.message) }
    }

    // Update user state
    user.value = data.user

    isLoading.value = false
    return { error: null }
  }

  // Register with email/password
  const register = async (name: string, email: string, password: string) => {
    isLoading.value = true

    // Check if browser is offline first
    if (!isOnline.value) {
      isLoading.value = false
      return { error: getNetworkError() }
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
      return { error: getNetworkError() }
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
      return { error: getNetworkError() }
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
      return { error: getNetworkError() }
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
  }
}
