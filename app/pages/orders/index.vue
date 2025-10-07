<template>
  <div>
    <BaseListPage
      title="Orders"
      page-type="orders"
      :primary-action="{
        label: 'Add Order',
        to: ROUTE_NAMES.DASHBOARD.ORDERS.NEW,
      }"
      :show-search="true"
      :initial-search="search"
      :sort-options="sortOptions"
      :current-page="currentPage"
      :page-size="itemsPerPage"
      :total-items="filteredOrders.length"
      :is-loading="isLoading"
      :has-items="filteredOrders.length > 0"
      :has-active-filters="hasActiveFilters"
      empty-state-icon="i-heroicons-document-text"
      :empty-state-title="search || hasActiveFilters ? 'No orders found' : 'No orders yet'"
      :empty-state-description="
        search || hasActiveFilters
          ? 'Try adjusting your search or filters to find what you\'re looking for.'
          : 'Get started by creating your first order.'
      "
      :empty-state-action="
        !search && !hasActiveFilters
          ? {
              label: 'Add Order',
              to: ROUTE_NAMES.DASHBOARD.ORDERS.NEW,
              icon: 'i-heroicons-plus',
            }
          : undefined
      "
      :show-delete-modal="showDeleteModal"
      :item-to-delete="orderToDelete"
      :is-filter-open="isFilterOpen"
      :active-filters-count="activeFiltersCount"
      @update:current-page="handlePageChange"
      @search="handleSearch"
      @sort="handleSort"
      @reset-filters="resetFilters"
      @delete-confirm="deleteOrder"
      @toggle-filter="toggleFilter"
    >
      <!-- Filters slot for sort dropdown -->
      <template #filters>
        <USelect
          v-model="sortBy"
          :items="sortOptions"
          placeholder="Sort by"
          size="lg"
          class="w-full sm:w-48"
          @update:model-value="filterOrders"
        />
      </template>

      <!-- Filter Panel slot for status filters -->
      <template v-if="isFilterOpen" #filter-panel>
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 transform -translate-y-2"
          enter-to-class="opacity-100 transform translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 transform translate-y-0"
          leave-to-class="opacity-0 transform -translate-y-2"
        >
          <div v-show="isFilterOpen" class="mt-3 overflow-hidden">
            <div
              class="bg-gradient-to-br from-white to-gray-50/50 border border-gray-200/60 rounded-xl shadow-sm backdrop-blur-sm"
            >
              <!-- Filter Header -->
              <div class="px-6 py-4 border-b border-gray-100 bg-white/80 rounded-t-xl">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <div class="w-2 h-2 bg-primary-500 rounded-full"></div>
                    <h3 class="text-sm font-semibold text-gray-900">Filter Options</h3>
                  </div>
                  <div class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {{ activeFiltersCount }}
                    active
                  </div>
                </div>
              </div>

              <!-- Filter Content -->
              <div class="p-6">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <!-- Status Filter -->
                  <div class="space-y-2">
                    <UFormField label="Order Status" name="status-filter">
                      <template #label>
                        <div class="flex items-center space-x-2">
                          <UIcon
                            name="i-heroicons-clipboard-document-list"
                            class="w-4 h-4 text-gray-500"
                          />
                          <span class="text-sm font-medium text-gray-700">Order Status</span>
                        </div>
                      </template>
                      <USelect
                        v-model="statusFilter"
                        :items="statusOptions"
                        placeholder="All statuses"
                        size="lg"
                        class="transition-all duration-200 hover:shadow-sm"
                        :ui="{
                          base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0',
                          placeholder: 'text-gray-400 dark:text-gray-500',
                        }"
                        @update:model-value="filterOrders"
                      />
                    </UFormField>
                  </div>

                  <!-- Payment Status Filter -->
                  <div class="space-y-2">
                    <UFormField label="Payment Status" name="payment-status-filter">
                      <template #label>
                        <div class="flex items-center space-x-2">
                          <UIcon name="i-heroicons-credit-card" class="w-4 h-4 text-gray-500" />
                          <span class="text-sm font-medium text-gray-700">Payment Status</span>
                        </div>
                      </template>
                      <USelect
                        v-model="paymentStatusFilter"
                        :items="paymentStatusOptions"
                        placeholder="All payments"
                        size="lg"
                        class="transition-all duration-200 hover:shadow-sm"
                        :ui="{
                          base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0',
                          placeholder: 'text-gray-400 dark:text-gray-500',
                        }"
                        @update:model-value="filterOrders"
                      />
                    </UFormField>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                  <div class="flex items-center space-x-2 text-xs text-gray-500">
                    <UIcon name="i-heroicons-information-circle" class="w-4 h-4" />
                    <span>Filters are applied automatically</span>
                  </div>

                  <div class="flex items-center space-x-3">
                    <UButton
                      color="neutral"
                      variant="outline"
                      size="sm"
                      icon="i-heroicons-arrow-path"
                      class="transition-all duration-200 hover:bg-gray-100"
                      @click="resetFilters"
                    >
                      Reset
                    </UButton>

                    <UButton
                      color="primary"
                      variant="outline"
                      size="sm"
                      icon="i-heroicons-x-mark"
                      class="transition-all duration-200"
                      @click="isFilterOpen = false"
                    >
                      Close
                    </UButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </template>

      <!-- Default slot for content -->
      <template #default>
        <!-- Desktop Table View -->
        <div class="hidden md:block">
          <UTable
            :data="paginatedOrders"
            :columns="tableColumns"
            :loading="isLoading"
            :empty-state="{
              icon: 'i-heroicons-document-text',
              label: 'No orders found',
              description: 'Create your first order to get started.',
            }"
          />
        </div>

        <!-- Mobile Card View -->
        <div class="md:hidden space-y-4">
          <div
            v-for="order in paginatedOrders"
            :key="order.id"
            class="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-5 hover:border-gray-300"
          >
            <!-- Header with Order ID and Status -->
            <div class="flex justify-between items-start mb-4">
              <div class="flex items-center space-x-2">
                <div class="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                  <UIcon name="i-heroicons-document-text" class="w-4 h-4 text-primary-600" />
                </div>
                <h3 class="text-base font-semibold text-gray-900">
                  Order #{{ order.orderNumber || order.id }}
                </h3>
              </div>
              <UBadge
                :color="getStatusColor(order.status)"
                variant="subtle"
                size="sm"
                class="font-medium"
              >
                {{ formatStatus(order.status) }}
              </UBadge>
            </div>

            <!-- Order Details -->
            <div class="space-y-3">
              <!-- Client Info -->
              <div class="flex items-center space-x-2">
                <UIcon name="i-heroicons-user" class="w-4 h-4 text-gray-400" />
                <span class="text-sm text-gray-600">Client:</span>
                <span class="text-sm font-medium text-gray-900">{{
                  order.clientName || 'Unknown Client'
                }}</span>
              </div>

              <!-- Total Amount -->
              <div class="flex items-center space-x-2">
                <UIcon name="i-heroicons-banknotes" class="w-4 h-4 text-gray-400" />
                <span class="text-sm text-gray-600">Total:</span>
                <span class="text-base font-bold text-gray-900">
                  ₦{{
                    (order.finalAmount || order.totalAmount)?.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  }}
                </span>
              </div>

              <!-- Due Date -->
              <div class="flex items-center space-x-2">
                <UIcon name="i-heroicons-calendar-days" class="w-4 h-4 text-gray-400" />
                <span class="text-sm text-gray-600">Due:</span>
                <span class="text-sm font-medium text-gray-900">
                  {{ order.dueDate ? formatDate(order.dueDate) : 'N/A' }}
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="mt-4 pt-4 border-t border-gray-100 flex justify-end">
              <UDropdownMenu
                :items="[
                  {
                    type: 'label',
                    label: 'Actions',
                  },
                  {
                    label: 'View',
                    icon: 'i-heroicons-eye',
                    onSelect: () => navigateTo(getOrderPath(order.id)),
                  },
                  {
                    label: 'Edit',
                    icon: 'i-heroicons-pencil',
                    onSelect: () => navigateTo(getOrderPath(order.id)),
                  },
                  {
                    type: 'separator',
                  },
                  {
                    label: 'Delete',
                    icon: 'i-heroicons-trash',
                    color: 'error',
                    onSelect: () => confirmDelete(order),
                  },
                ]"
              >
                <UButton
                  color="gray"
                  variant="outline"
                  icon="i-heroicons-ellipsis-horizontal"
                  size="sm"
                  class="hover:bg-gray-50 transition-colors duration-150"
                />
              </UDropdownMenu>
            </div>
          </div>
        </div>
      </template>
    </BaseListPage>

    <!-- Delete Confirmation Modal -->
    <DeleteModal
      v-model:model-value="showDeleteModal"
      :item-type="'order'"
      :item-name="
        orderToDelete?.orderNumber
          ? `order #${orderToDelete.orderNumber}`
          : orderToDelete?.id
            ? `order #${orderToDelete.id}`
            : 'this order'
      "
      @confirm="deleteOrder"
      @update:model-value="val => (showDeleteModal = val)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, resolveComponent } from 'vue'
import { ROUTE_NAMES } from '~/constants/routes'
import type { Order } from '~/types/order'
import { useListData } from '~/composables/useListData'

definePageMeta({
  middleware: 'setup-required',
})

// Resolve UI components
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

// Set page metadata
useHead({
  title: 'Orders',
})

// Delete modal state
const showDeleteModal = ref(false)
const orderToDelete = ref<Order | undefined>(undefined)
const isDeleting = ref(false)

// Use unified list data management
const {
  state: {
    items: orders,
    currentPage,
    pageSize: itemsPerPage,
    search,
    sortBy,
    isLoading,
    isFilterOpen,
    hasActiveFilters,
    activeFiltersCount,
  },
  actions: { handleSearch, handleSort, handlePageChange, resetFilters },
  setFilter,
  getFilter,
} = useListData<Order>({
  endpoint: '/api/orders',
  defaultPageSize: 10,
  defaultSortBy: 'newest',
  filterKeys: ['status', 'paymentStatus'],
  transform: (order: any) => ({
    ...order,
    clientName: order.clientName || 'Unknown Client',
    orderNumber: order.id,
    finalAmount: order.totalAmount,
    items: [],
  }),
  serverSide: false,
  sortByMapping: {
    newest: { sortBy: 'createdAt', sortOrder: 'desc' },
    oldest: { sortBy: 'createdAt', sortOrder: 'asc' },
    due_soonest: { sortBy: 'dueDate', sortOrder: 'asc' },
    amount_high: { sortBy: 'totalAmount', sortOrder: 'desc' },
    amount_low: { sortBy: 'totalAmount', sortOrder: 'asc' },
  },
})

// Additional filter refs for easier access
const statusFilter = computed({
  get: () => getFilter('status') || 'all',
  set: value => setFilter('status', value === 'all' ? null : value),
})

const paymentStatusFilter = computed({
  get: () => getFilter('paymentStatus') || 'any',
  set: value => setFilter('paymentStatus', value === 'any' ? null : value),
})

// Options
const statusOptions = [
  { label: 'All statuses', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Processing', value: 'processing' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Refunded', value: 'refunded' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Shipped', value: 'shipped' },
]

const paymentStatusOptions = [
  { label: 'All payment statuses', value: 'any' },
  { label: 'Paid', value: 'paid' },
  { label: 'Partially Paid', value: 'partially_paid' },
  { label: 'Pending', value: 'pending' },
  { label: 'Refunded', value: 'refunded' },
]

const sortOptions = [
  { label: 'Newest first', value: 'newest' },
  { label: 'Oldest first', value: 'oldest' },
  { label: 'Due soonest', value: 'due_soonest' },
  { label: 'Highest amount', value: 'amount_high' },
  { label: 'Lowest amount', value: 'amount_low' },
]

const tableColumns = [
  {
    id: 'index',
    header: '#',
    enableSorting: false,
    cell: ({ row }: { row: { original: Order } }) => {
      const index = paginatedOrders.value.findIndex(order => order.id === row.original.id)
      return h(
        'div',
        { class: 'font-medium text-neutral-700' },
        String((currentPage.value - 1) * itemsPerPage.value + index + 1)
      )
    },
  },
  {
    accessorKey: 'orderNumber',
    header: 'Order ID',
    enableSorting: true,
    cell: ({ row }: { row: { original: Order } }) => {
      return h(
        'div',
        { class: 'font-medium text-neutral-700' },
        row.original.orderNumber || row.original.id
      )
    },
  },
  {
    accessorKey: 'clientName',
    header: 'Client',
    enableSorting: true,
    cell: ({ row }: { row: { original: Order } }) => {
      return h('div', { class: 'text-neutral-700' }, row.original.clientName || 'Unknown Client')
    },
  },
  {
    accessorKey: 'totalAmount',
    header: 'Total',
    enableSorting: true,
    cell: ({ row }: { row: { original: Order } }) => {
      const amount = row.original.finalAmount || row.original.totalAmount
      return h(
        'div',
        { class: 'font-medium text-neutral-700' },
        `₦${amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`
      )
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    enableSorting: true,
    cell: ({ row }: { row: { original: Order } }) => {
      return h(
        UBadge,
        {
          color: getStatusColor(row.original.status),
          variant: 'subtle',
          size: 'sm',
          class: 'capitalize',
        },
        {
          default: () => formatStatus(row.original.status),
        }
      )
    },
  },
  {
    accessorKey: 'dueDate',
    header: 'Due Date',
    enableSorting: true,
    cell: ({ row }: { row: { original: Order } }) => {
      return h(
        'div',
        { class: 'text-neutral-700' },
        row.original.dueDate ? formatDate(row.original.dueDate) : 'N/A'
      )
    },
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    cell: ({ row }: { row: { original: Order } }) => {
      return h(
        'div',
        { class: 'flex justify-center' },
        h(
          UDropdownMenu,
          {
            content: {
              align: 'start',
            },
            items: [
              {
                type: 'label',
                label: 'Actions',
              },
              {
                label: 'View',
                icon: 'i-heroicons-eye',
                onSelect: () => navigateTo(getOrderPath(row.original.id)),
              },
              {
                label: 'Edit',
                icon: 'i-heroicons-pencil',
                onSelect: () => navigateTo(getOrderPath(row.original.id)),
              },
              {
                type: 'separator',
              },
              {
                label: 'Delete',
                icon: 'i-heroicons-trash',
                color: 'error',
                onSelect: () => confirmDelete(row.original),
              },
            ],
          },
          () =>
            h(UButton, {
              color: 'neutral',
              variant: 'ghost',
              icon: 'i-heroicons-ellipsis-horizontal',
              size: 'sm',
            })
        )
      )
    },
  },
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
        order.client?.phone?.includes(searchTerm)
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
    switch (sortBy.value) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case 'due_soonest':
        return (
          (a.dueDate ? new Date(a.dueDate).getTime() : Infinity) -
          (b.dueDate ? new Date(b.dueDate).getTime() : Infinity)
        )
      case 'amount_high':
        return (b.totalAmount || 0) - (a.totalAmount || 0)
      case 'amount_low':
        return (a.totalAmount || 0) - (b.totalAmount || 0)
      default:
        return 0
    }
  })

  return result
})

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredOrders.value.slice(start, end)
})

// Additional methods
const filterOrders = () => {
  currentPage.value = 1
}

const confirmDelete = (order: Order) => {
  orderToDelete.value = order
  showDeleteModal.value = true
}

const deleteOrder = async () => {
  if (!orderToDelete.value) return

  const toast = useToast()
  isDeleting.value = true

  try {
    const response = await $fetch(`/api/orders/${orderToDelete.value.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response) {
      // Remove the order from the list
      const index = orders.value.findIndex(o => o.id === orderToDelete.value?.id)
      if (index !== -1) {
        orders.value.splice(index, 1)
      }

      toast.add({
        title: 'Order deleted',
        description: `Order #${orderToDelete.value.orderNumber || orderToDelete.value.id} has been deleted successfully.`,
        color: 'primary',
      })
    } else {
      throw new Error('Failed to delete order')
    }
  } catch (error) {
    console.error('Error deleting order:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to delete order. Please try again.',
      color: 'error',
    })
  } finally {
    isDeleting.value = false
    showDeleteModal.value = false
    orderToDelete.value = undefined
  }
}

const toggleFilter = () => {
  isFilterOpen.value = !isFilterOpen.value
}

// Helper functions
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
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
    case 'Pending':
      return 'neutral'
    case 'Processing':
      return 'info'
    case 'Completed':
      return 'success'
    case 'Cancelled':
      return 'error'
    case 'Delivered':
      return 'primary'
    default:
      return 'neutral'
  }
}

const getOrderPath = (id: string) => {
  return ROUTE_NAMES.DASHBOARD.ORDERS.EDIT.replace(':id', id)
}
</script>
