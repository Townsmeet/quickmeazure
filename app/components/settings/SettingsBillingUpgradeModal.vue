<template>
  <UModal :open="isOpen" @update:open="value => (isOpen = value)">
    <template #content>
      <UCard class="max-w-4xl">
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
          <div class="flex justify-center">
            <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex">
              <button
                :class="[
                  'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                  billingPeriod === 'monthly'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white',
                ]"
                @click="billingPeriod = 'monthly'"
              >
                Monthly
              </button>
              <button
                :class="[
                  'px-4 py-2 text-sm font-medium rounded-md transition-colors relative',
                  billingPeriod === 'annual'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white',
                ]"
                @click="billingPeriod = 'annual'"
              >
                Annual
                <span
                  class="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full"
                >
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          <!-- Plans Grid -->
          <div v-if="!plansLoading" class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              v-for="plan in filteredPlans"
              :key="plan.id"
              :class="[
                'relative rounded-lg border-2 p-6 cursor-pointer transition-all',
                selectedPlan?.id === plan.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                plan.isFeatured ? 'ring-2 ring-primary-500' : '',
              ]"
              @click="selectedPlan = plan"
            >
              <!-- Featured Badge -->
              <div
                v-if="plan.isFeatured"
                class="absolute -top-3 left-1/2 transform -translate-x-1/2"
              >
                <span class="bg-primary-500 text-white px-3 py-1 text-xs font-medium rounded-full">
                  Most Popular
                </span>
              </div>

              <!-- Current Plan Badge -->
              <div v-if="currentPlan?.id === plan.id" class="absolute -top-3 right-4">
                <span class="bg-green-500 text-white px-3 py-1 text-xs font-medium rounded-full">
                  Current Plan
                </span>
              </div>

              <div class="text-center">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ plan.name }}</h3>
                <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">{{ plan.description }}</p>

                <div class="mt-4">
                  <span class="text-3xl font-bold text-gray-900 dark:text-white">
                    ₦{{ formatPrice(getDisplayPrice(plan)) }}
                  </span>
                  <span class="text-gray-600 dark:text-gray-400">
                    /{{ billingPeriod === 'annual' ? 'year' : 'month' }}
                  </span>
                </div>

                <!-- Savings Badge for Annual -->
                <div v-if="billingPeriod === 'annual' && plan.price > 0" class="mt-2">
                  <span class="text-sm text-green-600 dark:text-green-400 font-medium">
                    Save ₦{{ formatPrice(getAnnualSavings(plan)) }} per year
                  </span>
                </div>
              </div>

              <!-- Features List -->
              <div class="mt-6 space-y-3">
                <div class="text-sm font-medium text-gray-900 dark:text-white">Features:</div>
                <ul class="space-y-2">
                  <li v-if="plan.maxClients" class="flex items-center text-sm">
                    <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-500 mr-2" />
                    <span class="text-gray-600 dark:text-gray-400">
                      {{ plan.maxClients === -1 ? 'Unlimited' : plan.maxClients }} clients
                    </span>
                  </li>
                  <li v-if="plan.maxStyles" class="flex items-center text-sm">
                    <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-500 mr-2" />
                    <span class="text-gray-600 dark:text-gray-400">
                      {{ plan.maxStyles === -1 ? 'Unlimited' : plan.maxStyles }} templates
                    </span>
                  </li>
                  <li v-if="plan.maxStorage" class="flex items-center text-sm">
                    <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-500 mr-2" />
                    <span class="text-gray-600 dark:text-gray-400">
                      {{ formatStorage(plan.maxStorage) }} storage
                    </span>
                  </li>
                  <li
                    v-for="(feature, key) in plan.features"
                    :key="String(key)"
                    class="flex items-center text-sm"
                  >
                    <UIcon
                      :name="feature ? 'i-heroicons-check' : 'i-heroicons-x-mark'"
                      :class="['w-4 h-4 mr-2', feature ? 'text-green-500' : 'text-red-500']"
                    />
                    <span class="text-gray-600 dark:text-gray-400">
                      {{ formatFeatureName(String(key)) }}
                    </span>
                  </li>
                </ul>
              </div>

              <!-- Selection Indicator -->
              <div v-if="selectedPlan?.id === plan.id" class="absolute top-4 right-4">
                <div class="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                  <UIcon name="i-heroicons-check" class="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div v-else class="flex justify-center py-12">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 animate-spin" />
          </div>

          <!-- Payment Summary -->
          <div
            v-if="selectedPlan && selectedPlan.price > 0"
            class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
          >
            <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Payment Summary</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Plan:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{
                  selectedPlan.name
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Billing:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ billingPeriod }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Amount:</span>
                <span class="font-medium text-gray-900 dark:text-white">
                  ₦{{ formatPrice(getDisplayPrice(selectedPlan)) }}
                </span>
              </div>
              <div
                v-if="billingPeriod === 'annual'"
                class="flex justify-between text-green-600 dark:text-green-400"
              >
                <span>Annual Savings:</span>
                <span class="font-medium">₦{{ formatPrice(getAnnualSavings(selectedPlan)) }}</span>
              </div>
            </div>
          </div>
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
              :disabled="!selectedPlan || currentPlan?.id === selectedPlan?.id"
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
import type { Plan } from '~/types'

interface Props {
  modelValue: boolean
  currentPlan?: Plan | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'upgraded'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Reactive state
const plans = ref<Plan[]>([])
const selectedPlan = ref<Plan | null>(null)
const billingPeriod = ref<'monthly' | 'annual'>('monthly')
const plansLoading = ref(true)
const upgradeLoading = ref(false)

// Toast for notifications
const toast = useToast()

// Computed
const isOpen = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const filteredPlans = computed(() => {
  return plans.value.filter(plan => {
    // Show all plans, but adjust pricing based on billing period
    return true
  })
})

// Fetch plans when modal opens
watch(isOpen, async newValue => {
  if (newValue && plans.value.length === 0) {
    await fetchPlans()
  }
  if (newValue) {
    selectedPlan.value = props.currentPlan || null
  }
})

// Methods
async function fetchPlans() {
  plansLoading.value = true
  try {
    const response = (await $fetch('/api/subscriptions/plans')) as any
    if (response.success) {
      plans.value = response.data
    }
  } catch (error) {
    console.error('Error fetching plans:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to load subscription plans',
      color: 'error',
    })
  } finally {
    plansLoading.value = false
  }
}

async function upgradePlan() {
  if (!selectedPlan.value) return

  upgradeLoading.value = true

  try {
    const response = (await $fetch('/api/subscriptions/change-plan', {
      method: 'POST',
      body: {
        planId: selectedPlan.value.id,
        billingPeriod: billingPeriod.value,
      },
    })) as any

    if (response.success) {
      emit('upgraded')
      toast.add({
        title: 'Success',
        description: 'Plan updated successfully',
        color: 'success',
      })
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

// Utility functions
function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

function getDisplayPrice(plan: Plan): number {
  if (billingPeriod.value === 'annual' && plan.price > 0) {
    // Apply 20% discount for annual billing
    return Math.floor(plan.price * 12 * 0.8)
  }
  return plan.price
}

function getAnnualSavings(_plan: Plan): number {
  if (_plan.price === 0) return 0
  const monthlyTotal = _plan.price * 12
  const annualPrice = getDisplayPrice(_plan)
  return monthlyTotal - annualPrice
}

function formatStorage(storage: number): string {
  if (storage === -1) return 'Unlimited'
  if (storage >= 1024) return `${storage / 1024}GB`
  return `${storage}MB`
}

function formatFeatureName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}
</script>
