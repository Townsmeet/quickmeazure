import { authClient } from '~/utils/auth-client'
import type { User } from 'better-auth'

export const useAuth = () => {
  const user = useState<User | null>('auth_user', () => null)
  const isAuthenticated = computed(() => !!user.value)
  const isLoading = useState<boolean>('auth_loading', () => false)
  const initialized = useState<boolean>('auth_initialized', () => false)

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
    try {
      isLoading.value = true
      const { data, error } = await authClient.signIn.email({
        email,
        password,
        rememberMe,
      })
      if (error) throw new Error(extractMessage(error) ?? 'Try again later or contact support')

      if (!data?.user) {
        throw new Error('No user data returned from authentication')
      }

      // Update user state
      user.value = data.user
      return { error: null }
    } catch (error: unknown) {
      user.value = null
      // Preserve backend error message if present
      const normalized =
        error instanceof Error ? error : new Error('An unknown error occurred during login')
      return { error: normalized }
    } finally {
      isLoading.value = false
    }
  }

  // Register with email/password
  const register = async (email: string, password: string, name: string) => {
    try {
      isLoading.value = true
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name,
      })
      if (error) throw new Error(extractMessage(error) ?? 'Try again later or contact support')

      if (!data?.user) {
        throw new Error('No user data returned from registration')
      }

      // Update user state
      user.value = data.user
      return { error: null }
    } catch (error: unknown) {
      user.value = null
      const normalized =
        error instanceof Error ? error : new Error('An unknown error occurred during registration')
      return { error: normalized }
    } finally {
      isLoading.value = false
    }
  }

  // Request password reset
  const requestPasswordReset = async (email: string) => {
    try {
      isLoading.value = true
      const res = await authClient.forgetPassword({
        email,
        redirectTo: '/auth/reset-password',
      })
      if (res?.error)
        throw new Error(extractMessage(res.error) ?? 'Try again later or contact support')

      return { error: null }
    } catch (error: unknown) {
      const normalized = error instanceof Error ? error : new Error('Failed to send reset email')
      return { error: normalized }
    } finally {
      isLoading.value = false
    }
  }

  // Reset password with token
  const resetPassword = async (token: string, password: string) => {
    try {
      isLoading.value = true
      const res = await authClient.resetPassword({
        token,
        newPassword: password,
      })
      if (res?.error)
        throw new Error(extractMessage(res.error) ?? 'Try again later or contact support')

      return { error: null }
    } catch (error: unknown) {
      const normalized = error instanceof Error ? error : new Error('Failed to reset password')
      return { error: normalized }
    } finally {
      isLoading.value = false
    }
  }

  // Logout
  const logout = async () => {
    try {
      await authClient.signOut()
      user.value = null
      return navigateTo('/auth/login')
    } catch (error: unknown) {
      const normalized = error instanceof Error ? error : new Error('Logout failed')
      return { error: normalized }
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
  }
}

// Helpers
function extractMessage(val: unknown): string | null {
  if (!val) return null
  if (val instanceof Error) return val.message
  if (typeof val === 'string') return val
  if (typeof val === 'object') {
    // common shapes: { message: string }
    const obj = val as { message?: unknown }
    if (typeof obj.message === 'string') return obj.message
  }
  return null
}
