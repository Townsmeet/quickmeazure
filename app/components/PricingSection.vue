<template>
  <section id="pricing" class="py-[3rem] bg-[#F9FAFB] rounded-xl p-[2rem]">
    <h2 class="text-[1.875rem] font-bold text-center mb-[1rem]">Simple, Transparent Pricing</h2>
    <p class="text-center text-[#4B5563] mb-[2rem] max-w-[36rem] mx-auto">
      Choose the plan that fits your business needs.
      {{
        isAnnual
          ? 'Save 15% with annual billing.'
          : 'Start with our free plan and upgrade as your business grows.'
      }}
    </p>

    <!-- Billing Toggle -->
    <div class="flex justify-center items-center gap-4 mb-[2rem]">
      <span :class="{ 'font-semibold': !isAnnual, 'text-gray-500': isAnnual }">Monthly</span>
      <button
        class="relative inline-flex h-6 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
        :class="{ 'bg-primary-600': isAnnual, 'bg-gray-300': !isAnnual }"
        role="switch"
        type="button"
        size="lg"
        aria-checked="false"
        @click="toggleBilling"
      >
        <span
          class="inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
          :class="{ 'translate-x-6': isAnnual, 'translate-x-0': !isAnnual }"
        />
      </button>
      <span :class="{ 'font-semibold': isAnnual, 'text-gray-500': !isAnnual }">Annual</span>
      <span
v-if="isAnnual"
class="text-sm bg-primary-100 text-primary-800 py-1 px-2 rounded-full"
        >Save 15%</span
      >
    </div>

    <div class="grid md:grid-cols-3 gap-[2rem] max-w-[64rem] mx-auto">
      <!-- Plan Cards -->
      <div
        v-for="plan in displayedPlans"
        :key="plan.id"
        class="bg-white rounded-lg shadow-md overflow-hidden flex flex-col"
        :class="{ 'transform scale-[1.05] border-2 border-primary-500': plan.isFeatured }"
      >
        <div
          v-if="plan.isFeatured"
          class="bg-primary-500 text-white text-center py-[0.5rem] text-[0.875rem] font-medium"
        >
          MOST POPULAR
        </div>
        <div class="p-[1.5rem] flex-grow">
          <h3 class="text-[1.5rem] font-bold mb-[0.5rem]">
            {{ plan.name }}
          </h3>
          <p class="text-[#4B5563] mb-[1rem]">
            {{ plan.description }}
          </p>
          <div class="text-[2.25rem] font-bold mb-[1.5rem]">
            ₦{{ getPrice(plan.price) === 0 ? '0' : getPrice(plan.price).toLocaleString() }}
            <span class="text-[1.125rem] text-[#6B7280] font-normal"
              >/{{ formatInterval(plan.interval) }}</span
            >
          </div>

          <ul class="space-y-[0.75rem] mb-[1.5rem]">
            <li
              v-if="plan.maxClients !== undefined && plan.maxClients !== null"
              class="flex items-center"
            >
              <UIcon name="i-heroicons-check-circle" class="text-[#10B981] mr-[0.5rem]" />
              <span
                >{{
                  plan.maxClients === -1 ? 'Unlimited' : `Up to ${plan.maxClients}`
                }}
                clients</span
              >
            </li>
            <li
              v-for="feature in Array.isArray(plan.features)
                ? plan.features.filter(f => !f.toLowerCase().includes('clients'))
                : []"
              :key="feature"
              class="flex items-center"
            >
              <UIcon
                :name="featureIcons[(feature || '').toLowerCase()] || 'i-heroicons-check-circle'"
                class="text-[#10B981] mr-[0.5rem]"
              />
              <span>{{ feature }}</span>
            </li>
            <li v-if="isAnnual && plan.price > 0" class="flex items-center text-primary-700">
              <UIcon name="i-heroicons-check-circle" class="text-primary-700 mr-[0.5rem]" />
              <span><strong>Save 2 months</strong> with annual billing</span>
            </li>
          </ul>
        </div>

        <div class="p-[1.5rem] bg-[#F9FAFB] mt-auto">
          <UButton
            size="lg"
            :to="`/auth/register${plan.name !== 'Growth' ? `?plan=${plan.name.toLowerCase()}${isAnnual ? '-annual' : ''}&billing=${isAnnual ? 'annual' : 'monthly'}` : ''}`"
            color="primary"
            :variant="plan.isFeatured ? 'solid' : 'outline'"
            block
          >
            {{
              plan.name === 'Growth' && plan.price === 0
                ? 'Get Started'
                : `Choose ${plan.name}${isAnnual ? ' Annual' : ''}`
            }}
          </UButton>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { monthlyPlans, annualPlans } from '~/data/subscription-plans'

// Billing period state
const isAnnual = ref(false)

// Toggle billing period
const toggleBilling = () => {
  isAnnual.value = !isAnnual.value
}

// Computed plans based on billing period
const displayedPlans = computed(() => {
  const plans = isAnnual.value ? annualPlans : monthlyPlans
  return plans.slice().sort((a, b) => (a.price || 0) - (b.price || 0))
})

// Get the appropriate price
const getPrice = price => {
  return Number(price) || 0
}

// Format the interval based on billing period
const formatInterval = interval => {
  if (isAnnual.value) {
    return 'year'
  }
  return interval || 'month'
}

// Define feature icons by name for display
const featureIcons = {
  clients: 'i-heroicons-check-circle',
  measurements: 'i-heroicons-check-circle',
  payment: 'i-heroicons-check-circle',
  styles: 'i-heroicons-check-circle',
  notifications: 'i-heroicons-check-circle',
  analytics: 'i-heroicons-check-circle',
  support: 'i-heroicons-check-circle',
}
</script>
