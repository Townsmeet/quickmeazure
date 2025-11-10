<template>
  <div class="space-y-8">
    <!-- Current Subscription Section -->
    <div
      class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
    >
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Current Subscription</h3>
        <UBadge
          :color="subscriptionStatusColor"
          :label="subscription?.plan?.name || 'Free'"
          size="lg"
        />
      </div>

      <div v-if="subscription" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Plan</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ subscription.plan?.name }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Price</p>
            <p class="font-medium text-gray-900 dark:text-white">
              ₦{{ formatPrice(subscription.plan?.price || 0) }}/{{ subscription.plan?.interval }}
            </p>
          </div>
          <div v-if="subscription.currentPeriodEndsAt">
            <p class="text-sm text-gray-500 dark:text-gray-400">Next Billing</p>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ formatDate(subscription.currentPeriodEndsAt) }}
            </p>
          </div>
        </div>

        <div v-if="subscription.plan?.description" class="mt-4">
          <p class="text-sm text-gray-600 dark:text-gray-300">
            {{ subscription.plan.description }}
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap gap-3 mt-6">
          <UButton
            v-if="!subscription.canceledAt && subscription.plan?.name !== 'Free'"
            color="error"
            variant="outline"
            @click="showCancelModal = true"
          >
            Cancel Subscription
          </UButton>

          <UButton color="primary" @click="showUpgradeModal = true">
            {{ subscription.plan?.name === 'Free' ? 'Upgrade Plan' : 'Change Plan' }}
          </UButton>
        </div>
      </div>

      <div v-else class="text-center py-8">
        <UIcon name="i-heroicons-credit-card" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p class="text-gray-500 dark:text-gray-400 mb-4">No active subscription found</p>
        <UButton color="primary" @click="showUpgradeModal = true"> Choose a Plan </UButton>
      </div>
    </div>

    <!-- Payment Methods Section -->
    <div
      class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
    >
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Payment Methods</h3>
        <UButton
color="primary"
variant="outline"
size="sm"
@click="showAddPaymentModal = true">
          Add Payment Method
        </UButton>
      </div>

      <div v-if="paymentMethods.length > 0" class="space-y-3">
        <div
          v-for="method in paymentMethods"
          :key="method.id"
          class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
        >
          <div class="flex items-center space-x-3">
            <UIcon :name="getPaymentMethodIcon(method.type)" class="w-6 h-6 text-gray-500" />
            <div>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ method.brand?.toUpperCase() || method.type.toUpperCase() }}
                ending in {{ method.last4 }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Expires {{ method.expiryMonth }}/{{ method.expiryYear }}
              </p>
            </div>
            <UBadge
v-if="method.isDefault"
color="success"
label="Default"
size="sm" />
          </div>

          <div class="flex items-center space-x-2">
            <UButton
              v-if="!method.isDefault"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="setDefaultPaymentMethod(method.id)"
            >
              Set Default
            </UButton>
            <UButton
              color="error"
              variant="ghost"
              size="sm"
              @click="removePaymentMethod(method.id)"
            >
              Remove
            </UButton>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-8">
        <UIcon name="i-heroicons-credit-card" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p class="text-gray-500 dark:text-gray-400 mb-4">No payment methods added</p>
        <UButton color="primary" variant="outline" @click="showAddPaymentModal = true">
          Add Your First Payment Method
        </UButton>
      </div>
    </div>

    <!-- Billing History Section -->
    <div
      class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
    >
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Billing History</h3>
        <UButton
          color="neutral"
          variant="outline"
          size="sm"
          :loading="billingHistoryLoading"
          @click="refreshBillingHistory"
        >
          Refresh
        </UButton>
      </div>

      <div v-if="billingHistory.length > 0" class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Date
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Description
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Amount
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="payment in billingHistory" :key="payment.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ formatDate(payment.date) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ payment.description }}
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white"
              >
                ₦{{ formatPrice(payment.amount) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <UBadge
                  :color="getPaymentStatusColor(payment.status)"
                  :label="payment.status"
                  size="sm"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <UButton
                  v-if="payment.reference"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  @click="downloadInvoice(payment)"
                >
                  Download
                </UButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="text-center py-8">
        <UIcon name="i-heroicons-document-text" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p class="text-gray-500 dark:text-gray-400">No billing history found</p>
      </div>
    </div>

    <!-- Modals -->
    <SettingsBillingCancelModal
      v-model="showCancelModal"
      :subscription="subscription"
      @canceled="handleSubscriptionCanceled"
    />

    <SettingsBillingUpgradeModal
      v-model="showUpgradeModal"
      :current-plan="subscription?.plan"
      @upgraded="handlePlanUpgraded"
    />

    <SettingsBillingPaymentMethodModal
      v-model="showAddPaymentModal"
      @added="handlePaymentMethodAdded"
    />
  </div>
</template>

<script setup lang="ts">
import type { PaymentExtended } from '~/composables/useBilling'

// Use billing composable
const {
  subscription,
  paymentMethods,
  billingHistory,
  error: billingError,
  isLoadingSubscription,
  isLoadingPaymentMethods,
  isLoadingBillingHistory,
  fetchCurrentSubscription,
  fetchPaymentMethods,
  fetchBillingHistory,
  setDefaultPaymentMethod: setDefaultPaymentMethodAPI,
  removePaymentMethod: removePaymentMethodAPI,
  downloadInvoice: downloadInvoiceAPI,
  refreshAll,
} = useBilling()

// Loading state
const loading = ref(true)

// Modal states
const showCancelModal = ref(false)
const showUpgradeModal = ref(false)
const showAddPaymentModal = ref(false)

// Toast for notifications
const toast = useToast()

// Computed properties
const subscriptionStatusColor = computed(() => {
  if (!subscription.value) return 'neutral'

  switch (subscription.value.plan?.name) {
    case 'Free':
      return 'neutral'
    case 'Premium':
      return 'success'
    case 'Pro':
      return 'info'
    default:
      return 'primary'
  }
})

// Computed for billing history loading
const billingHistoryLoading = computed(() => isLoadingBillingHistory.value)

// Fetch data on component mount
onMounted(async () => {
  try {
    await refreshAll()
  } catch (error) {
    console.error('Error loading billing data:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to load billing information',
      color: 'error',
    })
  } finally {
    loading.value = false
  }
})

// Event handlers
async function handleSubscriptionCanceled() {
  showCancelModal.value = false
  try {
    await fetchCurrentSubscription()
    toast.add({
      title: 'Success',
      description: 'Subscription canceled successfully',
      color: 'success',
    })
  } catch (error) {
    toast.add({
      title: 'Error',
      description: billingError.value || 'Failed to update subscription',
      color: 'error',
    })
  }
}

async function handlePlanUpgraded() {
  showUpgradeModal.value = false
  try {
    await Promise.all([fetchCurrentSubscription(), fetchBillingHistory()])
    toast.add({
      title: 'Success',
      description: 'Plan updated successfully',
      color: 'success',
    })
  } catch (error) {
    toast.add({
      title: 'Error',
      description: billingError.value || 'Failed to update plan',
      color: 'error',
    })
  }
}

async function handlePaymentMethodAdded() {
  showAddPaymentModal.value = false
  try {
    await fetchPaymentMethods()
    toast.add({
      title: 'Success',
      description: 'Payment method added successfully',
      color: 'success',
    })
  } catch (error) {
    toast.add({
      title: 'Error',
      description: billingError.value || 'Failed to refresh payment methods',
      color: 'error',
    })
  }
}

async function setDefaultPaymentMethod(methodId: number) {
  try {
    const success = await setDefaultPaymentMethodAPI(methodId)
    if (success) {
      toast.add({
        title: 'Success',
        description: 'Default payment method updated',
        color: 'success',
      })
    } else {
      throw new Error(billingError.value || 'Failed to update default payment method')
    }
  } catch (error) {
    toast.add({
      title: 'Error',
      description: billingError.value || 'Failed to update default payment method',
      color: 'error',
    })
  }
}

async function removePaymentMethod(methodId: number) {
  try {
    const success = await removePaymentMethodAPI(methodId)
    if (success) {
      toast.add({
        title: 'Success',
        description: 'Payment method removed',
        color: 'success',
      })
    } else {
      throw new Error(billingError.value || 'Failed to remove payment method')
    }
  } catch (error) {
    toast.add({
      title: 'Error',
      description: billingError.value || 'Failed to remove payment method',
      color: 'error',
    })
  }
}

async function refreshBillingHistory() {
  try {
    await fetchBillingHistory()
  } catch (error) {
    toast.add({
      title: 'Error',
      description: billingError.value || 'Failed to refresh billing history',
      color: 'error',
    })
  }
}

async function downloadInvoice(payment: PaymentExtended) {
  try {
    const success = await downloadInvoiceAPI(payment.id)
    if (success) {
      toast.add({
        title: 'Success',
        description: 'Invoice downloaded',
        color: 'success',
      })
    } else {
      throw new Error(billingError.value || 'Failed to download invoice')
    }
  } catch (error) {
    toast.add({
      title: 'Error',
      description: billingError.value || 'Failed to download invoice',
      color: 'error',
    })
  }
}

// Utility functions
function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

function formatFeature(key: string, value: any): string {
  if (typeof value === 'boolean') {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
  }
  if (typeof value === 'number') {
    return `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${value}`
  }
  return `${key}: ${value}`
}

function getPaymentMethodIcon(type: string): string {
  switch (type.toLowerCase()) {
    case 'card':
      return 'i-heroicons-credit-card'
    case 'bank':
      return 'i-heroicons-building-library'
    case 'mobile_money':
      return 'i-heroicons-device-phone-mobile'
    default:
      return 'i-heroicons-credit-card'
  }
}

function getPaymentStatusColor(status: string): 'success' | 'error' | 'warning' | 'neutral' {
  switch (status.toLowerCase()) {
    case 'successful':
      return 'success'
    case 'failed':
      return 'error'
    case 'pending':
      return 'warning'
    default:
      return 'neutral'
  }
}
</script>
