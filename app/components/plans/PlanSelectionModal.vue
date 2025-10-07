<template>
  <UModal
    :open="modelValue"
    :title="title"
    aria-labelledby="plan-selection-modal-title"
    role="dialog"
    @close="onClose"
  >
    <template #header>
      <h2 id="plan-selection-modal-title" class="text-lg font-medium text-gray-900">
        {{ title }}
      </h2>
    </template>

    <template #body>
      <div class="space-y-6">
        <!-- Billing Toggle -->
        <div class="flex flex-col items-center mb-6">
          <div class="flex justify-center items-center gap-4 mb-2">
            <span :class="{ 'font-semibold': !isAnnualBilling, 'text-gray-500': isAnnualBilling }">
              Monthly
            </span>
            <button
              class="relative inline-flex h-6 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              :class="{ 'bg-primary-600': isAnnualBilling, 'bg-gray-300': !isAnnualBilling }"
              role="switch"
              type="button"
              :aria-checked="isAnnualBilling"
              aria-label="Toggle between monthly and annual billing"
              @click="toggleBilling"
            >
              <span
                class="inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                :class="{ 'translate-x-6': isAnnualBilling, 'translate-x-0': !isAnnualBilling }"
              />
            </button>
            <span :class="{ 'font-semibold': isAnnualBilling, 'text-gray-500': !isAnnualBilling }">
              Annual
            </span>
            <span
              v-if="isAnnualBilling"
              class="text-sm bg-primary-100 text-primary-800 py-1 px-2 rounded-full font-medium"
            >
              Save 15%
            </span>
          </div>
          <p class="text-sm text-center text-primary-700 bg-primary-50 py-2 px-4 rounded-full">
            <span v-if="isAnnualBilling">
              Annual billing saves you 15% compared to monthly billing
            </span>
            <span v-else>Switch to annual billing to save 15%</span>
          </p>
        </div>

        <!-- Plan Options -->
        <div :key="'plan-options-' + modalRefreshKey" class="space-y-4">
          <div
            v-for="plan in displayedPlans"
            :key="plan.value"
            class="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-primary-500 transition-colors"
            :class="{ 'border-primary-500 bg-primary-50': selectedPlanValue === plan.value }"
            @click="$emit('update:selectedPlan', plan.value)"
          >
            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              <div class="flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <h4 class="text-lg font-medium">
                    {{ plan.label }}
                  </h4>
                  <UBadge v-if="plan.value === 'professional'" color="primary" size="xs">
                    Popular
                  </UBadge>
                  <UBadge
                    v-if="isAnnualBilling && plan.numericPrice > 0"
                    color="success"
                    size="xs"
                    class="ml-auto sm:ml-0"
                  >
                    Save 15%
                  </UBadge>
                </div>
                <p class="text-base text-gray-600 mt-1">
                  {{ plan.description }}
                </p>

                <!-- Mobile pricing -->
                <div class="mt-2 mb-3 sm:hidden">
                  <div class="font-bold text-lg">
                    ₦{{ plan?.numericPrice?.toLocaleString() || '0' }}/{{
                      isAnnualBilling ? 'year' : 'month'
                    }}
                  </div>
                  <div
                    v-if="isAnnualBilling && plan.numericPrice > 0"
                    class="text-sm text-gray-600"
                  >
                    (₦{{ Math.round(plan.numericPrice / 12).toLocaleString() }}/month equivalent)
                  </div>
                  <div v-if="plan.numericPrice === 0" class="text-sm font-medium text-green-600">
                    Free forever
                  </div>
                </div>

                <!-- Feature list -->
                <div class="relative">
                  <ul class="mt-2 space-y-1">
                    <li
                      v-for="(feature, index) in Array.isArray(plan.features)
                        ? plan.features.slice(0, 3)
                        : []"
                      :key="index"
                      class="text-sm text-gray-700 flex items-center"
                    >
                      <UIcon
                        name="i-heroicons-check"
                        class="text-primary-600 mr-2 h-4 w-4 flex-shrink-0"
                      />
                      {{ feature }}
                    </li>
                  </ul>
                </div>
              </div>
              <!-- Desktop pricing -->
              <div class="text-right sm:min-w-[140px] flex flex-col items-end justify-between">
                <div class="hidden sm:block">
                  <div class="font-bold text-lg">
                    ₦{{ plan?.numericPrice?.toLocaleString() || '0' }}/{{
                      isAnnualBilling ? 'year' : 'month'
                    }}
                  </div>
                  <div
                    v-if="isAnnualBilling && plan.numericPrice > 0"
                    class="text-sm text-gray-600"
                  >
                    (₦{{ Math.round(plan.numericPrice / 12).toLocaleString() }}/month equivalent)
                  </div>
                  <div v-if="plan.numericPrice === 0" class="text-sm font-medium text-green-600">
                    Free forever
                  </div>
                </div>

                <!-- Selection indicator -->
                <div class="mt-3 sm:mt-auto">
                  <UButton
                    v-if="selectedPlanValue === plan.value"
                    size="sm"
                    color="primary"
                    variant="subtle"
                    class="whitespace-nowrap"
                  >
                    Selected
                  </UButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end space-x-3">
        <UButton color="neutral" variant="outline" @click="onClose"> Cancel </UButton>
        <UButton
          color="primary"
          :loading="isLoading"
          :disabled="isLoading || !selectedPlanValue"
          @click="onConfirm"
        >
          {{ confirmButtonText }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: 'Select a Plan',
  },
  confirmButtonText: {
    type: String,
    default: 'Confirm Plan',
  },
  defaultBillingPeriod: {
    type: String,
    default: 'monthly',
    validator: (value: string) => ['monthly', 'annual'].includes(value),
  },
  selectedPlan: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'update:selectedPlan', 'confirm', 'close', 'error'])

// State
const isAnnualBilling = ref(props.defaultBillingPeriod === 'annual')
const isLoading = ref(false)
const modalRefreshKey = ref(0)

// Composables
const { currentSubscription } = useSubscriptions()

// Computed
const selectedPlanValue = computed({
  get: () => props.selectedPlan,
  set: value => emit('update:selectedPlan', value),
})

// Get plans (simplified for now - can be moved to a separate composable)
const plans = computed(() => {
  // TODO: Create a usePlans composable or add to useSubscriptions
  return []
})

// Filter and format plans for display
const displayedPlans = computed(() => {
  if (!plans.value || plans.value.length === 0) {
    return []
  }

  // Always show monthly plans, but adjust pricing based on billing period
  return plans.value
    .filter(plan => {
      // Only show monthly plans as base
      return ['month', 'monthly'].includes(plan.interval)
    })
    .map(plan => {
      // Calculate annual price (10 months worth for 15% discount)
      const annualPrice = plan.price > 0 ? Math.round(plan.price * 10) : 0

      return {
        value: plan.id.toString(),
        label: plan.name,
        description: plan.description || '',
        numericPrice: isAnnualBilling.value ? annualPrice : plan.price,
        features: plan.features || [],
        isFeatured: plan.isFeatured || false,
        maxClients: plan.maxClients || 0,
      }
    })
    .reverse() // Reverse the order of plans
})

// Methods
const toggleBilling = () => {
  isAnnualBilling.value = !isAnnualBilling.value
  // Force re-render of plan options
  modalRefreshKey.value++
}

const onClose = () => {
  emit('update:modelValue', false)
  emit('close')
}

const onConfirm = async () => {
  if (!selectedPlanValue.value) return

  try {
    isLoading.value = true
    emit('confirm', selectedPlanValue.value)
  } catch (error) {
    console.error('Error confirming plan selection:', error)
    emit('error', error)
  } finally {
    isLoading.value = false
  }
}

// Watch for modal open to initialize selection
watch(
  () => props.modelValue,
  newValue => {
    if (newValue) {
      // If no plan is selected, select the first one
      if (!selectedPlanValue.value && displayedPlans.value.length > 0) {
        selectedPlanValue.value = displayedPlans.value[0].value
      }
    }
  }
)

// Initialize on mount
onMounted(() => {
  // Set billing period from props
  isAnnualBilling.value = props.defaultBillingPeriod === 'annual'

  // If no plan is selected and plans are available, select the first one
  if (!selectedPlanValue.value && displayedPlans.value.length > 0) {
    selectedPlanValue.value = displayedPlans.value[0].value
  }
})
</script>
