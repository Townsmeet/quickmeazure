import { useAuthStore } from '../../store/modules/auth'
import { useToast } from '#imports'

interface SubscriptionData {
  planId: string
  planName?: string
  billingPeriod: string
  amount?: number
}

interface SubscriptionResponse {
  success: boolean
  data?: unknown
  error?: string
}

/**
 * Composable for managing subscription-related operations
 */
export function useSubscriptionManagement() {
  const _authStore = useAuthStore()
  const toast = useToast()

  /**
   * Load subscription data
   */
  const loadSubscription = async (): Promise<SubscriptionResponse> => {
    try {
      const data = await $fetch('/api/subscriptions/current', {
        method: 'GET',
      })

      return { success: true, data }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const message =
        (error as any).response?.data?.message || errorMessage || 'Failed to load subscription'
      toast.add({
        title: 'Error',
        description: message,
        color: 'error',
      })
      return { success: false, error: message }
    }
  }

  /**
   * Create a new subscription
   */
  const createSubscription = async (
    subscriptionData: SubscriptionData
  ): Promise<SubscriptionResponse> => {
    try {
      const data = await $fetch('/api/subscriptions/create', {
        method: 'POST',
        body: subscriptionData,
      })

      return { success: true, data }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const message =
        (error as any).response?.data?.message || errorMessage || 'Failed to create subscription'
      toast.add({
        title: 'Error',
        description: message,
        color: 'error',
      })
      return { success: false, error: message }
    }
  }

  return {
    loadSubscription,
    createSubscription,
  }
}
