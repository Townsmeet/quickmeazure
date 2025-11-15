<template>
  <div class="min-h-screen">
    <div class="max-w-7xl mx-auto pb-20 md:pb-6">
      <!-- Header Section -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Orders</h1>
          </div>
          <div class="flex gap-3">
            <UButton color="primary" size="lg" @click="openCreateOrderSlideover">
              Add Order
            </UButton>
          </div>
        </div>
      </div>

      <!-- Search and Filters -->
      <div class="mb-8">
        <UCard class="shadow-sm border-0">
          <div class="flex flex-col lg:flex-row gap-4">
            <!-- Search -->
            <div class="flex-1">
              <UInput
                v-model="search"
                placeholder="Search orders..."
                icon="i-heroicons-magnifying-glass"
                size="lg"
                class="w-full"
                @input="handleSearch"
              />
            </div>

            <!-- Filters -->
            <div class="flex flex-wrap gap-3">
              <USelect
                v-model="sortBy"
                :items="sortOptions"
                placeholder="Sort by"
                size="lg"
                class="w-48"
                @update:model-value="handleSort"
              />
              <UButton
                color="neutral"
                variant="outline"
                size="lg"
                icon="i-heroicons-funnel"
                @click="toggleFilter"
              >
                Filters
                <template #trailing>
                  <UBadge
                    v-if="statusFilter !== 'all' || paymentStatusFilter !== 'any'"
                    color="primary"
                    variant="solid"
                    class="ml-1"
                  >
                    {{ statusFilter !== 'all' && paymentStatusFilter !== 'any' ? '2' : '1' }}
                  </UBadge>
                </template>
              </UButton>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Filter Panel -->
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 transform -translate-y-2"
        enter-to-class="opacity-100 transform translate-y-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 transform translate-y-0"
        leave-to-class="opacity-0 transform -translate-y-2"
      >
        <div v-if="isFilterOpen" class="bg-white rounded-lg border border-gray-200 p-4 space-y-6">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-medium text-gray-900">Filters</h3>
            <UButton
              v-if="statusFilter !== 'all' || paymentStatusFilter !== 'any'"
              color="neutral"
              variant="ghost"
              size="sm"
              icon="i-heroicons-x-mark"
              @click="resetFilters"
            >
              Clear all
            </UButton>
          </div>

          <!-- Status Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <UButton
                v-for="status in orderStatuses"
                :key="status.value"
                :color="statusFilter === status.value ? 'primary' : 'neutral'"
                :variant="statusFilter === status.value ? 'solid' : 'outline'"
                size="sm"
                class="justify-center"
                @click="statusFilter = status.value"
              >
                <UIcon
                  :name="status.icon"
                  class="w-4 h-4 mr-1.5"
                  :class="{
                    'text-white': statusFilter === status.value,
                    'text-gray-500': statusFilter !== status.value,
                  }"
                />
                {{ status.label }}
              </UButton>
            </div>
          </div>

          <!-- Payment Status Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <UButton
                v-for="paymentStatus in paymentStatuses"
                :key="paymentStatus.value"
                :color="paymentStatusFilter === paymentStatus.value ? 'primary' : 'neutral'"
                :variant="paymentStatusFilter === paymentStatus.value ? 'solid' : 'outline'"
                size="sm"
                class="justify-center"
                @click="paymentStatusFilter = paymentStatus.value"
              >
                <UIcon
                  :name="paymentStatus.icon"
                  class="w-4 h-4 mr-1.5"
                  :class="{
                    'text-white': paymentStatusFilter === paymentStatus.value,
                    'text-gray-500': paymentStatusFilter !== paymentStatus.value,
                  }"
                />
                {{ paymentStatus.label }}
              </UButton>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Loading State -->
      <div v-if="isLoading">
        <!-- Desktop Loading -->
        <div class="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="i in 6"
            :key="i"
            class="bg-white rounded-xl border border-gray-200 shadow-sm p-5"
          >
            <USkeleton class="h-32 w-full mb-4" />
            <USkeleton class="h-6 w-3/4 mb-2" />
            <USkeleton class="h-4 w-1/2" />
          </div>
        </div>
        <!-- Mobile Loading -->
        <div class="md:hidden space-y-4">
          <div
            v-for="i in 3"
            :key="i"
            class="bg-white rounded-xl border border-gray-200 shadow-sm p-4"
          >
            <USkeleton class="h-24 w-full mb-3" />
            <USkeleton class="h-5 w-2/3 mb-2" />
            <USkeleton class="h-4 w-1/2" />
          </div>
        </div>
      </div>

      <!-- Orders Grid -->
      <div v-else-if="!isLoading && paginatedOrders.length > 0">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="order in paginatedOrders"
            :key="order.id"
            class="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden hover:border-primary-300 relative"
          >
            <!-- Status indicator bar -->
            <div
              class="h-1.5 w-full"
              :class="{
                'bg-green-500': order.status === 'completed',
                'bg-blue-500': order.status === 'in_progress',
                'bg-yellow-500': order.status === 'pending',
                'bg-red-500': order.status === 'cancelled',
                'bg-purple-500': !['completed', 'in_progress', 'pending', 'cancelled'].includes(
                  order.status
                ),
              }"
            ></div>

            <div class="p-4 md:p-5 flex flex-col h-full">
              <!-- Header with order number and status -->
              <div class="flex justify-between items-start mb-3">
                <div class="flex items-center">
                  <span
                    class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-50 text-primary-700 font-medium text-xs md:text-sm mr-2 md:mr-3"
                  >
                    #{{ order.orderNumber }}
                  </span>
                  <UBadge
                    :color="getStatusColor(order.status)"
                    variant="subtle"
                    :size="'xs'"
                    class="capitalize font-medium"
                  >
                    {{ formatStatus(order.status) }}
                  </UBadge>
                </div>
                <div class="text-xs text-gray-400">
                  {{
                    order.createdAt
                      ? dayjs.unix(Number(order.createdAt)).format('MMM D, YYYY')
                      : 'No date'
                  }}
                </div>
              </div>

              <!-- Client and amount -->
              <div class="mb-4">
                <h3 class="text-base md:text-lg font-semibold text-gray-900 flex items-center">
                  <UIcon name="i-heroicons-user" class="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                  <span class="truncate">{{ order.clientName || 'No client' }}</span>
                </h3>
                <div class="mt-2 flex items-center justify-between">
                  <div class="flex items-center text-gray-500 text-sm">
                    <UIcon name="i-heroicons-currency-dollar" class="w-4 h-4 mr-1.5" />
                    <span class="font-medium">Amount:</span>
                  </div>
                  <span class="text-base md:text-lg font-bold text-gray-900">
                    ₦{{ order.totalAmount?.toLocaleString() }}
                  </span>
                </div>
              </div>

              <!-- Due date and progress -->
              <div class="mt-auto">
                <div class="flex items-center justify-between text-sm mb-1">
                  <span class="text-gray-500 flex items-center">
                    <UIcon name="i-heroicons-calendar" class="w-4 h-4 mr-1.5" />
                    <span class="hidden md:inline">Due Date:</span>
                    <span class="md:hidden">Due:</span>
                  </span>
                  <span
                    :class="{
                      'text-red-500 font-medium':
                        order.dueDate &&
                        dayjs(order.dueDate).isBefore(dayjs(), 'day') &&
                        order.status !== 'completed',
                      'text-gray-700':
                        !order.dueDate ||
                        dayjs(order.dueDate).isSameOrAfter(dayjs()) ||
                        order.status === 'completed',
                    }"
                  >
                    {{ order.dueDate ? dayjs(order.dueDate).format('MMM D, YYYY') : 'No date' }}
                    <span
                      v-if="
                        order.dueDate &&
                        dayjs(order.dueDate).isBefore(dayjs(), 'day') &&
                        order.status !== 'completed'
                      "
                      class="ml-1"
                    >
                      (Overdue)
                    </span>
                  </span>
                </div>

                <!-- Progress bar -->
                <div class="w-full bg-gray-200 rounded-full h-1.5 md:h-2">
                  <div
                    class="h-1.5 md:h-2 rounded-full transition-all duration-500 ease-in-out"
                    :class="{
                      'bg-green-500': order.status === 'completed',
                      'bg-blue-500':
                        order.status === 'in_progress' || order.status === 'processing',
                      'bg-yellow-500': order.status === 'pending',
                      'bg-red-500': order.status === 'cancelled',
                      'w-full': order.status === 'completed',
                      'w-2/3': order.status === 'in_progress' || order.status === 'processing',
                      'w-1/3': order.status === 'pending' || order.status === 'cancelled',
                    }"
                  ></div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div
              class="absolute top-3 right-3 opacity-0 md:group-hover:opacity-100 transition-opacity duration-200"
            >
              <UDropdownMenu
                :items="[
                  [
                    {
                      label: 'View Details',
                      icon: 'i-heroicons-eye',
                      click: () => openOrderDetails(order),
                      ui: { icon: { base: 'text-gray-500' } },
                    },
                    {
                      label: 'Edit Order',
                      icon: 'i-heroicons-pencil',
                      click: () => openEditOrderSlideover(order),
                      ui: { icon: { base: 'text-blue-500' } },
                    },
                  ],
                  [
                    {
                      label: 'Delete',
                      icon: 'i-heroicons-trash',
                      click: () => confirmDelete(order),
                      ui: {
                        icon: { base: 'text-red-500' },
                        active: 'bg-red-50 text-red-700',
                        inactive: 'text-red-600 hover:bg-red-50 hover:text-red-700',
                      },
                    },
                  ],
                ]"
                :popper="{ placement: 'bottom-end' }"
              >
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-heroicons-ellipsis-horizontal"
                  size="sm"
                  class="text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                />
              </UDropdownMenu>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div
          v-if="filteredOrders.length > itemsPerPage"
          class="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div class="text-sm text-gray-600 text-center sm:text-left">
            Showing
            <span class="font-semibold text-gray-900">{{
              (currentPage - 1) * itemsPerPage + 1
            }}</span>
            to
            <span class="font-semibold text-gray-900">{{
              Math.min(currentPage * itemsPerPage, filteredOrders.length)
            }}</span>
            of <span class="font-semibold text-gray-900">{{ filteredOrders.length }}</span> orders
          </div>
          <UPagination
            v-model="currentPage"
            :page-count="itemsPerPage"
            :total="filteredOrders.length"
          />
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="flex items-center justify-center min-h-[60vh]">
        <div class="max-w-xl mx-auto text-center">
          <UEmpty
            icon="i-heroicons-document-text"
            :title="
              error
                ? 'Unable to load orders'
                : search || hasActiveFilters
                  ? 'No orders found'
                  : 'No orders yet'
            "
            :description="
              error
                ? 'We encountered an error while loading your orders. Please try refreshing the page.'
                : search || hasActiveFilters
                  ? 'Try adjusting your search or filters to find what you\'re looking for.'
                  : 'Get started by creating your first order to begin managing client measurements and deliveries.'
            "
            :actions="
              error
                ? [
                    {
                      icon: 'i-heroicons-arrow-path',
                      label: 'Refresh',
                      onClick: () => refreshOrders(),
                    },
                  ]
                : [
                    {
                      icon: 'i-heroicons-plus',
                      label: 'New Order',
                      onClick: openCreateOrderSlideover,
                    },
                  ]
            "
          />
        </div>
      </div>

      <!-- Create/Edit Order Slideover -->
      <OrderAdd
        :is-open="showOrderSlideover && slideoverMode === 'create'"
        @close="closeOrderSlideover"
        @success="handleOrderAddSuccess"
      />

      <OrderEdit
        :is-open="showOrderSlideover && slideoverMode === 'edit'"
        :order="selectedOrder"
        @close="closeOrderSlideover"
        @save="handleOrderEditSave"
      />

      <!-- Order Details Slideover -->
      <USlideover v-model:open="showDetailsSlideover" :title="detailsTitle" side="right">
        <template #body>
          <OrderDetail v-if="selectedOrder" :order="selectedOrder" @close="closeDetailsSlideover" />
        </template>
      </USlideover>

      <!-- Delete Confirmation Modal -->
      <OrderDelete
        v-if="orderToDelete"
        :is-open="showDeleteModal"
        :order="orderToDelete"
        :is-deleting="isDeleting"
        @close="showDeleteModal = false"
        @confirm="deleteOrder"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Order, OrderStatus, OrderItem as _OrderItem } from '~/types/order'
import OrderAdd from '~/components/orders/OrderAdd.vue'
import OrderEdit from '~/components/orders/OrderEdit.vue'
import OrderDetail from '~/components/orders/OrderDetail.vue'
import OrderDelete from '~/components/orders/OrderDelete.vue'

// Import dayjs
import dayjs from 'dayjs'

definePageMeta({
  middleware: ['auth', 'setup-required'],
  layout: 'dashboard',
})

// Use the orders composable
const {
  orders,
  isLoading,
  error,
  deleteOrder: _deleteOrderApi,
  createOrder,
  updateOrder,
  refreshOrders,
} = useOrders()

// Local state
const search = ref('')
const sortBy = ref('createdAt_desc')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const isFilterOpen = ref(false)

// Slideover state
const showOrderSlideover = ref(false)
const showDetailsSlideover = ref(false)
const selectedOrder = ref<Order | null>(null)
const slideoverMode = ref<'create' | 'edit'>('create')

// Modal state
const showDeleteModal = ref(false)
const orderToDelete = ref<Order | null>(null)
const isDeleting = ref(false)

// Filter state
const statusFilter = ref('all')
const paymentStatusFilter = ref('any')

// Computed titles
const _slideoverTitle = computed(() => {
  return slideoverMode.value === 'create' ? 'Create Order' : 'Edit Order'
})

const detailsTitle = computed(() => {
  return selectedOrder.value ? `Order #${selectedOrder.value.orderNumber}` : 'Order Details'
})

// Sort options
const sortOptions = [
  { label: 'Newest', value: 'createdAt_desc' },
  { label: 'Oldest', value: 'createdAt_asc' },
  { label: 'Due Soonest', value: 'dueDate_asc' },
  { label: 'Highest Amount', value: 'totalAmount_desc' },
  { label: 'Lowest Amount', value: 'totalAmount_asc' },
]

// Status options
const orderStatuses = [
  { label: 'All', value: 'all', icon: 'i-heroicons-funnel' },
  { label: 'Draft', value: 'draft', icon: 'i-heroicons-document-text' },
  { label: 'Pending', value: 'pending', icon: 'i-heroicons-clock' },
  { label: 'Processing', value: 'processing', icon: 'i-heroicons-cog' },
  { label: 'Completed', value: 'completed', icon: 'i-heroicons-check-circle' },
  { label: 'Cancelled', value: 'cancelled', icon: 'i-heroicons-x-circle' },
]

// Payment status options
const paymentStatuses = [
  { label: 'Any', value: 'any', icon: 'i-heroicons-funnel' },
  { label: 'Paid', value: 'paid', icon: 'i-heroicons-banknotes' },
  { label: 'Unpaid', value: 'unpaid', icon: 'i-heroicons-credit-card' },
  { label: 'Partially Paid', value: 'partially_paid', icon: 'i-heroicons-currency-dollar' },
  { label: 'Refunded', value: 'refunded', icon: 'i-heroicons-arrow-uturn-left' },
]

// Computed
const filteredOrders = computed(() => {
  let result = [...orders.value]

  // Apply search filter
  if (search.value) {
    const searchTerm = search.value.toLowerCase()
    result = result.filter(
      order =>
        order.id.toLowerCase().includes(searchTerm) ||
        (order.client?.firstName + ' ' + order.client?.lastName)
          ?.toLowerCase()
          .includes(searchTerm) ||
        order.client?.email?.toLowerCase().includes(searchTerm) ||
        order.orderNumber?.toLowerCase().includes(searchTerm)
    )
  }

  // Apply status filter
  if (statusFilter.value !== 'all') {
    result = result.filter(order => order.status === statusFilter.value)
  }

  // Apply payment status filter
  if (paymentStatusFilter.value !== 'any') {
    result = result.filter(order => order.paymentStatus === paymentStatusFilter.value)
  }

  // Apply sorting
  result.sort((a, b) => {
    const [sortField, sortDirection] = sortBy.value.split('_')
    const direction = sortDirection === 'desc' ? -1 : 1

    if (sortField === 'createdAt') {
      // Handle createdAt as a Unix timestamp (seconds since epoch)
      const timeA =
        typeof a.createdAt === 'number' ? a.createdAt * 1000 : new Date(a.createdAt).getTime()
      const timeB =
        typeof b.createdAt === 'number' ? b.createdAt * 1000 : new Date(b.createdAt).getTime()
      return (timeA - timeB) * direction
    } else if (sortField === 'dueDate') {
      // Handle dueDate as a date string (YYYY-MM-DD)
      const timeA = a.dueDate ? dayjs(a.dueDate).valueOf() : 0
      const timeB = b.dueDate ? dayjs(b.dueDate).valueOf() : 0
      return (timeA - timeB) * direction
    } else if (sortField === 'totalAmount') {
      return ((a.totalAmount || 0) - (b.totalAmount || 0)) * direction
    }
    return 0
  })

  return result
})

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredOrders.value.slice(start, end)
})

const hasActiveFilters = computed(() => {
  return statusFilter.value !== 'all' || paymentStatusFilter.value !== 'any' || search.value !== ''
})

// Slideover actions
const openCreateOrderSlideover = () => {
  selectedOrder.value = null
  slideoverMode.value = 'create'
  showOrderSlideover.value = true
}

// Make a more flexible order type that matches the data structure from the API
interface BaseOrder {
  id: string | number
  clientId: string | number
  styleId?: string | number
  orderNumber: string
  status: OrderStatus
  dueDate?: string
  totalAmount: number
  taxAmount?: number
  discountAmount?: number
  finalAmount: number
  notes?: string
  items?: Array<{
    id?: number | string
    styleId: number | string
    quantity: number
    price: number
    measurements?: Record<string, any>
    notes?: string
    createdAt?: string
    updatedAt?: string
  }>
  measurements?: Record<string, any>
  shippingAddress?: Record<string, any>
  billingAddress?: Record<string, any>
  paymentStatus?: string
  paymentMethod?: string
  paymentReference?: string
  createdAt: string
  updatedAt?: string
  deletedAt?: string
  clientName?: string
  style?: {
    id: string | number
    name: string
    image?: string
  }
  [key: string]: any
}

// Helper function to safely convert any order-like object to Order
const _toOrder = (order: any): Order => ({
  ...order,
  items: order.items ? [...order.items] : [],
})

const openEditOrderSlideover = (order: any) => {
  // Convert the order to the expected format
  const processedOrder: Order = {
    ...order,
    id: String(order.id),
    clientId: String(order.clientId),
    styleId: order.styleId ? String(order.styleId) : undefined,
    items: (order.items || []).map((item: any) => ({
      ...item,
      id: item.id ? Number(item.id) : undefined,
      styleId: Number(item.styleId) || 0,
      quantity: Number(item.quantity) || 0,
      price: Number(item.price) || 0,
    })),
    paymentStatus: ['pending', 'paid', 'partially_paid', 'refunded', 'unpaid'].includes(
      order.paymentStatus
    )
      ? (order.paymentStatus as Order['paymentStatus'])
      : undefined,
  }

  selectedOrder.value = processedOrder
  slideoverMode.value = 'edit'
  showOrderSlideover.value = true
}

const openOrderDetails = (order: any) => {
  // Convert the order to the expected format
  const processedOrder: Order = {
    ...order,
    id: String(order.id),
    clientId: String(order.clientId),
    styleId: order.styleId ? String(order.styleId) : undefined,
    items: (order.items || []).map((item: any) => ({
      ...item,
      id: item.id ? Number(item.id) : undefined,
      styleId: Number(item.styleId) || 0,
      quantity: Number(item.quantity) || 0,
      price: Number(item.price) || 0,
    })),
    paymentStatus: ['pending', 'paid', 'partially_paid', 'refunded', 'unpaid'].includes(
      order.paymentStatus
    )
      ? (order.paymentStatus as Order['paymentStatus'])
      : undefined,
  }

  selectedOrder.value = processedOrder
  showDetailsSlideover.value = true
}

const closeOrderSlideover = () => {
  showOrderSlideover.value = false
  selectedOrder.value = null
}

const closeDetailsSlideover = () => {
  showDetailsSlideover.value = false
  selectedOrder.value = null
}

const _handleEditOrder = (order: any) => {
  closeDetailsSlideover()
  openEditOrderSlideover(order)
}

const handleOrderAddSuccess = async (orderData: any) => {
  try {
    await createOrder(orderData)
    closeOrderSlideover()
  } catch (error) {
    console.error('Failed to create order:', error)
  }
}

const handleOrderEditSave = async (orderData: any) => {
  try {
    if (selectedOrder.value) {
      await updateOrder(String(selectedOrder.value.id), orderData)
    }
    closeOrderSlideover()
  } catch (error) {
    console.error('Failed to update order:', error)
  }
}

// Filter and sort handlers
const handleSearch = () => {
  currentPage.value = 1
}

const handleSort = (value: string) => {
  sortBy.value = value
  currentPage.value = 1
}

const resetFilters = () => {
  statusFilter.value = 'all'
  paymentStatusFilter.value = 'any'
  currentPage.value = 1
}

const toggleFilter = () => {
  isFilterOpen.value = !isFilterOpen.value
}

// Delete handlers
const confirmDelete = (order: Order | { id: string | number; [key: string]: any }) => {
  orderToDelete.value = {
    ...order,
    items:
      order.items?.map((item: any) => ({
        ...item,
        styleId: Number(item.styleId) || 0,
      })) || [],
  } as Order
  showDeleteModal.value = true
}

const deleteOrder = async () => {
  if (!orderToDelete.value) return

  try {
    isDeleting.value = true
    await _deleteOrderApi(String(orderToDelete.value.id))
    showDeleteModal.value = false
    orderToDelete.value = null
  } catch (error) {
    console.error('Failed to delete order:', error)
  } finally {
    isDeleting.value = false
  }
}

const formatStatus = (status: OrderStatus) => {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case 'completed':
      return 'success'
    case 'processing':
      return 'info'
    case 'pending':
      return 'warning'
    case 'cancelled':
      return 'error'
    case 'draft':
      return 'neutral'
    default:
      return 'neutral'
  }
}
</script>
