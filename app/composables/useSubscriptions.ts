interface CreateSubscriptionData {
  planId: string
  planName: string
  billingPeriod: string
  amount: number
}

interface Subscription {
  id: string
  planId: string
  planName: string
  billingPeriod: string
  amount: number
  status: string
  createdAt: string
  updatedAt: string
}

interface SubscriptionResponse {
  success: boolean
  data?: Subscription
  message?: string
}

export const useSubscriptions = () => {
  // State
  const currentSubscription = useState<Subscription | null>('subscription_current', () => null)
  const error = useState<string | null>('subscription_error', () => null)
  const isLoading = ref(false)

  // Manual subscription fetching - only when explicitly requested
  const refreshSubscription = async () => {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean; data: Subscription }>(
        '/api/subscriptions/current'
      )

      if (response.success && response.data) {
        currentSubscription.value = response.data
      } else {
        currentSubscription.value = null
      }

      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch subscription'
      currentSubscription.value = null
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Create subscription (mutation with $fetch)
  const createSubscription = async (
    data: CreateSubscriptionData
  ): Promise<SubscriptionResponse> => {
    error.value = null

    try {
      const response = await $fetch<SubscriptionResponse>('/api/subscriptions/create', {
        method: 'POST',
        body: data,
      })

      if (response.success && response.data) {
        currentSubscription.value = response.data
        // No need to refresh since we already have the data
      }

      return response
    } catch (err: any) {
      // Extract error message from the response
      let errorMessage = 'Failed to create subscription'

      if (err.data?.message) {
        errorMessage = err.data.message
      } else if (err.message) {
        errorMessage = err.message
      } else if (err.statusMessage) {
        errorMessage = err.statusMessage
      }

      error.value = errorMessage
      return {
        success: false,
        message: errorMessage,
      }
    }
  }

  // Get current subscription (computed from useFetch data)
  const getCurrentSubscription = (): Subscription | null => {
    return currentSubscription.value
  }

  // Cancel subscription (mutation with $fetch)
  const cancelSubscription = async (): Promise<boolean> => {
    error.value = null

    try {
      const response = await $fetch<{ success: boolean }>('/api/subscriptions/cancel', {
        method: 'POST',
      })

      if (response.success) {
        currentSubscription.value = null
        await refreshSubscription()
      }

      return response.success
    } catch (err: any) {
      error.value = err.message || 'Failed to cancel subscription'
      return false
    }
  }

  // Change subscription plan (mutation with $fetch)
  const changeSubscriptionPlan = async (
    planId: string,
    billingPeriod: string
  ): Promise<boolean> => {
    error.value = null

    try {
      const response = await $fetch<{ success: boolean; data: Subscription }>(
        '/api/subscriptions/change-plan',
        {
          method: 'POST',
          body: {
            planId,
            billingPeriod,
          },
        }
      )

      if (response.success && response.data) {
        currentSubscription.value = response.data
        await refreshSubscription()
      }

      return response.success
    } catch (err: any) {
      error.value = err.message || 'Failed to change subscription plan'
      return false
    }
  }

  // Load subscription (for compatibility with existing code)
  const loadSubscription = async (): Promise<{
    success: boolean
    data?: Subscription
    error?: string
  }> => {
    try {
      await refreshSubscription()
      return {
        success: true,
        data: currentSubscription.value || undefined,
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load subscription'
      error.value = errorMessage
      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  return {
    // State
    currentSubscription: readonly(currentSubscription),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Actions
    createSubscription,
    getCurrentSubscription,
    cancelSubscription,
    changeSubscriptionPlan,
    loadSubscription,
    refreshSubscription,
  }
}
