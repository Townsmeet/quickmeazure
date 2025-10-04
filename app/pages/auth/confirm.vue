<template>
  <div class="confirm-page-wrapper">
    <div class="flex min-h-screen flex-col items-center justify-center bg-gray-50 space-y-6">
      <!-- Title and Subtitle - Outside Card -->
      <div class="text-center mb-6 w-full max-w-3xl">
        <h2 class="text-2xl md:text-3xl font-bold text-gray-900">Confirm Your Plan</h2>
        <p class="mt-2 text-gray-600">Confirm your subscription plan to continue.</p>
      </div>

      <div class="max-w-3xl w-full space-y-6 bg-white p-4 sm:py-8 rounded-xl shadow">
        <!-- Selected Plan Card -->
        <div v-if="selectedPlan" class="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div class="p-6">
            <div class="flex justify-between items-center">
              <div>
                <h3 class="text-2xl font-bold">
                  {{ selectedPlan.label || 'Free Plan' }}
                </h3>
              </div>
              <div class="text-right">
                <div class="text-xl font-bold">
                  {{ selectedPlan.price || '₦0' }}
                </div>
              </div>
            </div>
            <p class="text-gray-600 mt-1">
              {{ selectedPlan.description || 'Basic features for small businesses' }}
            </p>

            <div class="mt-6">
              <h4 class="font-medium mb-2">Plan Features:</h4>
              <ul class="space-y-2">
                <li
                  v-for="feature in getFormattedFeatures(selectedPlan)"
                  :key="feature.key"
                  class="flex items-center"
                >
                  <UIcon name="i-heroicons-check-circle" class="text-green-500 mr-2" />
                  <span>{{ feature.label }}</span>
                </li>
              </ul>
            </div>

            <!-- Change Plan Button -->
            <div class="mt-6 flex justify-end">
              <UButton
                size="md"
                color="neutral"
                variant="outline"
                icon="i-heroicons-pencil-square"
                aria-label="Change subscription plan"
                class="text-xs sm:text-sm"
                @click="toggleChangePlanModal"
              >
                Change Plan
              </UButton>
            </div>
          </div>
        </div>

        <!-- Continue Button with clear indication -->
        <div class="mt-8 border-t border-gray-200 pt-6">
          <div
            v-if="selectedPlan.numericPrice === 0"
            class="bg-green-50 p-4 rounded-lg mb-4 border border-green-100"
          >
            <div class="flex items-start">
              <UIcon
                name="i-heroicons-check-circle"
                class="text-green-500 mr-2 mt-0.5 flex-shrink-0"
              />
              <div>
                <h4 class="font-medium text-green-800">Free Plan Selected</h4>
                <p class="text-sm text-green-700 mt-1">
                  You've selected the free plan. No payment is required to continue.
                </p>
              </div>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div class="text-sm text-gray-600 order-2 sm:order-1">
              <p>You can change your plan at any time from your account settings.</p>
            </div>

            <div class="order-1 sm:order-2 w-full sm:w-auto">
              <template v-if="selectedPlan.numericPrice > 0">
                <PaystackButton
                  :amount="selectedPlan.numericPrice"
                  :plan-id="String(selectedPlan.id)"
                  :plan-name="selectedPlan.label"
                  :billing-period="billingPeriod as string"
                  size="lg"
                  class="w-full sm:w-auto"
                  @success="onPaymentSuccess"
                  @error="onPaymentError"
                >
                  Make Payment (₦{{ selectedPlan.numericPrice.toLocaleString() }})
                </PaystackButton>
              </template>
              <template v-else>
                <UButton
                  color="primary"
                  :loading="isProcessing"
                  size="lg"
                  class="w-full sm:w-auto"
                  @click="skipPayment"
                >
                  Continue with Free Plan
                </UButton>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Change Plan Modal -->
    <PlanSelectionModal
      v-model="showChangePlanModal"
      v-model:selected-plan="tempSelectedPlan"
      title="Select a Different Plan"
      confirm-button-text="Change Plan"
      :default-billing-period="billingPeriod as string"
      @confirm="changePlan"
      @close="onPlanModalClose"
      @error="handlePlanFetchError"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useToast } from '#imports'
import { monthlyPlans, annualPlans } from '~/data/subscription-plans'
import { useAppRoutes } from '~/composables/useRoutes'
import { usePaystack } from '~/composables/usePaystack'
import { useAuthStore } from '~/store/modules/auth'
import { useSubscriptionStore } from '~/store/modules/subscription'
import PlanSelectionModal from '~/components/plans/PlanSelectionModal.vue'

// Composables and stores
const routes = useAppRoutes()
const toast = useToast()
const router = useRouter()
const route = useRoute()
const { processPayment } = usePaystack()
const subscriptionStore = useSubscriptionStore()

// Constants
const DASHBOARD_PATH = routes.ROUTE_PATHS[routes.ROUTE_NAMES.DASHBOARD.INDEX] as string
const SETUP_MEASUREMENTS_PATH = '/auth/setup-measurements'

// Set page metadata
useHead({
  title: 'Confirm Plan',
})

// Set layout for this page
definePageMeta({
  layout: 'auth',
  middleware: 'subscription',
})

// Reactive state
const planType = ref(
  Array.isArray(route.query.plan) ? route.query.plan[0] : route.query.plan || 'growth'
)
const billingPeriod = ref(
  Array.isArray(route.query.billing) ? route.query.billing[0] : route.query.billing || 'monthly'
)
const isProcessing = ref(false)
const showChangePlanModal = ref(false)
const tempSelectedPlan = ref('')

// Subscription plans computed property
const subscriptionPlans = computed(() => {
  const plansData = billingPeriod.value === 'annual' ? annualPlans : monthlyPlans
  const periodLabel = billingPeriod.value === 'annual' ? 'year' : 'month'

  return plansData.map(plan => ({
    id: plan.id,
    value: plan.name.toLowerCase(),
    label: plan.name,
    description: plan.description,
    price: `₦${plan.price.toLocaleString()}/${periodLabel}`,
    numericPrice: plan.price,
    features: plan.features,
    maxClients: plan.maxClients,
    interval: plan.interval,
  }))
})

// Selected plan computed property
const selectedPlan = computed(() => {
  return (
    subscriptionPlans.value.find(plan => plan.value === planType.value) ||
    subscriptionPlans.value[0]
  )
})

// Feature formatting function
const getFormattedFeatures = (plan: any) => {
  if (!plan || !plan.features) {
    return [{ key: 'basic', label: 'Basic plan features' }]
  }

  const featureLabels: Record<string, string> = {
    clients: `Manage up to ${plan.maxClients === -1 ? 'unlimited' : plan.maxClients} clients`,
    styles: 'Create and manage clothing styles',
    orders: 'Track customer orders and measurements',
    team: 'Team collaboration features',
    analytics: 'Advanced analytics and reporting',
    support: 'Priority customer support',
    storage: 'Cloud storage for designs and photos',
  }

  const features = []

  // Add client limit as first feature
  if (plan.maxClients !== undefined) {
    features.push({
      key: 'clients',
      label: `Manage up to ${plan.maxClients === -1 ? 'unlimited' : plan.maxClients} clients`,
    })
  }

  // Add other features based on what's enabled
  for (const [featureKey, featureValue] of Object.entries(plan.features)) {
    if (featureValue && featureKey !== 'clients') {
      features.push({
        key: featureKey,
        label:
          featureLabels[featureKey] || featureKey.charAt(0).toUpperCase() + featureKey.slice(1),
      })
    }
  }

  return features.length > 0 ? features : [{ key: 'basic', label: 'Basic plan features' }]
}

// Initialize tempSelectedPlan
watch(
  selectedPlan,
  newPlan => {
    if (newPlan && !tempSelectedPlan.value) {
      tempSelectedPlan.value = newPlan.value
    }
  },
  { immediate: true }
)

// Utility functions
const showToast = (
  type: 'success' | 'error' | 'info',
  title: string,
  description: string,
  icon?: string
) => {
  const iconMap = {
    success: 'i-heroicons-check-circle',
    error: 'i-heroicons-x-circle',
    info: 'i-heroicons-information-circle',
  }

  toast.add({
    title,
    description,
    color: type === 'success' ? 'success' : type === 'error' ? 'error' : 'info',
    icon: icon || iconMap[type],
  })
}

const handleError = (error: unknown, defaultMessage: string) => {
  const errorMessage =
    (error as any)?.response?.data?.message || (error as Error)?.message || defaultMessage

  showToast('error', 'Error', errorMessage)
}

const createSubscription = async () => {
  const subscriptionData = {
    planId: selectedPlan.value.id,
    planName: selectedPlan.value.label,
    billingPeriod: billingPeriod.value,
    ...(selectedPlan.value.numericPrice > 0 && { amount: selectedPlan.value.numericPrice }),
  }

  return await $fetch('/api/subscriptions/create', {
    method: 'POST',
    body: subscriptionData,
  })
}

// Main payment processing function
const skipPayment = async () => {
  if (selectedPlan.value?.numericPrice > 0) {
    await processPaystackPayment()
    return
  }

  // Handle free plan
  isProcessing.value = true

  try {
    await createSubscription()

    showToast('success', 'Plan Selected', `You have selected the ${selectedPlan.value.label} plan!`)
    await navigateTo(SETUP_MEASUREMENTS_PATH)
  } catch (error) {
    handleError(error, 'Failed to set up your subscription. Please try again.')
  } finally {
    isProcessing.value = false
  }
}

// Payment event handlers
const onPaymentSuccess = async (_response: any) => {
  showToast('success', 'Payment successful!', 'Redirecting to next step...')
  await router.push(DASHBOARD_PATH)
}

const onPaymentError = (_error: unknown) => {
  showToast('error', 'Payment failed.', 'Please try again.')
  isProcessing.value = false
}

// Process payment with Paystack
const processPaystackPayment = async () => {
  isProcessing.value = true

  try {
    // Create subscription first
    await createSubscription()

    // Process payment
    const paymentData = {
      amount: selectedPlan.value.numericPrice,
      planId: selectedPlan.value.id.toString(),
      planName: selectedPlan.value.label,
      billingPeriod: (billingPeriod.value || 'monthly').toString(),
    }

    await processPayment(paymentData)

    showToast('success', 'Payment successful!', 'Redirecting to next step...')
    await router.push(SETUP_MEASUREMENTS_PATH)
  } catch (error) {
    handleError(error, 'Payment failed. Please try again or contact support.')

    // Provide recovery options
    showToast('info', 'Try Again', 'You can try again or select a different plan.')
  } finally {
    isProcessing.value = false
  }
}

// Modal management
const toggleChangePlanModal = () => {
  showChangePlanModal.value = !showChangePlanModal.value
}

const onPlanModalClose = () => {
  showChangePlanModal.value = false
}

const updateUrlQuery = (newPlan: string, newBilling: string) => {
  const query = {
    ...route.query,
    plan: newPlan,
    billing: newBilling,
  }

  navigateTo(
    {
      path: route.path,
      query,
    },
    { replace: true }
  )
}

const changePlan = () => {
  if (!tempSelectedPlan.value) return

  // Update plan type - keep the current billing period
  planType.value = tempSelectedPlan.value

  // Update URL query parameters
  updateUrlQuery(planType.value || 'growth', billingPeriod.value || 'monthly')

  // Get the updated selected plan
  const newPlan = subscriptionPlans.value.find(p => p.value === tempSelectedPlan.value)
  const planLabel = newPlan ? newPlan.label : tempSelectedPlan.value

  // Close modal and show confirmation
  showChangePlanModal.value = false
  showToast('success', 'Plan Changed', `You've selected the ${planLabel} plan.`)
}

// Handle plan fetch errors
const handlePlanFetchError = (error: any) => {
  handleError(error, 'Failed to load plans. Please try again later.')
}

// Initialize tempSelectedPlan when modal opens
watch(showChangePlanModal, newVal => {
  if (newVal) {
    tempSelectedPlan.value = selectedPlan.value?.value || 'growth'
  }
})
</script>
