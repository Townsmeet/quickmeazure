<template>
  <UModal :open="isOpen" :ui="{ content: 'max-w-7xl' }" @update:open="value => (isOpen = value)">
    <template #content>
      <UCard>
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
                'font-semibold text-gray-900 dark:text-white': billingPeriod === 'monthly',
                'text-gray-500 dark:text-gray-400': billingPeriod === 'annually',
              }"
            >
              Monthly
            </span>
            <USwitch
              :model-value="billingPeriod === 'annually'"
              size="lg"
              @update:model-value="billingPeriod = $event ? 'annually' : 'monthly'"
            />
            <span
              :class="{
                'font-semibold text-gray-900 dark:text-white': billingPeriod === 'annually',
                'text-gray-500 dark:text-gray-400': billingPeriod === 'monthly',
              }"
            >
              Annual
            </span>
            <UBadge
              v-if="billingPeriod === 'annually'"
              color="primary"
              variant="subtle"
              class="ml-2"
            >
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
const billingPeriod = ref<'monthly' | 'annually'>('monthly')
const upgradeLoading = ref(false)

// Toast for notifications
const toast = useToast()

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
  const interval = props.currentPlan.interval === 'annual' ? 'annually' : 'monthly'

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
      const interval = props.currentPlan.interval === 'annual' ? 'annually' : 'monthly'
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
    // Keep the current plan selected if it exists in the new billing period
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

  upgradeLoading.value = true

  try {
    // Fetch the plan list from the server
    const plansResponse = await $fetch('/api/subscriptions/plans')
    if (!plansResponse.success || !plansResponse.data) {
      throw new Error('Could not fetch subscription plans.')
    }
    // Map client static id to name for matching
    const staticToNameMap = {
      free: 'Free',
      standard: 'Standard',
      premium: 'Premium',
    }
    const selectedPlanName = staticToNameMap[selectedPlan.value.id] || selectedPlan.value.name
    const apiInterval = billingPeriod.value === 'annually' ? 'annual' : 'monthly'
    // Find the matching plan from the server (by name and interval)
    const numericPlan = plansResponse.data.find(
      p =>
        p.name?.toLowerCase() === selectedPlanName.toLowerCase() &&
        (p.interval === apiInterval || (p.interval === 'year' && apiInterval === 'annual'))
    )
    if (!numericPlan) {
      toast.add({
        title: 'Error',
        description: 'Unable to find a matching subscription plan on the server.',
        color: 'error',
      })
      upgradeLoading.value = false
      return
    }

    // Send only the numeric id
    const planIdToSend = numericPlan.id

    const response = await $fetch('/api/subscriptions/change-plan', {
      method: 'POST',
      body: {
        planId: planIdToSend,
        billingInterval: apiInterval,
      },
    })

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
}
</script>
