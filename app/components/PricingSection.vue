<template>
  <section id="pricing" class="py-16 bg-gray-50">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-12">
        <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Simple, Transparent Pricing
        </h2>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          Choose the plan that fits your business needs.
        </p>
      </div>

      <!-- Billing Toggle -->
      <div class="flex justify-center items-center gap-4 mb-12">
        <span :class="{ 'font-semibold text-gray-900': !isAnnual, 'text-gray-500': isAnnual }">
          Monthly
        </span>
        <USwitch v-model="isAnnual" size="lg" />
        <span :class="{ 'font-semibold text-gray-900': isAnnual, 'text-gray-500': !isAnnual }">
          Annual
        </span>
        <UBadge
v-if="isAnnual"
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
          :badge="plan.isPopular ? 'Most Popular' : undefined"
          :features="plan.features"
          :button="getButtonProps(plan)"
          :scale="plan.isPopular"
          :highlight="plan.isPopular"
        />
      </UPricingPlans>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  getPlans,
  formatPrice,
  formatBillingCycle,
  getSavingsPercentage,
  type Plan,
} from '~/data/subscription-plans'

// Billing period state
const isAnnual = ref(false)

// Get plans based on billing period
const displayedPlans = computed(() => {
  return getPlans(isAnnual.value ? 'annual' : 'month')
})

// Get button props for each plan
const getButtonProps = (plan: Plan) => {
  const planParam = plan.id === 'free' ? '' : `?plan=${plan.id}`
  // keep the billingParam as 'annually' only if your backend expects it. Otherwise 'annual'.
  const billingParam = isAnnual.value ? `${planParam ? '&' : '?'}billing=annual` : ''

  return {
    label: plan.id === 'free' ? 'Get Started' : `Choose ${plan.name}`,
    to: `/auth/register${planParam}${billingParam}`,
    color: plan.isPopular ? ('primary' as const) : ('neutral' as const),
    variant: plan.isPopular ? ('solid' as const) : ('outline' as const),
    block: true,
    size: 'lg' as const,
  }
}
</script>
