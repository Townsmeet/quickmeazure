<template>
  <div class="space-y-6">
    <UCard>
      <template #header>
        <div class="flex items-center">
          <UIcon name="i-heroicons-credit-card" class="mr-2 text-primary-500 h-5 w-5" />
          <h2 class="text-xl font-semibold text-gray-900">Billing & Subscription</h2>
        </div>
        <p class="mt-1 text-sm text-gray-500">Manage your subscription plan and payment methods.</p>
      </template>

      <div v-if="loading" class="py-8 flex flex-col items-center justify-center">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400 mb-2" />
        <p class="text-sm text-gray-500">Loading subscription information...</p>
      </div>

      <div v-else-if="error" class="py-8 flex flex-col items-center justify-center">
        <UIcon name="i-heroicons-exclamation-circle" class="h-8 w-8 text-red-500 mb-2" />
        <p class="text-sm text-gray-700 mb-2">{{ error }}</p>
        <UButton size="sm" @click="refreshSubscription">Retry</UButton>
      </div>

      <div v-else class="space-y-6">
        <!-- Current Plan -->
        <div>
          <h3 class="text-base font-medium text-gray-900 mb-4">Current Plan</h3>

          <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-bold text-primary-800 mb-1">{{ displayPlanName }}</h3>
                <div v-if="showStatusPill" class="flex items-center">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="statusClass"
                  >
                    {{ statusText }}
                  </span>
                </div>
              </div>
              <div class="flex space-x-2">
                <UButton
                  v-if="plans.length > 0"
                  color="neutral"
                  variant="soft"
                  @click="showChangePlanDialog"
                >
                  {{ isSubscribed ? 'Change Plan' : 'Subscribe' }}
                </UButton>
                <UButton
                  v-if="isSubscribed && !isCanceled"
                  color="error"
                  variant="soft"
                  @click="cancelSubscription"
                >
                  Cancel
                </UButton>
                <UButton
                  v-if="isCanceled"
                  color="success"
                  variant="soft"
                  @click="reactivateSubscription"
                >
                  {{ hasActiveUntilExpiry ? 'Resume Subscription' : 'Reactivate' }}
                </UButton>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Methods -->
        <div class="pt-6 border-t border-gray-200">
          <div class="flex items-center mb-4">
            <h3 class="text-base font-medium text-gray-900">Payment Method</h3>
          </div>

          <div v-if="loadingPaymentMethods" class="py-4 flex flex-col items-center justify-center">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin h-6 w-6 text-gray-400 mb-2" />
            <p class="text-xs text-gray-500">Loading payment method...</p>
          </div>

          <div v-else-if="paymentMethods.length === 0" class="py-4 text-center">
            <p class="text-sm text-gray-500">No payment methods found</p>
            <!-- Only show Add Payment Method button if user has a paid subscription -->
            <UButton
              v-if="hasPaidSubscription"
              color="primary"
              variant="soft"
              class="mt-2"
              @click="addPaymentMethod"
            >
              <UIcon name="i-heroicons-plus" class="mr-1 h-4 w-4" />
              {{ hasExistingPaymentMethod ? 'Change Payment Method' : 'Add Payment Method' }}
            </UButton>
          </div>

          <div v-else class="space-y-4">
            <!-- Payment Method Cards -->
            <div
              v-for="method in paymentMethods"
              :key="method.id"
              class="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-300 transition-colors shadow-sm"
            >
              <div class="flex items-center">
                <div class="flex-shrink-0 bg-gray-100 p-2 rounded-lg mr-3">
                  <UIcon name="i-heroicons-credit-card" class="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <div class="flex items-center">
                    <p class="text-sm font-medium text-gray-900">
                      {{ method.brand || 'Card' }} •••• {{ method.last4 }}
                    </p>
                  </div>
                  <p class="text-xs text-gray-500">
                    Expires {{ method.expiryMonth }}/{{ method.expiryYear }}
                  </p>
                </div>
              </div>
              <!-- Change button instead of delete -->
              <UButton
                size="xs"
                color="primary"
                variant="soft"
                class="hover:bg-primary-100 transition-colors"
                type="button"
                @click.prevent="addPaymentMethod"
              >
                <UIcon name="i-heroicons-pencil" class="h-4 w-4 mr-1" />
                Change
              </UButton>
            </div>
          </div>
        </div>

        <!-- Billing History -->
        <div class="pt-6 border-t border-gray-200">
          <h3 class="text-base font-medium text-gray-900 mb-4">Billing History</h3>

          <div v-if="loadingBillingHistory" class="py-8 flex flex-col items-center justify-center">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin h-6 w-6 text-gray-400 mb-2" />
            <p class="text-sm text-gray-500">Loading billing history...</p>
          </div>

          <div v-else-if="billingHistory.length === 0" class="py-8 text-center">
            <p class="text-sm text-gray-500">No billing history found</p>
          </div>

          <div v-else class="overflow-hidden bg-white border border-gray-200 rounded-lg">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Description
                  </th>
                  <th
                    scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Amount
                  </th>
                  <th
                    scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th scope="col" class="relative px-6 py-3">
                    <span class="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="invoice in billingHistory" :key="invoice.id">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ formatDate(invoice.date) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ invoice.description }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₦{{
                      invoice.amount
                        ? invoice.amount.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : '0.00'
                    }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="{
                        'bg-green-100 text-green-800': invoice.status === 'successful',
                        'bg-yellow-100 text-yellow-800': invoice.status === 'pending',
                        'bg-red-100 text-red-800': invoice.status === 'failed',
                      }"
                    >
                      {{ invoice.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      type="button"
                      class="text-primary-600 hover:text-primary-900 flex items-center"
                      @click="viewInvoice(invoice.id)"
                    >
                      <UIcon name="i-heroicons-document-text" class="h-4 w-4 mr-1" />
                      <span>Invoice</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </UCard>
  </div>
  <!-- Cancel Subscription Modal -->
  <DeleteModal
    v-model="showCancelModal"
    title="Cancel Subscription"
    message="Are you sure you want to cancel your subscription? You will still have access until the end of your billing period."
    confirm-text="Cancel Subscription"
    :loading="cancelLoading"
    @confirm="confirmCancelSubscription"
  />

  <!-- Change Plan Modal -->
  <PlanSelectionModal
    v-model="showPlanSelectionModal"
    v-model:selected-plan="selectedPlan"
    title="Change Subscription Plan"
    :default-billing-period="currentBillingPeriod"
    @confirm="confirmPlanChange"
    @close="closePlanSelection"
    @error="handlePlanFetchError"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

// Initialize composables
const {
  currentSubscription,
  changeSubscriptionPlan,
  isLoading: loading,
  error,
} = useSubscriptions()
const { user, isAuthenticated } = useAuth()

// Define loading state for plan changes
const changePlanLoading = ref(false)

// Access toast composable
const toast = useToast()

// Track initial loading to avoid showing success toast on first load
const initialLoad = ref(true)

// Access subscription properties reactively
const currentPlan = computed(() => currentSubscription.value)

// Computed properties for subscription status
const status = computed(() => currentSubscription.value?.status || 'inactive')
const isSubscribed = computed(() => currentSubscription.value?.status === 'active')
const isTrialing = computed(() => currentSubscription.value?.status === 'trialing')
const isCanceled = computed(() => currentSubscription.value?.status === 'cancelled')
const isPastDue = computed(() => currentSubscription.value?.status === 'past_due')

// Plans data (simplified for now - can be moved to a separate composable later)
const plans = ref([])

// Computed properties
const statusClass = computed(() => {
  if (isSubscribed.value && !isCanceled.value) return 'bg-green-100 text-green-800'
  if (isTrialing.value) return 'bg-blue-100 text-blue-800'
  if (isPastDue.value) return 'bg-red-100 text-red-800'
  if (isCanceled.value && status.value.currentPeriodEndsAt) {
    return 'bg-yellow-100 text-yellow-800'
  }
  if (isCanceled.value) return 'bg-gray-100 text-gray-800'
  return 'bg-gray-100 text-gray-800'
})

const hasActiveUntilExpiry = computed(() => {
  if (isCanceled.value && status.value.currentPeriodEndsAt) {
    const expiryDate = new Date(status.value.currentPeriodEndsAt)
    return expiryDate > new Date()
  }
  return false
})

const displayPlanName = computed(() => {
  // Always show the current plan name when canceled, regardless of expiry
  if (isCanceled.value && currentPlan.value) {
    return currentPlan.value.name // Assuming currentPlan.value is not null if isCanceled and currentPlan.value are true
  }
  // If there's no active subscription and no current plan, show No Active Plan
  if (!isSubscribed.value && !currentPlan.value) {
    return 'No Active Plan'
  }
  // Otherwise, show current plan name or fallback to Free Plan
  // Ensure currentPlan.value exists before trying to access its name property
  return currentPlan.value?.name || 'Free Plan'
})

const statusText = computed(() => {
  if (isSubscribed.value && !isCanceled.value) return 'Active'
  if (isTrialing.value) return 'Trial'
  if (isPastDue.value) return 'Past Due'
  if (isCanceled.value && status.value.currentPeriodEndsAt) {
    return `Active until ${formatDate(status.value.currentPeriodEndsAt)}`
  }
  if (isCanceled.value) return 'Canceled' // Fallback if no expiry date
  return 'Inactive'
})

// Determine whether to show the status pill
const showStatusPill = computed(() => {
  // Don't show status pill for inactive subscriptions with no plan
  if (!isSubscribed.value && !isTrialing.value && !isPastDue.value && !currentPlan.value) {
    return false
  }
  // Show status for all other cases
  return true
})

// Determine if the user has a paid subscription (not free/growth plan)
const hasPaidSubscription = computed(() => {
  // Check if user has an active subscription and the plan is paid
  if (isSubscribed.value && currentPlan.value) {
    // Check if the plan price is greater than 0
    return currentPlan.value.price > 0
  }
  return false
})

// Check if the user has any existing payment methods
const hasExistingPaymentMethod = computed(() => {
  // Check if there are any payment methods in the store
  return paymentMethods.value && paymentMethods.value.length > 0
})

// Methods
const refreshSubscription = async () => {
  try {
    console.log('Refreshing subscription data...')

    // Fetch all subscription data using direct API calls
    const [statusData, plansData, billingData, paymentMethodsData] = await Promise.all([
      $fetch<{ success: boolean; data: { active: boolean; planId: number; plan: any } }>(
        '/api/subscriptions/current',
        {
          method: 'GET',
        }
      ),
      $fetch('/api/subscriptions/plans', {
        method: 'GET',
      }),
      $fetch('/api/subscriptions/billing-history', {
        method: 'GET',
      }),
      $fetch('/api/subscriptions/payment-methods', {
        method: 'GET',
      }),
    ])

    // Update the store with the fetched data
    if (statusData?.data) {
      subscriptionStore.setStatus(statusData.data)
      // Set current plan if available
      if (statusData.data.planId) {
        const plan = plansData?.find((p: any) => p.id === statusData.data.planId)
        if (plan) {
          subscriptionStore.setCurrentPlan(plan)
        }
      }
    }

    if (plansData) {
      subscriptionStore.setPlans(plansData)
    }

    if (billingData) {
      subscriptionStore.setBillingHistory(billingData)
    }

    if (paymentMethodsData) {
      subscriptionStore.setPaymentMethods(paymentMethodsData)
    }

    // Only show success toast if we're not in the initial mount
    if (!initialLoad.value) {
      toast.add({
        title: 'Updated',
        description: 'Subscription information updated',
        color: 'primary',
      })
    }
  } catch (err) {
    console.error('Error in refreshSubscription:', err)
    toast.add({
      title: 'Error',
      description: 'Failed to refresh subscription information',
      color: 'error',
    })
  } finally {
    initialLoad.value = false
  }
}

// Payment method management - handles both adding and changing payment methods
const addPaymentMethod = async () => {
  try {
    await $fetch('/api/subscriptions/payment-methods', {
      method: 'POST',
      body: {
        // Pass payment method details from your form
        // Example: token, card details, etc.
      },
      headers: {
        'Content-Type': 'application/json',
      },
    })

    await refreshSubscription()
    toast.add({
      title: 'Success',
      description: 'Payment method updated successfully',
      color: 'primary',
    })
  } catch (error: any) {
    console.error('Error updating payment method:', error)
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to update payment method',
      color: 'error',
    })
  } finally {
    // Reset loading state if needed
  }
}

// Invoice viewing
const viewInvoice = (id: string) => {
  // This would typically open a modal with invoice details or download a PDF
  // For now, we'll just show a toast
  toast.add({
    title: 'Coming Soon',
    description: `Invoice viewing for ID: ${id} will be available soon`,
    color: 'secondary',
  })
}

// Change Plan Modal State
const showPlanSelectionModal = ref(false)
const selectedPlan = ref('')
const currentBillingPeriod = computed(() => {
  // Default to monthly if we can't determine the current billing period
  if (!currentPlan.value || !currentPlan.value.interval) return 'monthly'

  // Map the interval from the subscription store to the expected format
  const interval = currentPlan.value.interval.toLowerCase()
  return interval === 'yearly' || interval === 'year' ? 'annual' : 'monthly'
})

// Handle plan fetch errors
const handlePlanFetchError = (error: { message?: string }) => {
  useToast().add({
    title: 'Error',
    description: error?.message || 'Failed to load plans. Please try again later.',
    color: 'error',
    icon: 'i-heroicons-exclamation-triangle',
  })
}

// Close plan selection modal
const closePlanSelection = () => {
  showPlanSelectionModal.value = false
}

// Handle plan change confirmation
const confirmPlanChange = async (planId: string) => {
  try {
    changePlanLoading.value = true

    await $fetch('/api/subscriptions/change-plan', {
      method: 'POST',
      body: {
        planId,
        // Add any additional parameters required by your API
      },
      headers: {
        'Content-Type': 'application/json',
      },
    })

    await refreshSubscription()
    toast.add({
      title: 'Success',
      description: 'Plan changed successfully',
      color: 'success',
    })
    showPlanSelectionModal.value = false
  } catch (error: any) {
    console.error('Error changing plan:', error)
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to change plan',
      color: 'error',
    })
  } finally {
    changePlanLoading.value = false
  }
}

// Toggle plan selection modal
const showChangePlanDialog = () => {
  // Show the modal - the PlanSelectionModal will handle fetching plans
  showPlanSelectionModal.value = true
}

// Show cancel subscription modal
const showCancelModal = ref(false)
const cancelLoading = ref(false)

const cancelSubscription = () => {
  showCancelModal.value = true
}

// Cancel subscription
const confirmCancelSubscription = async () => {
  try {
    cancelLoading.value = true

    await $fetch('/api/subscriptions/cancel', {
      method: 'POST',
      body: {
        // Add any parameters required by your API
        // For example: immediate: false to cancel at the end of the billing period
      },
      headers: {
        'Content-Type': 'application/json',
      },
    })

    await refreshSubscription()
    toast.add({
      title: 'Subscription Cancelled',
      description: 'Your subscription has been cancelled',
      color: 'success',
    })
    showCancelModal.value = false
  } catch (error: any) {
    console.error('Error cancelling subscription:', error)
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to cancel subscription',
      color: 'error',
    })
  } finally {
    cancelLoading.value = false
  }
}

// Reactivate subscription
const reactivateSubscription = async () => {
  try {
    await $fetch('/api/subscriptions/resume', {
      method: 'POST',
      body: {},
      headers: {
        'Content-Type': 'application/json',
      },
    })

    await refreshSubscription()
    toast.add({
      title: 'Subscription Reactivated',
      description: 'Your subscription has been reactivated',
      color: 'primary',
    })
  } catch (error: any) {
    console.error('Error reactivating subscription:', error)
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to reactivate subscription',
      color: 'error',
    })
  }
}

// Utility functions
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Simplified billing data (TODO: Create useBilling composable)
const billingHistory = ref([])
const paymentMethods = ref([])
const loadingBillingHistory = ref(false)
const loadingPaymentMethods = ref(false)

// Removed billingColumns as we're using a standard HTML table now

// Initialize on component mount
onMounted(async () => {
  try {
    console.log('SettingsBillingForm mounted')
    // Check if user is authenticated first
    if (!isAuthenticated.value) {
      console.warn('User not authenticated, cannot load subscription data')
      toast.add({
        title: 'Authentication Required',
        description: 'Please log in to view your subscription details',
        color: 'warning',
      })
      return
    }

    // Refresh subscription data
    await refreshSubscription()
  } catch (err) {
    console.error('Error initializing billing form:', err)
    toast.add({
      title: 'Error',
      description: `Error loading subscription data: ${err instanceof Error ? err.message : 'Unknown error'}`,
      color: 'error',
    })
  }
})
</script>
