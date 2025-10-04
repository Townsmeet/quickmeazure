<template>
  <div class="space-y-6">
    <PageHeader
      title="Client Details"
      subtitle="View and manage client information"
      :primary-action="{
        label: 'Back to Clients',
        icon: 'i-heroicons-arrow-left',
        to: CLIENTS_PATH,
      }"
    />

    <div v-if="isLoading" class="flex justify-center py-12">
      <USkeleton class="h-32 w-full" />
    </div>

    <template v-else-if="client">
      <!-- Client Information -->
      <UCard class="bg-white">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-medium">Client Information</h2>
            <UButton
              color="primary"
              variant="ghost"
              icon="i-heroicons-pencil-square"
              :to="`/clients/${clientId}/edit`"
            >
              Edit
            </UButton>
          </div>
        </template>

        <div class="flex flex-col md:flex-row gap-6">
          <!-- Avatar and Name -->
          <div class="flex flex-col items-center md:items-start">
            <div
              class="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mb-3"
            >
              <span class="text-primary-700 text-2xl font-medium">{{
                getInitials(client.name)
              }}</span>
            </div>
            <h1 class="text-xl font-bold text-gray-900 mb-1">
              {{ client.name }}
            </h1>
            <p class="text-gray-500">Client since {{ formatDate(client.createdAt) }}</p>
          </div>

          <!-- Contact Info -->
          <div class="flex-1 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div class="text-sm text-gray-500 mb-1">Email</div>
                <div>{{ client.email || 'Not provided' }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-500 mb-1">Phone</div>
                <div>{{ client.phone || 'Not provided' }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-500 mb-1">Address</div>
                <div>{{ client.address || 'Not provided' }}</div>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Measurements Card -->
      <UCard v-if="client" class="bg-white">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-medium">Measurements</h2>
            <UButton
              color="primary"
              variant="ghost"
              icon="i-heroicons-pencil-square"
              :to="`/clients/${clientId}/edit`"
            >
              Edit
            </UButton>
          </div>
        </template>

        <div v-if="client.measurement">
          <!-- Template Information (if available) -->
          <div v-if="client.measurement.values && client.measurement.values._template" class="mb-4">
            <div class="bg-primary-50 border border-primary-200 rounded-lg p-3 text-primary-700">
              <div class="flex items-center">
                <UIcon name="i-heroicons-document-text" class="mr-2" />
                <span class="font-medium">{{ client.measurement.values._template.name }}</span>
                <span class="ml-2 text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">
                  {{
                    client.measurement.values._template.gender.charAt(0).toUpperCase() +
                    client.measurement.values._template.gender.slice(1)
                  }}
                </span>
              </div>
            </div>
          </div>

          <!-- Upper Body Measurements -->
          <div v-if="upperBodyMeasurements.length > 0" class="mb-6">
            <h4 class="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <UIcon name="i-heroicons-user-circle" class="w-4 h-4 mr-2 text-primary-500" />
              Upper Body
            </h4>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div
                v-for="measurement in upperBodyMeasurements"
                :key="measurement.key"
                :class="[
                  'border rounded-lg p-3 shadow-sm',
                  measurement.isEmpty ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200',
                ]"
              >
                <div class="flex justify-between items-center mb-1">
                  <div class="text-xs text-gray-500">{{ measurement.name }}</div>
                  <div v-if="measurement.isRequired" class="text-xs text-red-500">*</div>
                </div>
                <div v-if="!measurement.isEmpty" class="font-medium">
                  {{ measurement.value }}{{ measurement.unit }}
                </div>
                <div v-else class="text-gray-400 italic text-sm">Not provided</div>
              </div>
            </div>
          </div>

          <!-- Lower Body Measurements -->
          <div v-if="lowerBodyMeasurements.length > 0" class="mb-6">
            <h4 class="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <UIcon name="i-heroicons-rectangle-stack" class="w-4 h-4 mr-2 text-primary-500" />
              Lower Body
            </h4>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div
                v-for="measurement in lowerBodyMeasurements"
                :key="measurement.key"
                :class="[
                  'border rounded-lg p-3 shadow-sm',
                  measurement.isEmpty ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200',
                ]"
              >
                <div class="flex justify-between items-center mb-1">
                  <div class="text-xs text-gray-500">{{ measurement.name }}</div>
                  <div v-if="measurement.isRequired" class="text-xs text-red-500">*</div>
                </div>
                <div v-if="!measurement.isEmpty" class="font-medium">
                  {{ measurement.value }}{{ measurement.unit }}
                </div>
                <div v-else class="text-gray-400 italic text-sm">Not provided</div>
              </div>
            </div>
          </div>

          <!-- Other Measurements -->
          <div v-if="otherMeasurements.length > 0" class="mb-6">
            <h4 class="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <UIcon name="i-heroicons-variable" class="w-4 h-4 mr-2 text-primary-500" />
              Other Measurements
            </h4>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div
                v-for="measurement in otherMeasurements"
                :key="measurement.key"
                :class="[
                  'border rounded-lg p-3 shadow-sm',
                  measurement.isEmpty ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200',
                ]"
              >
                <div class="flex justify-between items-center mb-1">
                  <div class="text-xs text-gray-500">{{ measurement.name }}</div>
                  <div v-if="measurement.isRequired" class="text-xs text-red-500">*</div>
                </div>
                <div v-if="!measurement.isEmpty" class="font-medium">
                  {{ measurement.value }}{{ measurement.unit }}
                </div>
                <div v-else class="text-gray-400 italic text-sm">Not provided</div>
              </div>
            </div>
          </div>

          <!-- Measurement Notes -->
          <div v-if="client.measurement.notes" class="mb-4">
            <h4 class="text-sm font-medium text-gray-700 mb-3 flex items-center">Notes</h4>
            <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div class="whitespace-pre-line">
                {{ client.measurement.notes }}
              </div>
            </div>
          </div>

          <div v-if="client.measurement.lastUpdated" class="mt-4 text-xs text-gray-500 italic">
            Last updated: {{ formatDate(client.measurement.lastUpdated) }}
          </div>
        </div>

        <div v-else class="text-center py-5 bg-white border border-gray-200 rounded-lg shadow-sm">
          <UIcon name="i-heroicons-ruler" class="text-gray-400 mx-auto mb-2" size="lg" />
          <h3 class="text-base font-medium text-gray-900">No measurements available</h3>
          <p class="text-gray-500 text-sm mt-1">Measurements will appear here when added</p>
        </div>
      </UCard>

      <!-- Orders -->
      <UCard class="bg-white">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-medium">Orders</h2>
            <UButton
              color="primary"
              variant="solid"
              icon="i-heroicons-plus"
              :to="`/orders/new?clientId=${clientId}`"
            >
              Create Order
            </UButton>
          </div>
        </template>

        <div v-if="isLoadingOrders" class="py-6 flex justify-center">
          <USkeleton class="h-24 w-full" />
        </div>

        <div v-else-if="orders.length === 0" class="py-6 text-center">
          <UIcon name="i-heroicons-shopping-bag" class="text-gray-400 mx-auto mb-2" size="xl" />
          <h3 class="text-lg font-medium text-gray-900">No orders yet</h3>
          <p class="text-gray-500 mt-1 mb-4">Create your first order for this client</p>
          <UButton color="primary" :to="`/orders/new?clientId=${clientId}`" icon="i-heroicons-plus">
            Create Order
          </UButton>
        </div>

        <div v-else>
          <UTable :columns="orderColumns" :rows="orders" hover>
            <template #status-data="{ row }">
              <UBadge :color="getStatusColor(row.status)" variant="subtle" size="sm">
                {{ row.status }}
              </UBadge>
            </template>

            <template #dueDate-data="{ row }">
              <div v-if="row.dueDate" class="flex items-center">
                <span
                  :class="{
                    'text-red-600 font-medium': isOverdue(row.dueDate),
                    'text-amber-600 font-medium': !isOverdue(row.dueDate) && isDueSoon(row.dueDate),
                  }"
                >
                  {{ formatDate(row.dueDate) }}
                </span>
                <UIcon
                  v-if="isOverdue(row.dueDate)"
                  name="i-heroicons-exclamation-circle"
                  class="text-red-500 ml-1"
                />
                <UIcon
                  v-else-if="isDueSoon(row.dueDate)"
                  name="i-heroicons-clock"
                  class="text-amber-500 ml-1"
                />
              </div>
              <span v-else class="text-gray-400">Not set</span>
            </template>

            <template #payment-data="{ row }">
              <div class="flex flex-col">
                <div class="text-sm font-medium">
                  {{ formatPrice(row.totalAmount) }}
                </div>
                <div
                  class="text-xs"
                  :class="{
                    'text-green-600': row.balanceAmount <= 0,
                    'text-amber-600': row.depositAmount > 0 && row.balanceAmount > 0,
                    'text-gray-500': row.depositAmount <= 0,
                  }"
                >
                  <template v-if="row.balanceAmount <= 0"> Paid in full </template>
                  <template v-else-if="row.depositAmount > 0">
                    {{ formatPrice(row.balanceAmount) }} balance
                  </template>
                  <template v-else> No payment </template>
                </div>
              </div>
            </template>

            <template #actions-data="{ row }">
              <div class="flex space-x-2">
                <UButton
                  icon="i-heroicons-eye"
                  color="gray"
                  variant="ghost"
                  size="xs"
                  :to="`/orders/${row.id}/detail`"
                />
                <UButton
                  color="gray"
                  variant="ghost"
                  icon="i-heroicons-pencil-square"
                  size="xs"
                  :to="`/orders/${row.id}/edit`"
                />
              </div>
            </template>
          </UTable>
        </div>
      </UCard>
    </template>

    <template v-else>
      <UCard class="bg-white">
        <div class="py-12 text-center">
          <UIcon name="i-heroicons-face-frown" class="text-gray-400 mx-auto mb-2" size="xl" />
          <h3 class="text-lg font-medium text-gray-900">Client not found</h3>
          <p class="text-gray-500 mt-1 mb-4">
            This client doesn't exist or you don't have access to it.
          </p>
          <UButton color="primary" to="/clients" icon="i-heroicons-arrow-left">
            Back to Clients
          </UButton>
        </div>
      </UCard>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/store/modules/auth'
import { useClientStore } from '~/store/modules/client'
import { storeToRefs } from 'pinia'

// Composable
const routes = useAppRoutes()
const route = useRoute()

// Get client ID from route
const clientId = route.params.id as string

// Constants
const CLIENTS_PATH = routes.ROUTE_PATHS[routes.ROUTE_NAMES.DASHBOARD.CLIENTS.INDEX] as string
const _getEditClientPath = (id: string): string =>
  (
    routes.ROUTE_PATHS[routes.ROUTE_NAMES.DASHBOARD.CLIENTS.EDIT] as (params: {
      id: string
    }) => string
  )({ id })

// Use client store
const clientStore = useClientStore()
const authStore = useAuthStore()
const { currentClient: client, isLoading } = storeToRefs(clientStore)

// Orders data
const orders = ref([])
const isLoadingOrders = ref(true)

// Computed properties for categorized measurements
const upperBodyMeasurements = computed(() => {
  if (!client.value?.measurement?.values) return []

  // Filter and format upper body measurements
  return Object.entries(client.value.measurement.values)
    .filter(([key, data]) => {
      // Skip template info
      if (key === '_template') return false

      // IMPORTANT: Prioritize the explicit category from the template
      if (data.category) {
        const category = data.category.toLowerCase()
        return category.includes('upper')
      }

      // Special case for waist - it can be in either upper or lower body
      // For now, include it in upper body if it's not explicitly categorized
      const name = (data.name || key).toLowerCase()
      if (name.includes('waist')) {
        return true
      }

      // Fallback to name-based categorization if no category is specified
      return ['bust', 'chest', 'shoulder', 'sleeve', 'neck', 'arm'].some(term =>
        name.includes(term)
      )
    })
    .map(([key, data]) => ({
      key,
      name: data.name || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      value: data.value,
      unit: data.unit || '"',
      category: data.category || 'Upper Body',
      isRequired: data.isRequired || false,
      displayOrder: data.displayOrder || 0,
      // Fix: Properly handle zero values (0 is a valid measurement value)
      isEmpty: data.value === null || data.value === '' || data.value === undefined,
    }))
    .sort((a, b) => {
      // Sort by display order first, then by name
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder
      }
      return a.name.localeCompare(b.name)
    })
})

const lowerBodyMeasurements = computed(() => {
  if (!client.value?.measurement?.values) return []

  // Filter and format lower body measurements
  return Object.entries(client.value.measurement.values)
    .filter(([key, data]) => {
      // Skip template info
      if (key === '_template') return false

      // IMPORTANT: Prioritize the explicit category from the template
      if (data.category) {
        const category = data.category.toLowerCase()
        return category.includes('lower')
      }

      // Skip waist as it's handled in upper body when not explicitly categorized
      const name = (data.name || key).toLowerCase()
      if (name.includes('waist')) {
        return false
      }

      // Fallback to name-based categorization if no category is specified
      return ['hip', 'inseam', 'thigh', 'leg', 'calf', 'ankle'].some(term => name.includes(term))
    })
    .map(([key, data]) => ({
      key,
      name: data.name || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      value: data.value,
      unit: data.unit || '"',
      category: data.category || 'Lower Body',
      isRequired: data.isRequired || false,
      displayOrder: data.displayOrder || 0,
      // Fix: Properly handle zero values (0 is a valid measurement value)
      isEmpty: data.value === null || data.value === '' || data.value === undefined,
    }))
    .sort((a, b) => {
      // Sort by display order first, then by name
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder
      }
      return a.name.localeCompare(b.name)
    })
})

const otherMeasurements = computed(() => {
  if (!client.value?.measurement?.values) return []

  // Filter and format other measurements that don't fit in upper or lower body
  return Object.entries(client.value.measurement.values)
    .filter(([key, data]) => {
      // Skip template info
      if (key === '_template') return false

      // Skip if already categorized as upper or lower body
      if (data.category) {
        const category = data.category.toLowerCase()
        if (category.includes('upper') || category.includes('lower')) {
          return false
        }
        return true // If it has a category but not upper/lower, include it here
      }

      // For items without a category, check if they match common upper/lower body terms
      const name = (data.name || key).toLowerCase()

      const upperBodyTerms = ['bust', 'chest', 'shoulder', 'sleeve', 'neck', 'arm']
      const lowerBodyTerms = ['hip', 'inseam', 'thigh', 'leg', 'calf', 'ankle']

      // If the name doesn't match any common body part terms, include it in other
      return (
        !upperBodyTerms.some(term => name.includes(term)) &&
        !lowerBodyTerms.some(term => name.includes(term))
      )
    })
    .map(([key, data]) => ({
      key,
      name: data.name || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      value: data.value,
      unit: data.unit || '"',
      category: data.category || 'Other',
      isRequired: data.isRequired || false,
      displayOrder: data.displayOrder || 0,
      // Fix: Properly handle zero values (0 is a valid measurement value)
      isEmpty: data.value === null || data.value === '' || data.value === undefined,
    }))
    .sort((a, b) => {
      // Sort by display order first, then by name
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder
      }
      return a.name.localeCompare(b.name)
    })
})

// Set page metadata
useHead({
  title: client.value?.name
    ? `${client.value.name} - QuickMeazure`
    : 'Client Details - QuickMeazure',
})

// Watch for client name changes to update page title
watch(
  () => client.value?.name,
  newName => {
    if (newName) {
      useHead({
        title: `${newName} - QuickMeazure`,
      })
    }
  }
)

// Debug function to analyze measurement data
const debugMeasurements = data => {
  if (!data.measurement?.values) return

  console.log('Raw measurement values:', JSON.stringify(data.measurement.values, null, 2))

  // Count total fields and fields with values
  const allFields = Object.entries(data.measurement.values).filter(([key]) => key !== '_template')
  const fieldsWithValues = allFields.filter(([_, data]) => {
    return data.value !== null && data.value !== '' && data.value !== undefined
  })

  console.log(`Total fields: ${allFields.length}, Fields with values: ${fieldsWithValues.length}`)

  // Check upper body fields
  const upperBodyFields = upperBodyMeasurements.value
  console.log('Upper body measurements:', upperBodyFields)
  console.log('Upper body fields with values:', upperBodyFields.filter(m => !m.isEmpty).length)

  // Check if any fields might be miscategorized
  const upperBodyKeys = upperBodyFields.map(m => m.key)
  const potentialUpperBodyFields = allFields.filter(([key, data]) => {
    if (upperBodyKeys.includes(key)) return false

    const name = (data.name || key).toLowerCase()
    return ['upper', 'bust', 'chest', 'shoulder', 'sleeve', 'neck', 'arm', 'waist'].some(
      term => name.includes(term) || (data.category || '').toLowerCase().includes(term)
    )
  })

  if (potentialUpperBodyFields.length > 0) {
    console.log(
      'Potential upper body fields that might be miscategorized:',
      potentialUpperBodyFields.map(([key, data]) => ({
        key,
        name: data.name,
        category: data.category,
        value: data.value,
      }))
    )
  }
}

// Fetch client details
const fetchClient = async () => {
  try {
    isLoading.value = true

    // Use useAsyncData for GET request
    const { data: response, error } = await useAsyncData(`client-${clientId}`, () =>
      $fetch(`/api/clients/${clientId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
      })
    )

    if (error.value) {
      throw new Error(error.value?.data?.message || 'Failed to load client details')
    }

    if (response.value) {
      // Update the store with the fetched client
      clientStore.setCurrentClient(response.value.data)

      // Run debug analysis on the measurement data
      if (client.value) {
        debugMeasurements(client.value)
      }
    }
  } catch (error) {
    console.error('Error fetching client:', error)

    useToast().add({
      title: 'Error',
      description: error.message || 'Failed to load client details. Please try again.',
      color: 'error',
    })
  } finally {
    isLoading.value = false
  }
}

// Fetch client orders
const fetchOrders = async () => {
  if (!clientId) return
  isLoadingOrders.value = true

  try {
    if (!authStore.isLoggedIn) {
      useToast().add({
        title: 'Authentication required',
        description: 'Please log in to view orders',
        color: 'warning',
      })
      navigateTo('/auth/login')
      return
    }

    // Use useAsyncData for GET request
    const { data: response, error } = await useAsyncData(`orders-client-${clientId}`, () =>
      $fetch(`/api/orders?clientId=${clientId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authStore.token}`,
          'Content-Type': 'application/json',
        },
      })
    )

    if (error.value) {
      throw new Error(error.value?.data?.message || 'Failed to load orders')
    }

    if (response.value) {
      orders.value = response.value
    }
  } catch (error) {
    console.error('Error fetching orders:', error)
    useToast().add({
      title: 'Error',
      description: error.message || 'Failed to load orders',
      color: 'error',
    })
  } finally {
    isLoadingOrders.value = false
  }
}

// Column definitions for orders table
const orderColumns = [
  {
    key: 'status',
    label: 'Status',
    id: 'status',
  },
  {
    key: 'dueDate',
    label: 'Due Date',
    id: 'dueDate',
  },
  {
    key: 'payment',
    label: 'Payment',
    id: 'payment',
  },
  {
    key: 'actions',
    label: '',
    id: 'actions',
  },
]

// Utility functions
const getInitials = name => {
  if (!name) return ''
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

const formatDate = timestamp => {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

const formatPrice = amount => {
  return `₦${amount.toLocaleString()}`
}

// Check if order is overdue
const isOverdue = dueDate => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  return dueDate < today
}

// Check if order is due soon (within 3 days)
const isDueSoon = dueDate => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const threeDaysFromNow = today + 3 * 24 * 60 * 60 * 1000
  return dueDate >= today && dueDate <= threeDaysFromNow
}

// Get status color
const getStatusColor = status => {
  switch (status) {
    case 'Pending':
      return 'gray'
    case 'In Progress':
      return 'blue'
    case 'Ready for Pickup':
      return 'amber'
    case 'Completed':
      return 'green'
    case 'Cancelled':
      return 'red'
    default:
      return 'gray'
  }
}

// Fetch data on component mount
onMounted(() => {
  fetchClient()
  fetchOrders()
})
</script>
