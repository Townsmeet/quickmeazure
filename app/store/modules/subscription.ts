import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Plan, PaymentMethod } from '../../types/subscription'

// Define missing types
export interface BillingHistoryItem {
  id: number
  date: string
  description: string
  amount: number
  status: 'paid' | 'pending' | 'failed' | 'refunded'
  reference?: string
}

export interface PlanLimits {
  clients: number
  styles: number
  storage: number
  [key: string]: number
}

export const useSubscriptionStore = defineStore('subscription', () => {
  // State
  const plans = ref<Plan[]>([])
  const currentPlan = ref<Plan | null>(null)
  const status = ref<{
    active: boolean
    planId: number | null
    trialEndsAt: string | null
    currentPeriodEndsAt: string | null
    canceledAt: string | null
    pastDue: boolean
  }>({
    active: false,
    planId: null,
    trialEndsAt: null,
    currentPeriodEndsAt: null,
    canceledAt: null,
    pastDue: false,
  })

  const billingHistory = ref<BillingHistoryItem[]>([])
  const paymentMethods = ref<PaymentMethod[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastFetched = ref<number>(0)

  // Computed properties
  const isSubscribed = computed(() => status.value.active && !isTrialing.value)
  const isTrialing = computed(
    () => !!status.value.trialEndsAt && new Date(status.value.trialEndsAt) > new Date()
  )
  const isCanceled = computed(() => !!status.value.canceledAt)
  const isPastDue = computed(() => status.value.pastDue)
  const trialDaysLeft = computed(() => {
    if (!status.value.trialEndsAt) return 0
    const trialEnd = new Date(status.value.trialEndsAt)
    const today = new Date()
    const diffTime = trialEnd.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  })

  // Helper function to check if a feature is available in the current plan
  const hasFeature = (featureId: string): boolean => {
    if (!currentPlan.value) return false
    return !!currentPlan.value.features?.[featureId]
  }

  // Check if current usage is within plan limits
  const isWithinLimits = (limitType: keyof PlanLimits, currentValue: number): boolean => {
    if (!currentPlan.value) return false
    let limit: number | undefined

    switch (limitType) {
      case 'clients':
        limit = currentPlan.value.maxClients
        break
      case 'styles':
        limit = currentPlan.value.maxStyles
        break
      case 'storage':
        limit = currentPlan.value.maxStorage
        break
      default:
        limit = 0
    }

    return limit === -1 || (limit !== undefined && currentValue <= limit) // -1 means unlimited
  }

  // Get a specific limit from the current plan
  const getLimit = (limitType: keyof PlanLimits): number => {
    if (!currentPlan.value) return 0

    switch (limitType) {
      case 'clients':
        return currentPlan.value.maxClients || 0
      case 'styles':
        return currentPlan.value.maxStyles || 0
      case 'storage':
        return currentPlan.value.maxStorage || 0
      default:
        return 0
    }
  }

  // State setters
  const setPlans = (newPlans: Plan[]) => {
    plans.value = newPlans
    lastFetched.value = Date.now()
  }

  const setCurrentPlan = (plan: Plan | null) => {
    currentPlan.value = plan
  }

  const setStatus = (newStatus: {
    active: boolean
    planId: number | null
    trialEndsAt: string | null
    currentPeriodEndsAt: string | null
    canceledAt: string | null
    pastDue: boolean
  }) => {
    status.value = newStatus
  }

  const setBillingHistory = (history: BillingHistoryItem[]) => {
    billingHistory.value = history
  }

  const setPaymentMethods = (methods: PaymentMethod[]) => {
    paymentMethods.value = methods
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const setError = (err: string | null) => {
    error.value = err
  }

  const clearCache = () => {
    plans.value = []
    currentPlan.value = null
    status.value = {
      active: false,
      planId: null,
      trialEndsAt: null,
      currentPeriodEndsAt: null,
      canceledAt: null,
      pastDue: false,
    }
    billingHistory.value = []
    paymentMethods.value = []
    error.value = null
    lastFetched.value = 0
  }

  return {
    // State
    plans,
    currentPlan,
    status,
    billingHistory,
    paymentMethods,
    isLoading,
    error,
    lastFetched,

    // Computed
    isSubscribed,
    isTrialing,
    isCanceled,
    isPastDue,
    trialDaysLeft,

    // Actions
    setPlans,
    setCurrentPlan,
    setStatus,
    setBillingHistory,
    setPaymentMethods,
    setLoading,
    setError,
    clearCache,
    hasFeature,
    isWithinLimits,
    getLimit,
  }
})
