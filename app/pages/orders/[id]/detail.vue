<template>
  <div class="space-y-6">
    <PageHeader
      title="Order Details"
      subtitle="View and manage order information"
      :primary-action="{
        label: 'Back to Orders',
        icon: 'i-heroicons-arrow-left',
        to: '/orders',
      }"
    />

    <div v-if="isLoading" class="flex justify-center py-12">
      <USkeleton class="h-32 w-full" />
    </div>

    <template v-else-if="order">
      <!-- Order Status Banner -->
      <div
        :class="{
          'bg-amber-50 border-amber-200': order.status === 'Pending',
          'bg-blue-50 border-blue-200': order.status === 'In Progress',
          'bg-purple-50 border-purple-200': order.status === 'Ready for Pickup',
          'bg-green-50 border-green-200': order.status === 'Completed',
          'bg-gray-50 border-gray-200': order.status === 'Cancelled',
        }"
        class="border rounded-lg p-4 flex items-center justify-between"
      >
        <div class="flex items-center">
          <UIcon
            :name="
              {
                Pending: 'i-heroicons-clock',
                'In Progress': 'i-heroicons-cog-6-tooth',
                'Ready for Pickup': 'i-heroicons-check-badge',
                Completed: 'i-heroicons-check-circle',
                Cancelled: 'i-heroicons-x-circle',
              }[order.status]
            "
            :class="{
              'text-amber-600': order.status === 'Pending',
              'text-blue-600': order.status === 'In Progress',
              'text-purple-600': order.status === 'Ready for Pickup',
              'text-green-600': order.status === 'Completed',
              'text-gray-600': order.status === 'Cancelled',
            }"
            class="mr-2 text-xl"
          />
          <div>
            <h3 class="font-medium">Status: {{ order.status }}</h3>
            <p class="text-sm text-gray-600">
              <template v-if="order.status === 'Pending'">
                Order is waiting to be processed
              </template>
              <template v-else-if="order.status === 'In Progress'">
                Order is currently being worked on
              </template>
              <template v-else-if="order.status === 'Ready for Pickup'">
                Order is ready for the client to pick up
              </template>
              <template v-else-if="order.status === 'Completed'">
                Order has been completed and delivered
              </template>
              <template v-else-if="order.status === 'Cancelled'">
                Order has been cancelled
              </template>
            </p>
          </div>
        </div>

        <UDropdownMenu placement="bottom-end">
          <UButton color="white" trailing-icon="i-heroicons-chevron-down"> Update Status </UButton>
          <template #items>
            <UButton
              class="w-full justify-start px-2 py-1 text-left"
              :disabled="
                order.status === 'In Progress' ||
                order.status === 'Completed' ||
                order.status === 'Cancelled'
              "
              variant="ghost"
              @click="updateOrderStatus('In Progress')"
            >
              <template #leading>
                <UIcon name="i-heroicons-cog-6-tooth" />
              </template>
              Mark as In Progress
            </UButton>
            <UButton
              class="w-full justify-start px-2 py-1 text-left"
              :disabled="
                order.status === 'Ready for Pickup' ||
                order.status === 'Completed' ||
                order.status === 'Cancelled'
              "
              variant="ghost"
              @click="updateOrderStatus('Ready for Pickup')"
            >
              <template #leading>
                <UIcon name="i-heroicons-check-badge" />
              </template>
              Mark as Ready for Pickup
            </UButton>
            <UButton
              class="w-full justify-start px-2 py-1 text-left"
              :disabled="order.status === 'Completed' || order.status === 'Cancelled'"
              variant="ghost"
              @click="updateOrderStatus('Completed')"
            >
              <template #leading>
                <UIcon name="i-heroicons-check-circle" />
              </template>
              Mark as Completed
            </UButton>
            <UButton
              class="w-full justify-start px-2 py-1 text-left"
              :disabled="order.status === 'Cancelled'"
              variant="ghost"
              @click="updateOrderStatus('Cancelled')"
            >
              <template #leading>
                <UIcon name="i-heroicons-x-circle" />
              </template>
              Mark as Cancelled
            </UButton>
          </template>
        </UDropdownMenu>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Order Details -->
        <UCard class="bg-white lg:col-span-2">
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-medium">Order Details</h3>
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-pencil-square"
                size="sm"
                :to="`/orders/${order.id}/edit`"
              >
                Edit
              </UButton>
            </div>
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
                <NuxtLink
                  :to="`/clients/${order.clientId}`"
                  class="font-medium text-primary-600 hover:underline"
                >
                  {{ order.clientName }}
                </NuxtLink>
                <p class="text-sm text-gray-500">Client</p>
              </div>
            </div>

            <!-- Style Information -->
            <div v-if="order.styleId" class="border-t border-gray-100 pt-4">
              <h4 class="text-sm font-medium text-gray-500 mb-2">Style</h4>
              <div class="flex items-center">
                <div
                  v-if="order.styleImageUrl"
                  class="w-16 h-16 bg-gray-100 rounded-md overflow-hidden mr-4"
                >
                  <img
                    :src="order.styleImageUrl"
                    :alt="order.styleName"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p class="font-medium">
                    {{ order.styleName }}
                  </p>
                  <NuxtLink
                    :to="`/styles/${order.styleId}`"
                    class="text-sm text-primary-600 hover:underline"
                  >
                    View Style Details
                  </NuxtLink>
                </div>
              </div>
            </div>

            <!-- Order Dates -->
            <div class="border-t border-gray-100 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 class="text-sm font-medium text-gray-500 mb-1">Order Date</h4>
                <p>{{ formatDate(order.createdAt) }}</p>
              </div>

              <div>
                <h4 class="text-sm font-medium text-gray-500 mb-1">Due Date</h4>
                <p
                  :class="{
                    'text-red-600': isOverdue(order.dueDate),
                    'text-amber-600': isDueSoon(order.dueDate) && !isOverdue(order.dueDate),
                  }"
                >
                  {{ order.dueDate ? formatDate(order.dueDate) : 'Not specified' }}
                  <UBadge
                    v-if="isOverdue(order.dueDate)"
                    color="red"
                    variant="subtle"
                    size="xs"
                    class="ml-2"
                  >
                    Overdue
                  </UBadge>
                  <UBadge
                    v-else-if="isDueSoon(order.dueDate)"
                    color="amber"
                    variant="subtle"
                    size="xs"
                    class="ml-2"
                  >
                    Due Soon
                  </UBadge>
                </p>
              </div>
            </div>

            <!-- Notes -->
            <div v-if="order.notes" class="border-t border-gray-100 pt-4">
              <h4 class="text-sm font-medium text-gray-500 mb-2">Notes</h4>
              <p class="text-gray-700 whitespace-pre-line">
                {{ order.notes }}
              </p>
            </div>
          </div>
        </UCard>

        <!-- Payment Information -->
        <UCard class="bg-white">
          <template #header>
            <h3 class="text-lg font-medium">Payment</h3>
          </template>

          <div class="space-y-4">
            <div class="flex justify-between items-center pb-2 border-b border-gray-100">
              <span class="text-gray-600">Total Amount</span>
              <span class="font-medium">{{ formatPrice(order.totalAmount) }}</span>
            </div>

            <div class="flex justify-between items-center pb-2 border-b border-gray-100">
              <span class="text-gray-600">Deposit Paid</span>
              <span class="font-medium">{{ formatPrice(order.depositAmount) }}</span>
            </div>

            <div class="flex justify-between items-center pb-2 border-b border-gray-100">
              <span class="text-gray-600">Balance Due</span>
              <span class="font-medium" :class="{ 'text-red-600': order.balanceAmount > 0 }">
                {{ formatPrice(order.balanceAmount) }}
              </span>
            </div>

            <div class="flex justify-between items-center pt-2">
              <span class="text-gray-600 font-medium">Payment Status</span>
              <UBadge :color="order.balanceAmount > 0 ? 'amber' : 'green'" variant="subtle">
                {{ order.balanceAmount > 0 ? 'Partial Payment' : 'Paid in Full' }}
              </UBadge>
            </div>
          </div>

          <template #footer>
            <UButton
              v-if="order.balanceAmount > 0"
              color="primary"
              block
              :to="`/orders/${order.id}/payment`"
            >
              Record Payment
            </UButton>
          </template>
        </UCard>
      </div>
    </template>

    <div v-else class="text-center py-12">
      <UIcon name="i-heroicons-face-frown" class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-lg font-medium text-gray-900">Order not found</h3>
      <p class="mt-1 text-sm text-gray-500">
        The order you're looking for doesn't exist or has been deleted.
      </p>
      <div class="mt-6">
        <UButton to="/orders" color="primary">Go back to Orders</UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '#imports'
import { ref, onMounted } from 'vue'
import type { Order } from '~/types/order'

// Get the order ID from the route
const route = useRoute()
const orderId = route.params.id as string

// Initialize composables
const { getOrder, updateOrderStatus } = useOrders()
const { user } = useAuth()
const toast = useToast()

// State
const isLoading = ref(true)
const order = ref<Order | null>(null)
const error = ref<string | null>(null)

// Fetch order data
const fetchOrder = async () => {
  isLoading.value = true
  error.value = null

  try {
    const { data, error: fetchError } = await useAsyncData(`order-${orderId}`, () =>
      $fetch(`${API_ENDPOINTS.ORDERS.BASE}/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authStore.token}`,
        },
      })
    )

    if (fetchError.value) {
      throw new Error(fetchError.value?.data?.message || 'Failed to fetch order')
    }

    if (data.value) {
      order.value = data.value
    } else {
      throw new Error('Failed to fetch order')
    }
  } catch (err) {
    console.error('Error fetching order:', err)
    error.value = err.message || 'An error occurred while fetching the order'

    toast.add({
      title: 'Error',
      description: error.value,
      color: 'red',
    })

    if (err.response?.status === 404) {
      navigateTo('/orders')
    }
  } finally {
    isLoading.value = false
  }
}

// Utility functions
const getInitials = (name: string) => {
  if (!name) return ''
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

const formatDate = (timestamp: string) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

// Check if an order is overdue
const isOverdue = (dueDate: string) => {
  if (!dueDate) return false
  const now = new Date()
  const due = new Date(dueDate)
  return due < now
}

// Check if an order is due soon (within the next 3 days)
const isDueSoon = (dueDate: string) => {
  if (!dueDate) return false
  const now = new Date()
  const due = new Date(dueDate)
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  return due > now && due <= threeDaysFromNow
}

// Update order status
const updateOrderStatus = async (newStatus: string) => {
  if (!order.value) return

  try {
    const response = await orderApi.updateOrderStatus(order.value.id, newStatus as any)

    if (response.success && response.order) {
      order.value = response.order

      toast.add({
        title: 'Success',
        description: `Order status updated to ${newStatus}`,
        color: 'green',
      })
    } else {
      throw new Error(response.error || 'Failed to update order status')
    }
  } catch (err) {
    console.error('Error updating order status:', err)

    toast.add({
      title: 'Error',
      description: err.message || 'Failed to update order status. Please try again.',
      color: 'red',
    })
  }
}

// Fetch order data on component mount
onMounted(() => {
  fetchOrder()
})
</script>
