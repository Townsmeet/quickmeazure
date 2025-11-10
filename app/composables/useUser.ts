interface UserProfile {
  id: number
  name: string
  email: string
  phone?: string
  address?: string
  businessName?: string
  businessType?: string
  avatar?: string
  preferences?: Record<string, any>
  createdAt: string
  updatedAt: string
}

interface UpdateProfileData {
  name?: string
  phone?: string
  address?: string
  businessName?: string
  businessType?: string
  preferences?: Record<string, any>
}

interface UserResponse {
  success: boolean
  data?: UserProfile
  message?: string
}

interface PasswordChangeData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export const useUser = () => {
  // State
  const userProfile = useState<UserProfile | null>('user_profile', () => null)
  const error = useState<string | null>('user_error', () => null)

  // Data fetching with useFetch
  const {
    data: profileData,
    pending: isLoading,
    refresh: refreshProfile,
  } = useFetch<UserResponse>('/api/user/profile', {
    server: false,
    default: () => ({ success: false, data: null }) as unknown as UserResponse,
    onResponse({ response }) {
      const responseData = response._data as UserResponse
      if (responseData?.success && responseData?.data) {
        userProfile.value = responseData.data
      }
    },
    onResponseError({ error: fetchError }) {
      error.value = fetchError?.message || 'Failed to fetch user profile'
    },
  })

  // Update profile (mutation with $fetch)
  const updateProfile = async (data: UpdateProfileData): Promise<UserResponse> => {
    error.value = null

    try {
      const response = await $fetch<UserResponse>('/api/user/profile', {
        method: 'PUT',
        body: data,
      })

      if (response.success && response.data) {
        userProfile.value = response.data
        await refreshProfile()
      }

      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to update profile'
      return {
        success: false,
        message: error.value || undefined,
      }
    }
  }

  // Upload avatar (mutation with $fetch)
  const uploadAvatar = async (file: File): Promise<UserResponse> => {
    error.value = null

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await $fetch<UserResponse>('/api/user/avatar', {
        method: 'POST',
        body: formData,
      })

      if (response.success && response.data) {
        userProfile.value = response.data
        await refreshProfile()
      }

      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to upload avatar'
      return {
        success: false,
        message: error.value || undefined,
      }
    }
  }

  // Delete avatar (mutation with $fetch)
  const deleteAvatar = async (): Promise<boolean> => {
    error.value = null

    try {
      const response = await $fetch<{ success: boolean }>('/api/user/avatar', {
        method: 'DELETE',
      })

      if (response.success && userProfile.value) {
        userProfile.value.avatar = undefined
        await refreshProfile()
      }

      return response.success
    } catch (err: any) {
      error.value = err.message || 'Failed to delete avatar'
      return false
    }
  }

  // Update preferences (mutation with $fetch)
  const updatePreferences = async (preferences: Record<string, any>): Promise<boolean> => {
    error.value = null

    try {
      const response = await $fetch<UserResponse>('/api/user/preferences', {
        method: 'PUT',
        body: { preferences },
      })

      if (response.success && response.data) {
        userProfile.value = response.data
        await refreshProfile()
      }

      return response.success
    } catch (err: any) {
      error.value = err.message || 'Failed to update preferences'
      return false
    }
  }

  // Delete account (mutation with $fetch)
  const deleteAccount = async (
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    error.value = null

    try {
      const response = await $fetch<{ success: boolean; message?: string }>(
        '/api/user/delete-account',
        {
          method: 'DELETE',
          body: { password },
        }
      )

      if (response.success) {
        userProfile.value = null
      }

      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to delete account'
      return {
        success: false,
        message: error.value || undefined,
      }
    }
  }

  // Get user initials for avatar fallback
  const getUserInitials = (name?: string): string => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')
  }

  // Get user display name
  const getDisplayName = (profile?: UserProfile | null): string => {
    if (!profile) return 'User'
    return profile.name || 'User'
  }

  // Get user first name
  const getFirstName = (profile?: UserProfile | null): string => {
    if (!profile?.name) return 'User'
    return profile.name.split(' ')[0] || 'User'
  }

  // Local state management
  const clearError = () => {
    error.value = null
  }

  return {
    // State
    userProfile: readonly(userProfile),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // API Actions
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    updatePreferences,
    deleteAccount,

    // Utility Functions
    getUserInitials,
    getDisplayName,
    getFirstName,

    // Refresh Actions
    refreshProfile,

    // Local State Actions
    clearError,
  }
}
