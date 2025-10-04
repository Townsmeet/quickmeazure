import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

// Types
import type { User } from '../../types/auth'
import type { UserPreferences } from '../../types/user'
import type { Plan } from '../../types/subscription'

// Define a type that can be either a Plan object or a string plan name
type SubscriptionPlanType = Plan | string

/**
 * User store for managing user profile data, subscription status, and preferences
 * This store handles only state management - all API calls should be made through useUserApi
 */
export const useUserStore = defineStore('user', () => {
  // State
  const profile = ref<User | null>(null)
  const preferences = ref<UserPreferences>({
    theme: 'system',
    measurementUnit: 'imperial',
    dateFormat: 'MM/DD/YYYY',
    notifications: {
      email: true,
      browser: true,
      mobile: true,
    },
    dashboardLayout: 'default',
  })

  const subscriptionDetails = ref<{
    plan: SubscriptionPlanType | null
    status: 'active' | 'inactive' | 'trial' | 'expired'
    expiryDate: string | null
    features: string[]
    clientLimit: number
  }>({
    plan: null,
    status: 'inactive',
    expiryDate: null,
    features: [],
    clientLimit: 0,
  })

  // Computed properties
  const isSubscriptionActive = computed(() => {
    return (
      subscriptionDetails.value.status === 'active' || subscriptionDetails.value.status === 'trial'
    )
  })

  const displayName = computed(() => {
    if (!profile.value) return ''
    return profile.value.name || profile.value.email.split('@')[0]
  })

  const initials = computed(() => {
    if (!profile.value?.name) return ''
    return profile.value.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  })

  // Actions
  /**
   * Initialize the user store with user data
   * @param userData User data from auth store or API
   */
  function init(userData: User | null) {
    profile.value = userData
    if (userData) {
      updateSubscriptionDetails(userData)
    }
    loadPreferences()
  }

  /**
   * Load user preferences from localStorage
   */
  function loadPreferences() {
    if (typeof window !== 'undefined') {
      try {
        const savedPreferences = localStorage.getItem('user-preferences')
        if (savedPreferences) {
          preferences.value = {
            ...preferences.value,
            ...JSON.parse(savedPreferences),
          }
        }
      } catch (error) {
        console.error('Failed to load user preferences from localStorage', error)
      }
    }
  }

  /**
   * Update user profile data in the store
   * @param userData Updated user data
   */
  function updateProfile(userData: Partial<User>) {
    if (!profile.value) return

    profile.value = {
      ...profile.value,
      ...userData,
    }

    // Update subscription details if relevant fields changed
    if (userData.subscriptionPlan || userData.subscriptionExpiry) {
      updateSubscriptionDetails(profile.value)
    }
  }

  /**
   * Update subscription details in the store
   */
  function updateSubscriptionDetails(userData: User) {
    const plan = userData.subscriptionPlan || 'free'
    const expiryDate = userData.subscriptionExpiry

    // Determine subscription status
    let status: 'active' | 'inactive' | 'trial' | 'expired' = 'inactive'

    if (plan === 'free') {
      status = 'inactive'
    } else if (plan === 'trial') {
      status = expiryDate && new Date(expiryDate) > new Date() ? 'trial' : 'expired'
    } else {
      status = expiryDate && new Date(expiryDate) > new Date() ? 'active' : 'expired'
    }

    // Set features and limits based on plan
    const features = getFeaturesByPlan(plan)
    const clientLimit = getClientLimitByPlan(plan)

    subscriptionDetails.value = {
      plan,
      status,
      expiryDate,
      features,
      clientLimit,
    }
  }

  /**
   * Update user preferences in the store and localStorage
   * @param newPreferences Updated preferences
   */
  function updatePreferences(newPreferences: Partial<UserPreferences>) {
    preferences.value = {
      ...preferences.value,
      ...newPreferences,
    }
    savePreferences()
  }

  /**
   * Save preferences to localStorage
   */
  function savePreferences() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('user-preferences', JSON.stringify(preferences.value))
      } catch (error) {
        console.error('Failed to save user preferences to localStorage', error)
      }
    }
  }

  /**
   * Reset user store state
   * Preserves preferences as they should persist across sessions
   */
  function reset() {
    profile.value = null
    subscriptionDetails.value = {
      plan: null,
      status: 'inactive',
      expiryDate: null,
      features: [],
      clientLimit: 0,
    }
  }

  /**
   * Check if user has access to a specific feature
   * @param featureName Name of the feature to check
   */
  function hasFeatureAccess(featureName: string): boolean {
    return subscriptionDetails.value.features.includes(featureName)
  }

  /**
   * Get remaining client slots
   * @param currentClientCount Current number of clients
   */
  function getRemainingClientSlots(currentClientCount: number): number {
    return Math.max(0, subscriptionDetails.value.clientLimit - currentClientCount)
  }

  /**
   * Get features available for a specific subscription plan
   * @param plan The subscription plan
   * @returns Array of feature names
   */
  function getFeaturesByPlan(plan: SubscriptionPlanType): string[] {
    const features: Record<string, string[]> = {
      free: ['Basic client management', 'Up to 5 clients', 'Basic measurements', 'Email support'],
      basic: [
        'Everything in Free',
        'Up to 50 clients',
        'Advanced measurements',
        'Priority email support',
        'Basic reporting',
      ],
      pro: [
        'Everything in Basic',
        'Unlimited clients',
        'Premium measurements',
        '24/7 priority support',
        'Advanced reporting',
        'API access',
      ],
      trial: ['Full access to all Pro features', 'Limited time trial', 'Upgrade anytime'],
    }

    return features[plan] || features.free
  }

  /**
   * Get client limit for a specific subscription plan
   * @param plan The subscription plan
   * @returns Maximum number of clients allowed
   */
  function getClientLimitByPlan(plan: SubscriptionPlanType): number {
    const limits: Record<string, number> = {
      free: 5,
      basic: 50,
      pro: Number.POSITIVE_INFINITY, // Unlimited
      trial: 100, // Higher limit for trial
    }

    return limits[plan] || limits.free
  }

  // Return public store interface
  return {
    // State
    profile,
    preferences,
    subscriptionDetails,

    // Computed
    isSubscriptionActive,
    displayName,
    initials,

    // Actions
    init,
    updateProfile,
    updateSubscriptionDetails,
    updatePreferences,
    loadPreferences,
    savePreferences,
    reset,
    hasFeatureAccess,
    getRemainingClientSlots,
    getFeaturesByPlan,
    getClientLimitByPlan,
  }
})
