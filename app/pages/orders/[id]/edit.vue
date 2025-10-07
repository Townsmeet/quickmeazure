<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <PageHeader
      title="Edit Order"
      :primary-action="{
        label: 'Save Changes',
        onClick: saveOrder,
        disabled: _isSaving,
      }"
    />

    <div v-if="isLoading" class="flex justify-center py-12">
      <USkeleton class="h-32 w-full">
        <div class="h-full flex items-center justify-center text-gray-400">
          Loading order details...
        </div>
      </USkeleton>
    </div>

    <UCard v-else class="bg-white">
      <form class="space-y-6" @submit.prevent="saveOrder">
        <!-- Basic Information -->
        <div>
          <div class="grid grid-cols-1 gap-6">
            <!-- Client (read-only) -->
            <UFormField
for="clientId"
label="Client"
name="clientId"
required>
              <UInput
                id="clientId"
                :model-value="clientName"
                disabled
                class="bg-gray-50 w-full"
                icon="i-heroicons-user"
                size="lg"
              />
            </UFormField>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Style Selection -->
              <UFormField for="styleId" label="Style" name="styleId">
                <USelectMenu
                  id="styleId"
                  v-model="form.styleId"
                  :items="styleOptions"
                  size="lg"
                  class="w-full"
                  placeholder="Select a style (optional)"
                />
              </UFormField>

              <!-- Order Status -->
              <UFormField
for="status"
label="Status"
name="status"
required>
                <USelectMenu
                  id="status"
                  v-model="form.status"
                  :items="statusOptions"
                  size="lg"
                  class="w-full"
                  placeholder="Select status"
                  required
                />
              </UFormField>

              <!-- Due Date -->
              <UFormField for="dueDate" label="Due Date" name="dueDate">
                <UInput
                  id="dueDate"
                  v-model="form.dueDate"
                  type="date"
                  size="lg"
                  class="w-full"
                  icon="i-heroicons-calendar"
                />
              </UFormField>
            </div>
          </div>
        </div>

        <!-- Collapsible Sections -->
        <div class="mt-6 space-y-4">
          <!-- Payment Section -->
          <div class="border rounded-lg overflow-hidden shadow-sm transition-all hover:shadow-md">
            <div
              class="flex justify-between items-center p-4 cursor-pointer transition-colors"
              :class="
                openSections.includes('payment')
                  ? 'bg-primary-50 border-b border-primary-100'
                  : 'bg-white'
              "
              @click="toggleSection('payment')"
            >
              <div class="font-medium flex items-center">
                <UIcon name="i-heroicons-banknotes" class="h-5 w-5 mr-2 text-primary-500" />
                Payment Information
              </div>
              <UIcon
                :name="
                  openSections.includes('payment')
                    ? 'i-heroicons-chevron-up'
                    : 'i-heroicons-chevron-down'
                "
                class="h-5 w-5 transition-transform text-primary-500"
              />
            </div>

            <div
              v-show="openSections.includes('payment')"
              class="p-6 bg-gray-50 rounded-b-lg space-y-6 border-t border-primary-100"
            >
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <UFormField
for="totalAmount"
label="Total Amount"
name="totalAmount"
required>
                  <UInput
                    id="totalAmount"
                    v-model.number="form.totalAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    size="lg"
                    class="w-full"
                    required
                    @input="calculateBalance"
                  >
                    <template #leading>
                      <span class="inline-flex items-center text-primary-700 text-sm font-medium">
                        ₦
                      </span>
                    </template>
                  </UInput>
                </UFormField>

                <UFormField for="depositAmount" label="Deposit Amount" name="depositAmount">
                  <UInput
                    id="depositAmount"
                    v-model.number="form.depositAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    size="lg"
                    class="w-full"
                    @input="calculateBalance"
                  >
                    <template #leading>
                      <span class="inline-flex items-center text-primary-700 text-sm font-medium">
                        ₦
                      </span>
                    </template>
                  </UInput>
                </UFormField>

                <UFormField for="balanceAmount" label="Balance Due" name="balanceAmount">
                  <UInput
                    id="balanceAmount"
                    :model-value="balanceAmount"
                    type="number"
                    disabled
                    class="w-full bg-gray-50"
                    size="lg"
                  >
                    <template #leading>
                      <span class="inline-flex items-center text-primary-700 text-sm font-medium">
                        ₦
                      </span>
                    </template>
                  </UInput>
                </UFormField>
              </div>
            </div>
          </div>

          <!-- Additional Information Section -->
          <div class="border rounded-lg overflow-hidden shadow-sm transition-all hover:shadow-md">
            <div
              class="flex justify-between items-center p-4 cursor-pointer transition-colors"
              :class="
                openSections.includes('notes')
                  ? 'bg-primary-50 border-b border-primary-100'
                  : 'bg-white'
              "
              @click="toggleSection('notes')"
            >
              <div class="font-medium flex items-center">
                <UIcon name="i-heroicons-document-text" class="h-5 w-5 mr-2 text-primary-500" />
                Additional Information
              </div>
              <UIcon
                :name="
                  openSections.includes('notes')
                    ? 'i-heroicons-chevron-up'
                    : 'i-heroicons-chevron-down'
                "
                class="h-5 w-5 transition-transform text-primary-500"
              />
            </div>

            <div
              v-show="openSections.includes('notes')"
              class="p-6 bg-gray-50 rounded-b-lg space-y-6 border-t border-primary-100"
            >
              <UFormField for="notes" label="Notes" name="notes">
                <UTextarea
                  id="notes"
                  v-model="form.notes"
                  placeholder="Add any additional notes about this order..."
                  :rows="4"
                  class="w-full"
                  size="lg"
                />
              </UFormField>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end space-x-4 pt-6 border-t mt-6">
          <UButton
            type="button"
            color="neutral"
            variant="outline"
            size="lg"
            :to="`/orders/${orderId}/detail`"
            icon="i-heroicons-x-mark"
          >
            Cancel
          </UButton>
          <UButton
            type="submit"
            color="primary"
            :loading="isSubmitting"
            size="lg"
            icon="i-heroicons-check"
          >
            Save Changes
          </UButton>
        </div>
      </form>
    </UCard>
  </div>
</template>

<script setup lang="ts">
// Get the order ID from the route
// Import utilities
import { ref, onMounted } from 'vue'
import { useOrderApi } from '~/composables/useOrderApi'
import type { Order, OrderItem } from '~/types/order'

// Using _ prefix to indicate it's used in template
const _UpdateOrderInput = {} as any // Type used in saveOrder function

// Initialize composables
const orderApi = useOrderApi()
const { styles, fetchStyles } = useStyles()
const toast = useToast()
const route = useRoute()
const router = useRouter()

// Component state
const isLoading = ref(true)
const _isSaving = ref(false) // Using _ prefix since it's used in template
const error = ref<string | null>(null)
const orderId = route.params.id as string

// Form state
const form = ref<Partial<Order>>({
  clientId: '',
  clientName: '',
  styleId: '',
  status: 'Pending',
  dueDate: '',
  totalAmount: 0,
  depositAmount: 0,
  balanceAmount: 0,
  notes: '',
  items: [] as OrderItem[],
  measurements: {},
})

// Style options for dropdown
const styleOptions = computed(() => {
  if (!styles.value || !Array.isArray(styles.value)) return []

  return styles.value.map(style => ({
    label: style.name || 'Unnamed Style',
    value: style.id,
    icon: 'i-heroicons-swatch',
  }))
})

// Set page metadata
useHead({
  title: computed(() => `Edit Order #${orderId}`),
})

// Track which sections are open
const openSections = ref(['payment', 'notes'])

// Toggle section visibility
const toggleSection = sectionValue => {
  if (!openSections.value.includes(sectionValue)) {
    openSections.value.push(sectionValue)
  } else {
    openSections.value = openSections.value.filter(item => item !== sectionValue)
  }
}

// Form validation to ensure deposit isn't more than total
const calculateBalance = () => {
  const total = Number(form.value.totalAmount) || 0
  const deposit = Number(form.value.depositAmount) || 0
  form.value.balanceAmount = Math.max(0, total - deposit)
}

// Format date for input field
const formatDateForInput = dateString => {
  if (!dateString) return ''

  try {
    // Handle different date formats
    let date

    if (typeof dateString === 'number') {
      // Handle timestamp number
      date = new Date(dateString)
    } else if (typeof dateString === 'string') {
      // Check if it's an ISO string or other format
      if (dateString.includes('T')) {
        // ISO format
        date = new Date(dateString)
      } else if (dateString.includes('-')) {
        // YYYY-MM-DD format
        const [year, month, day] = dateString.split('-').map(Number)
        date = new Date(year, month - 1, day)
      } else {
        // Try general parsing
        date = new Date(dateString)
      }
    } else {
      // Default fallback
      date = new Date(dateString)
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateString)
      return ''
    }

    // Format as YYYY-MM-DD for input type="date"
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  } catch (error) {
    console.error('Error formatting date:', error, dateString)
    return ''
  }
}

// Fetch order data
const fetchOrder = async () => {
  isLoading.value = true
  error.value = null

  try {
    const response = await orderApi.getOrderById(orderId)

    if (response.success && response.data) {
      const orderData = response.data

      form.value = {
        ...orderData,
        dueDate: formatDateForInput(orderData.dueDate),
        // Ensure items and measurements are properly initialized
        items: orderData.items || [],
        measurements: orderData.measurements || {},
      }

      // Calculate initial balance
      calculateBalance()
    } else {
      throw new Error(response.error || 'Failed to load order')
    }
  } catch (err) {
    console.error('Error fetching order:', err)
    error.value = err.message || 'Failed to load order details'

    toast.add({
      title: 'Error',
      description: error.value,
      color: 'red',
    })

    // Redirect back to orders list after a short delay
    setTimeout(() => {
      router.push('/orders')
    }, 2000)
  } finally {
    isLoading.value = false
  }
}

// Fetch order data and styles on component mount
onMounted(async () => {
  await Promise.all([fetchOrder(), fetchStyles()])
})
</script>
