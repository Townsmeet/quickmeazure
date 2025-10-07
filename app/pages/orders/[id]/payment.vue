<template>
  <div class="space-y-6">
    <PageHeader
      title="Record Payment"
      subtitle="Add a payment for this order"
      :primary-action="{
        label: 'Back to Order',
        icon: 'i-heroicons-arrow-left',
        to: `/orders/${orderId}/detail`,
      }"
    />

    <div v-if="isLoading" class="flex justify-center py-12">
      <USkeleton class="h-32 w-full" />
    </div>

    <template v-else-if="order">
      <form class="space-y-6" @submit.prevent="savePayment">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Order Summary -->
          <UCard class="bg-white">
            <template #header>
              <h3 class="text-lg font-medium">Order Summary</h3>
            </template>

            <div class="space-y-4">
              <!-- Client Information -->
              <div class="flex items-center">
                <div
                  class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3"
                >
                  <span class="text-primary-700 font-medium text-lg">{{
                    getInitials(order.clientName)
                  }}</span>
                </div>
                <div>
                  <span class="font-medium">{{ order.clientName }}</span>
                  <p class="text-sm text-gray-500">Client</p>
                </div>
              </div>

              <!-- Order Status -->
              <div class="flex justify-between items-center py-2 border-t border-gray-100">
                <span class="text-gray-600">Status</span>
                <UBadge :color="getStatusColor(order.status)" variant="subtle">
                  {{ order.status }}
                </UBadge>
              </div>

              <!-- Payment Information -->
              <div class="border-t border-gray-100 pt-2 space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">Total Amount</span>
                  <span class="font-medium">{{ formatPrice(order.totalAmount) }}</span>
                </div>

                <div class="flex justify-between items-center">
                  <span class="text-gray-600">Amount Paid</span>
                  <span class="font-medium">{{ formatPrice(order.depositAmount) }}</span>
                </div>

                <div class="flex justify-between items-center">
                  <span class="text-gray-600 font-medium">Balance Due</span>
                  <span class="font-medium text-red-600">{{
                    formatPrice(order.balanceAmount)
                  }}</span>
                </div>
              </div>
            </div>
          </UCard>

          <!-- Payment Form -->
          <UCard class="bg-white lg:col-span-2">
            <template #header>
              <h3 class="text-lg font-medium">Payment Details</h3>
            </template>

            <div class="space-y-6">
              <!-- Payment Amount -->
              <UFormField label="Amount" required>
                <UInput
                  v-model="form.amount"
                  type="text"
                  placeholder="Enter amount"
                  class="w-full"
                  :ui="{ leading: 'pointer-events-none', base: 'pl-[40px] w-full' }"
                >
                  <template #leading>
                    <p class="text-sm text-muted">₦</p>
                  </template>
                </UInput>
              </UFormField>

              <!-- Payment Method -->
              <UFormField label="Payment Method *" required>
                <URadioGroup v-model="form.paymentMethod" :items="paymentMethodOptions" />
              </UFormField>

              <!-- Date -->
              <UFormField label="Payment Date *" required>
                <UInput
                  v-model="form.paymentDate"
                  type="date"
                  :max="todayFormatted"
                  required
                  class="w-full"
                />
              </UFormField>

              <!-- Notes -->
              <UFormField label="Notes">
                <UTextarea
                  v-model="form.notes"
                  class="w-full"
                  placeholder="Add any additional notes about this payment..."
                  :ui="{ base: 'h-24 w-full' }"
                />
              </UFormField>
            </div>

            <!-- Submit Button -->
            <template #footer>
              <div class="flex justify-end space-x-4">
                <UButton
                  type="button"
                  color="gray"
                  variant="outline"
                  :to="`/orders/${orderId}/detail`"
                >
                  Cancel
                </UButton>
                <UButton type="submit" color="primary" :loading="isSubmitting">
                  Record Payment
                </UButton>
              </div>
            </template>
          </UCard>
        </div>
      </form>
    </template>

    <div v-else class="text-center py-12">
      <UIcon name="i-heroicons-face-frown" class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-lg font-medium text-gray-900">Order not found</h3>
      <p class="mt-1 text-gray-500">
        The order you are looking for doesn't exist or you don't have permission to view it.
      </p>
      <div class="mt-6">
        <UButton to="/orders" color="primary"> Go back to Orders </UButton>
      </div>
    </div>
  </div>
</template>

<script setup>
// Get the order ID from the route
// Import composables

const route = useRoute()
const orderId = route.params.id

// Initialize composables
const { getOrder, updateOrder } = useOrders()
const { user } = useAuth()

// State management
const order = ref(null)
const isLoading = ref(true)
const isSubmitting = ref(false)

// Form state
const form = ref({
  amount: 0,
  paymentMethod: 'Cash',
  paymentDate: '',
  notes: '',
})

// Set page metadata
useHead({
  title: 'Record Payment - QuickMeazure',
})

// Get today's date in yyyy-mm-dd format for the date picker max attribute
const todayFormatted = computed(() => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
})

// Payment method options
const paymentMethodOptions = [
  { label: 'Cash', value: 'Cash' },
  { label: 'Credit Card', value: 'Credit Card' },
  { label: 'Bank Transfer', value: 'Bank Transfer' },
  { label: 'Mobile Payment', value: 'Mobile Payment' },
  { label: 'Other', value: 'Other' },
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

const _formatDate = timestamp => {
  const date = new Date(timestamp)
  const month = date.toLocaleString('en-US', { month: 'short' })
  const day = date.getDate().toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${month} ${day}, ${year}`
}

const formatPrice = amount => {
  return `₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const getStatusColor = status => {
  switch (status) {
    case 'Pending':
      return 'amber'
    case 'In Progress':
      return 'blue'
    case 'Ready for Pickup':
      return 'purple'
    case 'Completed':
      return 'green'
    case 'Cancelled':
      return 'gray'
    default:
      return 'gray'
  }
}

// Fetch order details
const fetchOrderDetails = async () => {
  isLoading.value = true

  try {
    // Fetch the order by ID with auth headers
    const data = await $fetch(`/api/orders/${orderId}`, {
      headers: {
        ...authStore.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
    })

    // Set order data
    order.value = data

    // If order is paid in full or cancelled, redirect
    if (data.balanceAmount <= 0) {
      useToast().add({
        title: 'Order Fully Paid',
        description: 'This order has already been paid in full.',
        color: 'blue',
      })
      navigateTo(`/orders/${orderId}/detail`)
      return
    }

    if (data.status === 'Cancelled') {
      useToast().add({
        title: 'Order Cancelled',
        description: 'Cannot record payment for a cancelled order.',
        color: 'red',
      })
      navigateTo(`/orders/${orderId}/detail`)
      return
    }

    // Set default payment amount to remaining balance
    form.value.amount = data.balanceAmount

    // Set today's date as default
    form.value.paymentDate = todayFormatted.value
  } catch (error) {
    console.error('Error fetching order details:', error)
    let errorMessage = 'Failed to load order details. Please try again.'

    // Handle unauthorized errors
    if (error.response?.status === 401) {
      errorMessage = 'Your session has expired. Please log in again.'
      navigateTo('/auth/login')
    }

    useToast().add({
      title: 'Error',
      description: errorMessage,
      color: 'red',
    })
  } finally {
    isLoading.value = false
  }
}

// Save the payment
const savePayment = async () => {
  // Form validation
  if (
    !form.value.amount ||
    form.value.amount <= 0 ||
    !form.value.paymentMethod ||
    !form.value.paymentDate
  ) {
    useToast().add({
      title: 'Validation Error',
      description: 'Please fill in all required fields.',
      color: 'red',
    })
    return
  }

  // Ensure payment amount doesn't exceed balance
  if (form.value.amount > order.value.balanceAmount) {
    form.value.amount = order.value.balanceAmount
  }

  isSubmitting.value = true

  try {
    // Format payment date
    const paymentDate = new Date(form.value.paymentDate).getTime()

    // Call the payment API
    await $fetch(`/api/payments`, {
      method: 'POST',
      headers: {
        ...authStore.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: {
        orderId: orderId,
        amount: form.value.amount,
        paymentMethod: form.value.paymentMethod,
        paymentDate,
        notes: form.value.notes,
      },
    })

    // Update the order with new deposit amount
    const newDepositAmount = order.value.depositAmount + form.value.amount
    const newBalanceAmount = order.value.totalAmount - newDepositAmount

    await $fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: {
        depositAmount: newDepositAmount,
        balanceAmount: newBalanceAmount,
      },
    })

    // If fully paid and order status is pending or in progress, update to ready for pickup
    if (
      newBalanceAmount <= 0 &&
      (order.value.status === 'Pending' || order.value.status === 'In Progress')
    ) {
      await $fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: {
          status: 'Ready for Pickup',
        },
      })
    }

    // Show success notification
    useToast().add({
      title: 'Payment Recorded',
      description: `Payment of ${formatPrice(form.value.amount)} has been recorded successfully.`,
      color: 'green',
    })

    // Redirect to order details
    navigateTo(`/orders/${orderId}/detail`)
  } catch (error) {
    console.error('Error recording payment:', error)
    let errorMessage = 'Failed to record payment. Please try again.'

    // Handle unauthorized errors
    if (error.response?.status === 401) {
      errorMessage = 'Your session has expired. Please log in again.'
      navigateTo('/auth/login')
    }

    useToast().add({
      title: 'Error',
      description: errorMessage,
      color: 'red',
    })
  } finally {
    isSubmitting.value = false
  }
}

// Fetch data on component mount
onMounted(() => {
  fetchOrderDetails()
})
</script>
