<template>
  <UModal :open="isOpen" :ui="{ content: 'max-w-7xl' }" @update:open="value => (isOpen = value)">
    <template #content>
      <UCard
        :ui="{
          body: 'flex-1 overflow-y-auto max-h-[calc(100vh-8rem)]',
          header: 'sticky top-0 z-10 bg-white dark:bg-gray-900',
          footer: 'sticky bottom-0 z-10 bg-white dark:bg-gray-900',
        }"
        class="flex flex-col max-h-[calc(100vh-4rem)]"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ currentPlan?.name === 'Free' ? 'Choose Your Plan' : 'Change Plan' }}
            </h3>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-heroicons-x-mark-20-solid"
              class="-my-1"
              @click="isOpen = false"
            />
          </div>
        </template>

        <div class="space-y-6">
          <!-- Billing Period Toggle -->
          <div class="flex justify-center items-center gap-4">
            <span
              :class="{
                'font-semibold text-gray-900 dark:text-white': billingPeriod === 'month',
                'text-gray-500 dark:text-gray-400': billingPeriod === 'annual',
              }"
            >
              Monthly
            </span>
            <USwitch
              :model-value="billingPeriod === 'annual'"
              size="lg"
              @update:model-value="billingPeriod = $event ? 'annual' : 'month'"
            />
            <span
              :class="{
                'font-semibold text-gray-900 dark:text-white': billingPeriod === 'annual',
                'text-gray-500 dark:text-gray-400': billingPeriod === 'month',
              }"
            >
              Annual
            </span>
            <UBadge
v-if="billingPeriod === 'annual'"
color="primary"
variant="subtle"
class="ml-2">
              Save {{ getSavingsPercentage() }}%
            </UBadge>
          </div>

          <!-- Pricing Plans -->
          <UPricingPlans scale>
            <UPricingPlan
              v-for="plan in displayedPlans"
              :key="plan.id"
              :title="plan.name"
              :description="plan.description"
              :price="formatPrice(plan.price)"
              :billing-cycle="formatBillingCycle(plan.interval)"
              :badge="
                plan.isPopular ? 'Most Popular' : isCurrentPlan(plan) ? 'Current Plan' : undefined
              "
              :features="plan.features"
              :button="getButtonProps(plan)"
              :scale="plan.isPopular"
              :highlight="selectedPlanId === plan.id"
            />
          </UPricingPlans>
        </div>

        <template #footer>
          <div class="flex justify-end space-x-3">
            <UButton
              color="neutral"
              variant="outline"
              :disabled="upgradeLoading"
              @click="isOpen = false"
            >
              Cancel
            </UButton>
            <UButton
              color="primary"
              :loading="upgradeLoading"
              :disabled="!selectedPlanId || !selectedPlan || isCurrentPlan(selectedPlan)"
              @click="upgradePlan"
            >
              {{ selectedPlan?.price === 0 ? 'Downgrade to Free' : 'Upgrade Plan' }}
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import {
  getPlans,
  formatPrice,
  formatBillingCycle,
  getSavingsPercentage,
  type Plan as SubscriptionPlan,
} from '~/data/subscription-plans'
import type { Plan as ApiPlan } from '~/types/subscription'

interface Props {
  modelValue: boolean
  currentPlan?: ApiPlan | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'upgraded'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Reactive state
const selectedPlanId = ref<string>('')
const billingPeriod = ref<'month' | 'annual'>('month')
const upgradeLoading = ref(false)

// Toast for notifications
const toast = useToast()

// Paystack composable
const { processPayment } = usePaystack()

// Computed
const isOpen = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

// Get plans from the same source as home page
const displayedPlans = computed(() => {
  return getPlans(billingPeriod.value)
})

// Get selected plan data
const selectedPlan = computed(() => {
  if (!selectedPlanId.value) return null
  return displayedPlans.value.find(p => p.id === selectedPlanId.value) || null
})

// Helper to match API plan to subscription plan ID
function getCurrentPlanId(): string | null {
  if (!props.currentPlan) return null

  // Map API plan name to subscription plan ID
  const planNameMap: Record<string, string> = {
    Free: 'free',
    Standard: 'standard',
    Premium: 'premium',
  }

  return planNameMap[props.currentPlan.name] || props.currentPlan.name.toLowerCase()
}

// Check if a plan is the current plan
function isCurrentPlan(plan: SubscriptionPlan): boolean {
  if (!props.currentPlan) return false

  const planNameMap: Record<string, string> = {
    Free: 'free',
    Standard: 'standard',
    Premium: 'premium',
  }

  const planId = planNameMap[props.currentPlan.name] || props.currentPlan.name.toLowerCase()
  const interval = props.currentPlan.interval === 'annual' ? 'annual' : 'month'

  return plan.id === planId && plan.interval === interval
}

// Get button props for each plan
const getButtonProps = (plan: SubscriptionPlan) => {
  const isSelected = selectedPlanId.value === plan.id
  const isCurrent = isCurrentPlan(plan)

  return {
    label: isCurrent ? 'Current Plan' : isSelected ? 'Selected' : `Choose ${plan.name}`,
    variant: isSelected || isCurrent ? ('solid' as const) : ('outline' as const),
    color: isSelected || isCurrent ? ('primary' as const) : ('neutral' as const),
    block: true,
    size: 'lg' as const,
    onClick: () => selectPlan(plan.id),
    disabled: isCurrent,
  }
}

// Select plan function
function selectPlan(planId: string) {
  const plan = displayedPlans.value.find(p => p.id === planId)
  if (plan && !isCurrentPlan(plan)) {
    selectedPlanId.value = planId
  }
}

// Initialize selected plan when modal opens
watch(isOpen, newValue => {
  if (newValue) {
    // Set billing period based on current plan if available
    if (props.currentPlan) {
      const interval = props.currentPlan.interval === 'annual' ? 'annual' : 'month'
      billingPeriod.value = interval

      // Set current plan ID
      const currentPlanId = getCurrentPlanId()
      if (currentPlanId) {
        selectedPlanId.value = currentPlanId
      }
    } else {
      selectedPlanId.value = ''
    }
  }
})

// Update selected plan when billing period changes if current plan is selected
watch(billingPeriod, () => {
  const currentPlanId = getCurrentPlanId()
  if (currentPlanId && selectedPlanId.value === currentPlanId) {
    const planExists = displayedPlans.value.some(p => p.id === currentPlanId)
    if (planExists) {
      selectedPlanId.value = currentPlanId
    } else {
      selectedPlanId.value = ''
    }
  }
})

async function upgradePlan() {
  if (!selectedPlan.value) return

  // Check if the plan is free (no payment required)
  if (selectedPlan.value.price === 0) {
    // For free plan, upgrade directly without payment
    upgradeLoading.value = true
    try {
      const response = await $fetch<{ success: boolean; message?: string }>(
        '/api/subscriptions/change-plan',
        {
          method: 'POST',
          body: {
            planId: selectedPlan.value.id, // should be 'free'
            billingInterval: 'month',
          },
        }
      )
      if (response.success) {
        emit('upgraded')
        toast.add({
          title: 'Success',
          description: 'Plan updated successfully',
          color: 'success',
        })
        isOpen.value = false
      } else {
        throw new Error(response.message || 'Failed to update plan')
      }
    } catch (error) {
      console.error('Error upgrading plan:', error)
      toast.add({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update plan',
        color: 'error',
      })
    } finally {
      upgradeLoading.value = false
    }
    return
  }

  // For paid plans, process payment through Paystack first
  upgradeLoading.value = true

  try {
    // Convert billing period to API format
    const apiInterval = billingPeriod.value

    // Close the modal before opening Paystack to avoid z-index conflicts
    // The modal overlay can block the Paystack iframe
    const wasModalOpen = isOpen.value
    isOpen.value = false

    // Small delay to ensure modal is fully closed before opening Paystack
    await new Promise(resolve => setTimeout(resolve, 300))

    // Use Paystack payment - the plan slug (id) is used for payment verification
    // The payment verification endpoint will automatically update the subscription
    processPayment({
      amount: selectedPlan.value.price,
      planId: selectedPlan.value.id, // Use the slug (free, standard, premium)
      planName: selectedPlan.value.name,
      billingPeriod: apiInterval,
      onSuccess: () => {
        upgradeLoading.value = false
        emit('upgraded')
        toast.add({
          title: 'Payment Successful',
          description: 'Your plan has been upgraded successfully!',
          color: 'success',
        })
        // Modal is already closed, no need to close again
      },
      onError: error => {
        upgradeLoading.value = false
        console.error('Payment error:', error)
        toast.add({
          title: 'Payment Failed',
          description:
            error instanceof Error
              ? error.message
              : 'The payment was not successful. Please try again.',
          color: 'error',
        })
        // Reopen the modal if payment failed
        if (wasModalOpen) {
          setTimeout(() => {
            isOpen.value = true
          }, 500)
        }
      },
      onClose: () => {
        upgradeLoading.value = false
        // Reopen the modal if user closed the payment window
        if (wasModalOpen) {
          setTimeout(() => {
            isOpen.value = true
          }, 500)
        }
      },
    })
  } catch (error) {
    console.error('Error initiating payment:', error)
    upgradeLoading.value = false
    toast.add({
      title: 'Error',
      description: error instanceof Error ? error.message : 'Failed to initiate payment',
      color: 'error',
    })
    // Reopen the modal if there was an error
    setTimeout(() => {
      isOpen.value = true
    }, 500)
  }
}
</script>
