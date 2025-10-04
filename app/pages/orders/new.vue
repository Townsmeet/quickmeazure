<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <PageHeader
      title="Add Order"
      :primary-action="{
        label: 'Create Order',
        onClick: saveOrder,
        disabled: isSubmitting,
      }"
    />

    <UCard class="bg-white">
      <form class="space-y-6" @submit.prevent="saveOrder">
        <!-- Basic Information -->
        <div>
          <div class="grid grid-cols-1 gap-6">
            <!-- Client Selection -->
            <UFormField
id="clientId"
label="Client"
name="clientId"
required>
              <USelectMenu
                id="clientId"
                v-model="form.clientId"
                :items="clientOptions"
                size="lg"
                class="w-full"
                placeholder="Select a client"
                required
              />
            </UFormField>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Style Selection -->
              <UFormField id="styleId" label="Style" name="styleId">
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
id="status"
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
              <UFormField id="dueDate" label="Due Date" name="dueDate">
                <UInput
id="dueDate"
v-model="form.dueDate"
type="date"
size="lg"
class="w-full" />
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
id="totalAmount"
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

                <UFormField id="depositAmount" label="Deposit Amount" name="depositAmount">
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

                <UFormField id="balanceAmount" label="Balance Due" name="balanceAmount">
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
              <UFormField id="notes" label="Notes" name="notes">
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

        <!-- No action buttons here as we moved the save button to the top -->
      </form>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { CreateOrderInput, OrderItem } from '~/types/order'
import { API_ENDPOINTS } from '~/constants/api'
import { useAuthStore } from '~/store/modules/auth'

// Composable
const routes = useAppRoutes()
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// Constants
const ORDERS_PATH = routes.ROUTE_PATHS[routes.ROUTE_NAMES.DASHBOARD.ORDERS.INDEX] as string

useHead({
  title: 'Create New Order',
})

// Track which sections are open
const openSections = ref(['payment'])

// Toggle section visibility
const toggleSection = sectionValue => {
  if (!openSections.value.includes(sectionValue)) {
    openSections.value.push(sectionValue)
  } else {
    openSections.value = openSections.value.filter(item => item !== sectionValue)
  }
}

// Form state
const form = ref<
  Omit<CreateOrderInput, 'items' | 'measurements'> & {
    items: OrderItem[]
    measurements: Record<string, any>
  }
>({
  clientId: '',
  clientName: '',
  styleId: '',
  status: 'Pending',
  dueDate: '',
  totalAmount: 0,
  depositAmount: 0,
  balanceAmount: 0,
  notes: '',
  items: [],
  measurements: {},
})

// Computed for balance amount
const balanceAmount = computed(() => {
  return (form.value.totalAmount || 0) - (form.value.depositAmount || 0)
})

// Status options
const statusOptions = [
  { label: 'Pending', value: 'Pending' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Ready for Pickup', value: 'Ready for Pickup' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Cancelled', value: 'Cancelled' },
]

// Initialize store
const orderStore = useOrderStore()
const { clients, styles } = storeToRefs(orderStore)

// Generate options for clients dropdown
const clientOptions = computed(() => {
  if (!clients.value || !Array.isArray(clients.value) || clients.value.length === 0) {
    console.log('No clients available to display')
    return []
  }

  return clients.value.map(client => ({
    label: client.name + (client.phone ? ` (${client.phone})` : ''),
    value: client.id,
    icon: 'i-heroicons-user',
  }))
})

const styleOptions = computed(() => {
  if (!styles.value || !Array.isArray(styles.value) || styles.value.length === 0) {
    console.log('No styles available to display')
    return []
  }

  return styles.value.map(style => ({
    label: style.name || 'Unnamed Style',
    value: style.id,
    icon: 'i-heroicons-swatch',
  }))
})

// Component state
const isLoading = ref(true)
const isSubmitting = ref(false)
const error = ref<string | null>(null)

// Save the new order
const saveOrder = async () => {
  if (isSubmitting.value) return

  isSubmitting.value = true
  error.value = null

  try {
    // Prepare the order data
    const orderData: CreateOrderInput = {
      clientId: form.value.clientId,
      clientName: form.value.clientName,
      styleId: form.value.styleId || null,
      status: form.value.status,
      dueDate: form.value.dueDate ? new Date(form.value.dueDate).toISOString() : null,
      totalAmount: Number(form.value.totalAmount) || 0,
      depositAmount: Number(form.value.depositAmount) || 0,
      balanceAmount: Number(form.value.balanceAmount) || 0,
      notes: form.value.notes || '',
      items: form.value.items || [],
      measurements: form.value.measurements || {},
    }

    // Create the order using $fetch directly
    const { data: response, error } = await useAsyncData('create-order', () =>
      $fetch(API_ENDPOINTS.ORDERS.BASE, {
        method: 'POST',
        body: orderData,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authStore.token}`,
        },
      })
    )

    if (error.value) {
      throw new Error(error.value?.data?.message || 'Failed to create order')
    }

    if (response.value) {
      // Show success message
      toast.add({
        title: 'Success',
        description: 'Order created successfully',
        color: 'green',
      })

      // Redirect to the new order's detail page
      await router.push(`/orders/${response.value.id}/detail`)
    } else {
      throw new Error('Failed to create order')
    }
  } catch (err: any) {
    console.error('Error creating order:', err)

    toast.add({
      title: 'Error',
      description: err.message || 'Failed to create order. Please try again.',
      color: 'red',
    })
  } finally {
    isSubmitting.value = false
  }
}

// Fetch initial data (clients, styles, etc.)
const fetchInitialData = async () => {
  isLoading.value = true

  try {
    // You might want to fetch clients and styles here if needed
    // For example:
    // await clientStore.fetchClients()
    // await styleStore.fetchStyles()
  } catch (err) {
    console.error('Error fetching initial data:', err)
    error.value = 'Failed to load required data. Please refresh the page.'

    toast.add({
      title: 'Error',
      description: error.value,
      color: 'red',
    })
  } finally {
    isLoading.value = false
  }
}

// Fetch data on component mount
onMounted(() => {
  fetchInitialData()
})
</script>
