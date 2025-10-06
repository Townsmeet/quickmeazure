<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12">
    <!-- Header -->
    <div class="text-center mb-12 w-full max-w-4xl px-4">
      <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
      <p class="text-lg text-gray-600">
        Select the perfect plan to start your tailoring business journey
      </p>
    </div>

    <!-- Pricing Plans -->
    <div class="w-full max-w-6xl px-4">
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
          size="xl"
          color="primary"
          :loading="isProcessing"
          :disabled="!selectedPlan"
          class="px-12 py-4 text-lg font-semibold"
          @click="confirmPlan"
        >
          {{ getButtonText() }}
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

// Get button text based on selected plan
const getButtonText = () => {
  if (!selectedPlan.value) return 'Select a Plan'

  return selectedPlan.value === 'free' ? 'Continue with Free Plan' : 'Continue & Setup Payment'
}

// Confirm plan and proceed
const confirmPlan = async () => {
  if (!selectedPlan.value) return

  isProcessing.value = true

  try {
    const selectedPlanData = getPlanById(selectedPlan.value, billingInterval.value)

    if (selectedPlan.value === 'free') {
      // For free plan, go directly to setup measurements
      toast.add({
        title: 'Welcome to QuickMeazure!',
        description: "Let's set up your measurement templates.",
        color: 'success',
      })

      await navigateTo('/auth/setup-measurements')
    } else {
      // For paid plans, handle payment setup
      toast.add({
        title: 'Plan selected',
        description: `You've selected the ${selectedPlanData?.name} plan. Setting up payment...`,
        color: 'success',
      })

      // TODO: Integrate with payment system (Paystack)
      // For now, redirect to setup measurements
      await navigateTo('/auth/setup-measurements')
    }
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Something went wrong. Please try again.',
      color: 'error',
    })
  } finally {
    isProcessing.value = false
  }
}
</script>
