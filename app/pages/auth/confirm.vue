<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12">
    <!-- Header -->
    <div class="text-center mb-12 w-full max-w-4xl px-4">
      <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Choose your plan</h1>
      <p class="text-lg text-gray-600">
        Select the perfect plan to start your tailoring business journey
        {{
          billingInterval === 'annually'
            ? ` Save ${getSavingsPercentage()}% with annual billing.`
            : ''
        }}
      </p>
    </div>

    <!-- Pricing Plans -->
    <div class="w-full max-w-6xl px-4">
      <!-- Billing Toggle -->
      <div class="flex justify-center items-center gap-4 mb-12">
        <span
          :class="{
            'font-semibold text-gray-900': billingInterval === 'monthly',
            'text-gray-500': billingInterval === 'annually',
          }"
        >
          Monthly
        </span>
        <USwitch
          :model-value="billingInterval === 'annually'"
          size="lg"
          @update:model-value="toggleBilling"
        />
        <span
          :class="{
            'font-semibold text-gray-900': billingInterval === 'annually',
            'text-gray-500': billingInterval === 'monthly',
          }"
        >
          Annual
        </span>
        <UBadge
v-if="billingInterval === 'annually'"
color="primary"
variant="subtle"
class="ml-2">
          Save {{ getSavingsPercentage() }}%
        </UBadge>
      </div>

      <UPricingPlans scale class="mb-12">
        <UPricingPlan
          v-for="plan in displayedPlans"
          :key="plan.id"
          :title="plan.name"
          :description="plan.description"
          :price="formatPrice(plan.price)"
          :billing-cycle="formatBillingCycle(plan.interval)"
          :billing-period="formatBillingPeriod(plan.interval)"
          :badge="plan.isPopular ? 'Most Popular' : undefined"
          :features="plan.features"
          :button="getButtonProps(plan)"
          :scale="plan.isPopular"
          :highlight="selectedPlan === plan.id"
          :variant="selectedPlan === plan.id ? 'outline' : undefined"
        />
      </UPricingPlans>

      <!-- Continue Button -->
      <div class="text-center">
        <UButton
          v-if="selectedPlan === 'free'"
          size="xl"
          color="primary"
          :loading="isProcessing"
          class="px-12 py-4 text-lg font-semibold"
          @click="createFreeSubscription"
        >
          Continue with Free Plan
        </UButton>

        <PaystackButton
          v-else-if="selectedPlan && selectedPlanData"
          :amount="selectedPlanData.price"
          :plan-id="selectedPlanData.id"
          :plan-name="selectedPlanData.name"
          :billing-period="billingInterval"
          size="xl"
          class="px-12 py-4 text-lg font-semibold"
          @success="handlePaymentSuccess"
          @error="handlePaymentError"
        >
          Continue & Pay {{ formatPrice(selectedPlanData.price) }}
        </PaystackButton>

        <UButton
v-else
size="xl"
color="neutral"
disabled
class="px-12 py-4 text-lg font-semibold">
          Select a Plan
        </UButton>

        <p class="mt-4 text-sm text-gray-500">
          {{ selectedPlan === 'free' ? 'No payment required' : 'You can cancel anytime' }}
        </p>
      </div>

      <!-- Back Link -->
      <div class="mt-8 text-center">
        <NuxtLink to="/auth/login" class="text-sm text-gray-600 hover:text-gray-800">
          ← Back to sign in
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  getPlans,
  getPlanById,
  formatPrice,
  formatBillingCycle,
  formatBillingPeriod,
  getSavingsPercentage,
  type Plan,
} from '~/data/subscription-plans'

definePageMeta({
  layout: 'auth',
})

const route = useRoute()
const toast = useToast()

// State
const selectedPlan = ref<string>('')
const isProcessing = ref(false)
const billingInterval = ref<'monthly' | 'annually'>('monthly')

// Get plans based on billing interval
const displayedPlans = computed(() => {
  return getPlans(billingInterval.value)
})

// Get selected plan data
const selectedPlanData = computed(() => {
  if (!selectedPlan.value) return null
  return getPlanById(selectedPlan.value, billingInterval.value)
})

// Get button props for each plan
const getButtonProps = (plan: Plan) => {
  const isSelected = selectedPlan.value === plan.id

  return {
    label: isSelected ? 'Selected' : `Choose ${plan.name}`,
    variant: isSelected ? ('solid' as const) : ('outline' as const),
    color: isSelected ? ('primary' as const) : ('neutral' as const),
    block: true,
    size: 'lg' as const,
    onClick: () => selectPlan(plan.id),
  }
}

// Toggle billing interval
const toggleBilling = (isAnnual: boolean) => {
  billingInterval.value = isAnnual ? 'annually' : 'monthly'
}

// Get pre-selected plan from query params (from home page)
onMounted(() => {
  const planFromQuery = route.query.plan as string
  const billingFromQuery = route.query.billing as string

  // Set billing interval
  if (billingFromQuery === 'annually') {
    billingInterval.value = 'annually'
  }

  // Set selected plan
  if (planFromQuery && ['free', 'standard', 'premium'].includes(planFromQuery)) {
    selectedPlan.value = planFromQuery
  } else {
    // Default to standard (most popular)
    selectedPlan.value = 'standard'
  }
})

// Select plan function
const selectPlan = (planId: string) => {
  selectedPlan.value = planId
}

// Create free subscription
const createFreeSubscription = async () => {
  if (!selectedPlanData.value) return

  isProcessing.value = true
  const { createSubscription } = useSubscriptions()

  try {
    const result = await createSubscription({
      planId: selectedPlanData.value.id,
      planName: selectedPlanData.value.name,
      billingPeriod: billingInterval.value,
      amount: 0,
    })

    if (result.success) {
      toast.add({
        title: 'Welcome to QuickMeazure!',
        description: "Let's set up your measurement templates.",
        color: 'success',
      })

      await navigateTo('/auth/setup-measurements')
    } else {
      throw new Error(result.message || 'Failed to create subscription')
    }
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to create subscription. Please try again.',
      color: 'error',
    })
  } finally {
    isProcessing.value = false
  }
}

// Handle successful payment
const handlePaymentSuccess = async () => {
  toast.add({
    title: 'Payment Successful!',
    description: `Welcome to QuickMeazure ${selectedPlanData.value?.name} plan!`,
    color: 'success',
  })

  await navigateTo('/auth/setup-measurements')
}

// Handle payment error
const handlePaymentError = (error: any) => {
  toast.add({
    title: 'Payment Failed',
    description: error?.message || 'Payment was not successful. Please try again.',
    color: 'error',
  })
}
</script>
