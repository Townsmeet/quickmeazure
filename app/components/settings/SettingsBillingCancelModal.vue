<template>
  <UModal :open="isOpen" @update:open="value => (isOpen = value)">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Cancel Subscription</h3>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-heroicons-x-mark-20-solid"
              class="-my-1"
              @click="isOpen = false"
            />
          </div>
        </template>

        <div class="space-y-4">
          <div
            class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div class="flex">
              <UIcon
                name="i-heroicons-exclamation-triangle"
                class="w-5 h-5 text-red-400 mt-0.5 mr-3"
              />
              <div>
                <h4 class="text-sm font-medium text-red-800 dark:text-red-200">
                  Are you sure you want to cancel?
                </h4>
                <p class="mt-1 text-sm text-red-700 dark:text-red-300">
                  You'll lose access to premium features when your current billing period ends.
                </p>
              </div>
            </div>
          </div>

          <div v-if="subscription" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Current Plan Details
            </h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Plan:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{
                  subscription.plan?.name
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Price:</span>
                <span class="font-medium text-gray-900 dark:text-white">
                  ₦{{ formatPrice(subscription.plan?.price || 0) }}/{{
                    subscription.plan?.interval
                  }}
                </span>
              </div>
              <div v-if="subscription.currentPeriodEndsAt" class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Access until:</span>
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ formatDate(subscription.currentPeriodEndsAt) }}
                </span>
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <h4 class="text-sm font-medium text-gray-900 dark:text-white">Cancellation Options</h4>

            <div class="space-y-2">
              <label class="flex items-start space-x-3 cursor-pointer">
                <input
                  v-model="cancelOption"
                  type="radio"
                  value="end_of_period"
                  class="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
                />
                <div>
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    Cancel at end of billing period
                  </div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">
                    Keep access until
                    {{
                      subscription?.currentPeriodEndsAt
                        ? formatDate(subscription.currentPeriodEndsAt)
                        : 'period ends'
                    }}
                  </div>
                </div>
              </label>

              <label class="flex items-start space-x-3 cursor-pointer">
                <input
                  v-model="cancelOption"
                  type="radio"
                  value="immediate"
                  class="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
                />
                <div>
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    Cancel immediately
                  </div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">
                    Lose access right away (no refund)
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reason for canceling (optional)
            </label>
            <UTextarea
              v-model="cancelReason"
              placeholder="Help us improve by telling us why you're canceling..."
              :rows="3"
            />
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end space-x-3">
            <UButton
color="neutral"
variant="outline"
:disabled="loading"
@click="isOpen = false">
              Keep Subscription
            </UButton>
            <UButton
              color="error"
              :loading="loading"
              :disabled="!cancelOption"
              @click="cancelSubscription"
            >
              {{ cancelOption === 'immediate' ? 'Cancel Now' : 'Schedule Cancellation' }}
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
interface SubscriptionWithPlan {
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
  plan?: {
    id: number
    name: string
    price: number
    interval: string
  } | null
}

interface Props {
  modelValue: boolean
  subscription: SubscriptionWithPlan | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'canceled'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Reactive state
const loading = ref(false)
const cancelOption = ref<'end_of_period' | 'immediate'>('end_of_period')
const cancelReason = ref('')

// Toast for notifications
const toast = useToast()

// Computed
const isOpen = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

// Reset form when modal opens
watch(isOpen, newValue => {
  if (newValue) {
    cancelOption.value = 'end_of_period'
    cancelReason.value = ''
  }
})

// Methods
async function cancelSubscription() {
  if (!props.subscription) return

  loading.value = true

  try {
    const response = (await $fetch('/api/subscriptions/cancel', {
      method: 'POST',
      body: {
        immediate: cancelOption.value === 'immediate',
        reason: cancelReason.value,
      },
    })) as any

    if (response.success) {
      emit('canceled')
      toast.add({
        title: 'Success',
        description:
          cancelOption.value === 'immediate'
            ? 'Subscription canceled immediately'
            : 'Subscription will be canceled at the end of your billing period',
        color: 'success',
      })
    } else {
      throw new Error(response.message || 'Failed to cancel subscription')
    }
  } catch (error) {
    console.error('Error canceling subscription:', error)
    toast.add({
      title: 'Error',
      description: error instanceof Error ? error.message : 'Failed to cancel subscription',
      color: 'error',
    })
  } finally {
    loading.value = false
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
</script>
