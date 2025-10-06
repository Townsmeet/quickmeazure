<template>
  <section id="pricing" class="py-16 bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="text-center mb-12">
        <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Simple, Transparent Pricing
        </h2>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          Choose the plan that fits your business needs.
          {{
            isAnnual
              ? `Save ${getSavingsPercentage()}% with annual billing.`
              : 'Start with our free plan and upgrade as your business grows.'
          }}
        </p>
      </div>

      <!-- Billing Toggle -->
      <div class="flex justify-center items-center gap-4 mb-12">
        <span :class="{ 'font-semibold text-gray-900': !isAnnual, 'text-gray-500': isAnnual }">
          Monthly
        </span>
        <UToggle v-model="isAnnual" size="lg" />
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
          :billing-period="formatBillingPeriod(plan.interval)"
          :badge="plan.isPopular ? 'Most Popular' : undefined"
          :features="plan.features"
          :button="getButtonProps(plan)"
          :scale="plan.isPopular"
          :highlight="plan.isPopular"
        />
      </UPricingPlans>

      <!-- Additional Info -->
      <div class="text-center mt-12">
        <p class="text-sm text-gray-500">
          All plans include a 14-day free trial. No credit card required.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  getPlans,
  formatPrice,
  formatBillingCycle,
  formatBillingPeriod,
  getSavingsPercentage,
  type Plan,
} from '~/data/subscription-plans'

// Billing period state
const isAnnual = ref(false)

// Get plans based on billing period
const displayedPlans = computed(() => {
  return getPlans(isAnnual.value ? 'annually' : 'monthly')
})

// Get button props for each plan
const getButtonProps = (plan: Plan) => {
  const planParam = plan.id === 'free' ? '' : `?plan=${plan.id}`
  const billingParam = isAnnual.value ? `${planParam ? '&' : '?'}billing=annually` : ''

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
