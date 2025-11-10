import type { Plan } from '~/types/subscription'

// Extended types for billing form
export interface SubscriptionWithPlan {
  id: number
  userId: string
  planId: number
  status: string
  startDate: string
  endDate?: string | null
  billingPeriod: 'monthly' | 'annual'
  amount: number
  nextBillingDate?: string | null
  canceledAt?: string | null
  currentPeriodEndsAt?: string | null
  plan?: Plan | null
}

export interface PaymentMethodExtended {
  id: number
  userId: string
  type: string
  last4?: string | null
  expiryMonth?: string | null
  expiryYear?: string | null
  brand?: string | null
  isDefault: boolean
  provider: string
  createdAt: string
  updatedAt?: string | null
}

export interface PaymentExtended {
  id: number
  date: string
  description: string
  amount: number
  status: string
  reference?: string | null
  metadata?: any
}

interface SubscriptionResponse {
  success: boolean
  data?: SubscriptionWithPlan
  message?: string
}

interface PaymentMethodsResponse {
  success: boolean
  data?: PaymentMethodExtended[]
  message?: string
}

interface BillingHistoryResponse {
  success: boolean
  data?: PaymentExtended[]
  message?: string
}

export const useBilling = () => {
  // State
  const subscription = useState<SubscriptionWithPlan | null>('billing_subscription', () => null)
  const paymentMethods = useState<PaymentMethodExtended[]>('billing_payment_methods', () => [])
  const billingHistory = useState<PaymentExtended[]>('billing_history', () => [])
  const error = useState<string | null>('billing_error', () => null)

  // Loading states
  const isLoadingSubscription = ref(false)
  const isLoadingPaymentMethods = ref(false)
  const isLoadingBillingHistory = ref(false)

  // Fetch current subscription
  const fetchCurrentSubscription = async (): Promise<SubscriptionWithPlan | null> => {
    isLoadingSubscription.value = true
    error.value = null

    try {
      const response = await $fetch<SubscriptionResponse>('/api/subscriptions/current')

      if (response.success && response.data) {
        subscription.value = response.data
        return response.data
      }

      subscription.value = null
      return null
    } catch (err: any) {
      error.value = err.message || 'Failed to load subscription information'
      subscription.value = null
      throw err
    } finally {
      isLoadingSubscription.value = false
    }
  }

  // Fetch payment methods
  const fetchPaymentMethods = async (): Promise<PaymentMethodExtended[]> => {
    isLoadingPaymentMethods.value = true
    error.value = null

    try {
      const response = await $fetch<PaymentMethodsResponse>('/api/subscriptions/payment-methods')

      if (response.success && response.data) {
        paymentMethods.value = response.data
        return response.data
      }

      paymentMethods.value = []
      return []
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch payment methods'
      paymentMethods.value = []
      return []
    } finally {
      isLoadingPaymentMethods.value = false
    }
  }

  // Fetch billing history
  const fetchBillingHistory = async (): Promise<PaymentExtended[]> => {
    isLoadingBillingHistory.value = true
    error.value = null

    try {
      const response = await $fetch<BillingHistoryResponse>('/api/subscriptions/billing-history')

      if (response.success && response.data) {
        billingHistory.value = response.data
        return response.data
      }

      billingHistory.value = []
      return []
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch billing history'
      billingHistory.value = []
      return []
    } finally {
      isLoadingBillingHistory.value = false
    }
  }

  // Set default payment method
  const setDefaultPaymentMethod = async (methodId: number): Promise<boolean> => {
    error.value = null

    try {
      const response = await $fetch<{ success: boolean }>(
        '/api/subscriptions/payment-methods/set-default',
        {
          method: 'POST',
          body: { paymentMethodId: methodId },
        }
      )

      if (response.success) {
        await fetchPaymentMethods()
        return true
      }

      return false
    } catch (err: any) {
      error.value = err.message || 'Failed to update default payment method'
      return false
    }
  }

  // Remove payment method
  const removePaymentMethod = async (methodId: number): Promise<boolean> => {
    error.value = null

    try {
      const response = await $fetch<{ success: boolean }>(
        `/api/subscriptions/payment-methods/${methodId}`,
        {
          method: 'DELETE',
        }
      )

      if (response.success) {
        await fetchPaymentMethods()
        return true
      }

      return false
    } catch (err: any) {
      error.value = err.message || 'Failed to remove payment method'
      return false
    }
  }

  // Download invoice
  const downloadInvoice = async (paymentId: number): Promise<boolean> => {
    error.value = null

    try {
      await $fetch(`/api/subscriptions/invoice/${paymentId}`, {
        method: 'GET',
      })

      return true
    } catch (err: any) {
      error.value = err.message || 'Failed to download invoice'
      return false
    }
  }

  // Refresh all billing data
  const refreshAll = async (): Promise<void> => {
    await Promise.all([fetchCurrentSubscription(), fetchPaymentMethods(), fetchBillingHistory()])
  }

  // Clear error
  const clearError = () => {
    error.value = null
  }

  return {
    // State
    subscription: readonly(subscription),
    paymentMethods: readonly(paymentMethods),
    billingHistory: readonly(billingHistory),
    error: readonly(error),

    // Loading states
    isLoadingSubscription: readonly(isLoadingSubscription),
    isLoadingPaymentMethods: readonly(isLoadingPaymentMethods),
    isLoadingBillingHistory: readonly(isLoadingBillingHistory),

    // Actions
    fetchCurrentSubscription,
    fetchPaymentMethods,
    fetchBillingHistory,
    setDefaultPaymentMethod,
    removePaymentMethod,
    downloadInvoice,
    refreshAll,
    clearError,
  }
}
