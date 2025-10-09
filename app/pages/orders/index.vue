<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Orders</h1>
        <p class="mt-1 text-sm text-gray-500">Manage your orders and track their status</p>
      </div>
      <UButton to="/orders/new" icon="i-heroicons-plus" color="primary"> Add Order </UButton>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3">
      <UInput
        v-model="search"
        placeholder="Search orders..."
        icon="i-heroicons-magnifying-glass"
        class="flex-1"
        @input="handleSearch"
      />
      <USelect
        v-model="sortBy"
        :options="sortOptions"
        option-attribute="label"
        value-attribute="value"
        placeholder="Sort by"
        class="w-48"
        @update:model-value="handleSort"
      />
      <UButton
color="neutral"
variant="outline"
icon="i-heroicons-funnel"
@click="toggleFilter">
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

    <!-- Desktop Table View -->
    <div class="hidden md:block">
      <UTable
        :rows="paginatedOrders"
        :columns="columns"
        :loading="isLoading"
        :empty-state="{
          icon: 'i-heroicons-document-text',
          label: 'No orders found',
          description:
            search || hasActiveFilters
              ? 'Try adjusting your search or filters'
              : 'Create your first order to get started',
        }"
        :sort="{ column: sortBy, direction: sortBy.endsWith('_desc') ? 'desc' : 'asc' }"
        class="w-full"
        @sort="handleSort"
      />

      <!-- Pagination -->
      <div class="mt-6 flex items-center justify-between">
        <div class="text-sm text-gray-500">
          Showing <span class="font-medium">{{ (currentPage - 1) * itemsPerPage + 1 }}</span> to
          <span class="font-medium">{{
            Math.min(currentPage * itemsPerPage, filteredOrders.length)
          }}</span>
          of <span class="font-medium">{{ filteredOrders.length }}</span> results
        </div>
        <UPagination
          v-model="currentPage"
          :page-count="itemsPerPage"
          :total="filteredOrders.length"
          :ui="{ rounded: 'first-of-type:rounded-s-md last-of-type:rounded-e-md' }"
        />
      </div>
    </div>

    <!-- Mobile List View -->
    <div class="md:hidden space-y-4">
      <div
        v-for="order in paginatedOrders"
        :key="order.id"
        class="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-5 hover:border-gray-300"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium text-gray-900">#{{ order.orderNumber }}</span>
              <UBadge
                :color="getStatusColor(order.status)"
                variant="subtle"
                size="sm"
                class="capitalize"
              >
                {{ formatStatus(order.status) }}
              </UBadge>
            </div>
            <p class="mt-1 text-sm text-gray-500">
              {{ order.client?.firstName }} {{ order.client?.lastName }}
            </p>
            <p class="mt-1 text-sm font-medium text-gray-900">
              ₦{{ order.totalAmount?.toLocaleString() }}
            </p>
            <p v-if="order.dueDate" class="mt-1 flex items-center text-sm text-gray-500">
              <UIcon name="i-heroicons-calendar" class="w-4 h-4 mr-1.5" />
              Due {{ formatDate(order.dueDate) }}
            </p>
          </div>
          <UDropdown
            :items="[
              [
                {
                  label: 'View',
                  icon: 'i-heroicons-eye',
                  click: () => navigateTo(getOrderPath(order.id)),
                },
                {
                  label: 'Edit',
                  icon: 'i-heroicons-pencil',
                  click: () => navigateTo(getOrderPath(order.id)),
                },
              ],
              [{ label: 'Delete', icon: 'i-heroicons-trash', click: () => confirmDelete(order) }],
            ]"
          >
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-heroicons-ellipsis-horizontal"
              size="sm"
            />
          </UDropdown>
        </div>
      </div>

      <!-- Empty state for mobile -->
      <div v-if="!isLoading && paginatedOrders.length === 0" class="text-center py-12">
        <UIcon name="i-heroicons-document-text" class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">No orders</h3>
        <p class="mt-1 text-sm text-gray-500">
          {{
            search || hasActiveFilters
              ? 'Try adjusting your search or filters'
              : 'Get started by creating a new order'
          }}
        </p>
        <div class="mt-6">
          <UButton to="/orders/new" icon="i-heroicons-plus" color="primary"> New Order </UButton>
        </div>
      </div>

      <!-- Pagination for mobile -->
      <div class="mt-6">
        <UPagination
          v-model="currentPage"
          :page-count="itemsPerPage"
          :total="filteredOrders.length"
          :ui="{ rounded: 'first-of-type:rounded-s-md last-of-type:rounded-e-md' }"
        />
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <UModal v-model="showDeleteModal">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium text-gray-900">Delete Order</h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="showDeleteModal = false"
            />
          </div>
        </template>

        <p class="text-sm text-gray-500">
          Are you sure you want to delete order
          <span class="font-medium">#{{ orderToDelete?.orderNumber }}</span
          >? This action cannot be undone.
        </p>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              color="neutral"
              variant="ghost"
              :disabled="isDeleting"
              @click="showDeleteModal = false"
            >
              Cancel
            </UButton>
            <UButton color="error" :loading="isDeleting" @click="deleteOrder"> Delete </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Order } from '~/types/order'

definePageMeta({
  middleware: ['auth', 'setup-required'],
  layout: 'dashboard',
})

// Use the orders composable
const { orders, isLoading, deleteOrder: _deleteOrderApi, sort, search: searchTerm } = useOrders()

// Local state
const search = ref('')
const sortBy = ref('createdAt_desc')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const isFilterOpen = ref(false)

// Sync local search with composable
watch(search, newVal => {
  searchTerm.value = newVal
  currentPage.value = 1
})

// Sync sort with composable
watch(sortBy, newVal => {
  const [field, direction] = newVal.split('_')
  sort.value = { field, direction: direction as 'asc' | 'desc' }
  currentPage.value = 1
})
const statusFilter = ref('all')
const paymentStatusFilter = ref('any')
const showDeleteModal = ref(false)
const orderToDelete = ref<Order | null>(null)
const isDeleting = ref(false)

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
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction
    } else if (sortField === 'dueDate') {
      return (
        ((a.dueDate ? new Date(a.dueDate).getTime() : 0) -
          (b.dueDate ? new Date(b.dueDate).getTime() : 0)) *
        direction
      )
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

// Table columns
const columns = [
  {
    key: 'orderNumber',
    label: 'Order ID',
    sortable: true,
  },
  {
    key: 'clientName',
    label: 'Client',
    sortable: true,
    render: (row: Order) => `${row.client?.firstName} ${row.client?.lastName}`,
  },
  {
    key: 'totalAmount',
    label: 'Total',
    sortable: true,
    format: (value: number) =>
      `₦${(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (row: Order) =>
      h(
        UBadge,
        {
          color: getStatusColor(row.status),
          variant: 'subtle',
          class: 'capitalize',
        },
        () => formatStatus(row.status)
      ),
  },
  {
    key: 'dueDate',
    label: 'Due Date',
    sortable: true,
    format: (value: string) => (value ? formatDate(value) : 'N/A'),
  },
  {
    key: 'actions',
    label: '',
    sortable: false,
    render: (row: Order) =>
      h(
        UDropdownMenu,
        {
          items: [
            [
              {
                label: 'View',
                icon: 'i-heroicons-eye',
                click: () => navigateTo(getOrderPath(row.id)),
              },
              {
                label: 'Edit',
                icon: 'i-heroicons-pencil',
                click: () => navigateTo(getOrderPath(row.id)),
              },
            ],
            [
              {
                label: 'Delete',
                icon: 'i-heroicons-trash',
                click: () => confirmDelete(row),
              },
            ],
          ],
        },
        {
          default: () =>
            h(UButton, {
              color: 'gray',
              variant: 'ghost',
              icon: 'i-heroicons-ellipsis-horizontal-20-solid',
            }),
        }
      ),
  },
]

// Methods

const handleSearch = (value: string) => {
  search.value = value
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

const confirmDelete = (order: Order) => {
  orderToDelete.value = order
  showDeleteModal.value = true
}

const deleteOrder = async () => {
  if (!orderToDelete.value) return

  try {
    isDeleting.value = true
    // Replace with your actual API call
    // await $fetch(`/api/orders/${orderToDelete.value.id}`, { method: 'DELETE' })

    // Remove the order from the list
    const index = orders.value.findIndex(o => o.id === orderToDelete.value?.id)
    if (index !== -1) {
      orders.value.splice(index, 1)
    }

    showDeleteModal.value = false
    orderToDelete.value = null
  } catch (error) {
    console.error('Failed to delete order:', error)
  } finally {
    isDeleting.value = false
  }
}

// Helper functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const formatStatus = (status: string) => {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'success'
    case 'processing':
      return 'info'
    case 'pending':
      return 'warnng'
    case 'cancelled':
      return 'error'
    case 'draft':
      return 'neutral'
    default:
      return 'neutral'
  }
}

const getOrderPath = (id: string) => {
  return `/orders/${id}`
}
</script>
