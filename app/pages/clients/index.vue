<template>
  <div>
    <BaseListPage
      title="Clients"
      page-type="clients"
      :primary-action="{
        label: 'Add Client',
        icon: 'i-heroicons-plus',
        to: '/clients/new',
      }"
      :show-search="true"
      :initial-search="search"
      :sort-options="sortOptions"
      :current-page="currentPage"
      :page-size="ITEMS_PER_PAGE"
      :total-items="localTotalCount"
      :is-loading="pending"
      :has-items="paginatedClients.length > 0"
      :has-active-filters="!!hasActiveFilters"
      :is-filter-open="isFilterOpen"
      :active-filters-count="activeFiltersCount"
      empty-state-icon="i-heroicons-users"
      :empty-state-title="search || hasActiveFilters ? 'No clients found' : 'No clients yet'"
      :empty-state-description="
        search || hasActiveFilters
          ? 'Try adjusting your search or filters to find what you\'re looking for.'
          : 'Get started by adding your first client.'
      "
      :empty-state-action="
        !search && !hasActiveFilters
          ? {
              label: 'Add Client',
              to: ROUTE_NAMES.DASHBOARD.CLIENTS.NEW,
              icon: 'i-heroicons-plus',
            }
          : undefined
      "
      :show-delete-modal="isDeleteModalOpen"
      :item-to-delete="clientToDelete || undefined"
      @update:current-page="handlePageChange"
      @search="handleSearch"
      @sort="handleSort"
      @reset-filters="resetFilters"
      @delete-confirm="deleteClient"
      @toggle-filter="isFilterOpen = !isFilterOpen"
    >
      <!-- Filters slot -->
      <template #filters>
        <USelect
          v-model="sortBy"
          :items="sortOptions"
          option-attribute="label"
          placeholder="Sort by"
          size="lg"
          class="w-full sm:w-52"
        />
      </template>

      <!-- Filter panel -->
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
                  <!-- Date Added Filter -->
                  <div class="space-y-2">
                    <UFormField label="Date Added" name="date-added-filter">
                      <template #label>
                        <div class="flex items-center space-x-2">
                          <UIcon name="i-heroicons-calendar-days" class="w-4 h-4 text-gray-500" />
                          <span class="text-sm font-medium text-gray-700">Date Added</span>
                        </div>
                      </template>
                      <USelect
                        v-model="dateAddedFilter"
                        :items="dateOptions"
                        placeholder="Any time"
                        size="lg"
                        class="transition-all duration-200 hover:shadow-sm"
                        :ui="{
                          base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0',
                          placeholder: 'text-gray-400 dark:text-gray-500',
                        }"
                        @update:model-value="filterClients"
                      />
                    </UFormField>
                  </div>

                  <!-- Has Orders Filter -->
                  <div class="space-y-2">
                    <UFormField label="Has Orders" name="has-orders-filter">
                      <template #label>
                        <div class="flex items-center space-x-2">
                          <UIcon name="i-heroicons-shopping-bag" class="w-4 h-4 text-gray-500" />
                          <span class="text-sm font-medium text-gray-700">Has Orders</span>
                        </div>
                      </template>
                      <USelect
                        v-model="hasOrdersFilter"
                        :items="[
                          { label: 'All clients', value: 'all' },
                          { label: 'With orders', value: 'true' },
                          { label: 'Without orders', value: 'false' },
                        ]"
                        placeholder="All clients"
                        size="lg"
                        class="transition-all duration-200 hover:shadow-sm"
                        :ui="{
                          base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0',
                          placeholder: 'text-gray-400 dark:text-gray-500',
                        }"
                        @update:model-value="filterClients"
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

      <!-- Main content -->
      <template #default>
        <!-- Desktop Table View (hidden on mobile) -->
        <div class="hidden sm:block">
          <div>
            <!-- Table content will be shown when not loading and has items -->
            <div class="rounded-lg border border-gray-200 overflow-hidden">
              <UTable
                :data="paginatedClients"
                :columns="tableColumns"
                :loading="pending"
                :empty-state="{
                  icon: 'i-heroicons-user-group',
                  label: 'No clients found',
                  description:
                    search || hasActiveFilters
                      ? 'Try adjusting your search or filters to find what you\'re looking for.'
                      : 'Get started by adding your first client.',
                }"
                class="w-full"
              >
                <!-- Boolean Columns -->
                <template #hasOrders-data="{ row }">
                  <UIcon
                    :name="
                      row.original.hasOrders ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'
                    "
                    :class="[
                      'w-5 h-5',
                      row.original.hasOrders ? 'text-green-500' : 'text-gray-300',
                    ]"
                  />
                </template>
              </UTable>
            </div>

            <!-- Pagination -->
            <div v-if="localTotalCount > ITEMS_PER_PAGE" class="px-4 py-3 border-t border-gray-200">
              <UPagination
                v-model:page="currentPage"
                :total="localTotalCount"
                :items-per-page="ITEMS_PER_PAGE"
                @update:page="handlePageChange"
              >
                <template #prev>
                  <UButton
                    icon="i-heroicons-arrow-small-left"
                    color="neutral"
                    :disabled="currentPage <= 1"
                    :ui="{ base: 'rounded-full' }"
                    class="mr-2"
                    @click="handlePageChange(currentPage - 1)"
                  />
                </template>

                <template #next>
                  <UButton
                    icon="i-heroicons-arrow-small-right"
                    color="neutral"
                    :disabled="currentPage >= Math.ceil(localTotalCount / ITEMS_PER_PAGE)"
                    :ui="{
                      base: 'rounded-full',
                    }"
                    class="ml-2"
                    @click="handlePageChange(currentPage + 1)"
                  />
                </template>
              </UPagination>
            </div>
          </div>
        </div>

        <!-- Mobile Card View (shown on mobile) -->
        <div class="sm:hidden space-y-4">
          <div v-if="pending" class="p-8 text-center">
            <UIcon
              name="i-heroicons-arrow-path"
              class="w-8 h-8 mx-auto animate-spin text-primary-500"
            />
            <p class="mt-2 text-gray-600">Loading clients...</p>
          </div>

          <template v-else>
            <div
              v-for="client in paginatedClients"
              :key="client.id"
              class="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-3"
            >
              <div class="flex items-center space-x-3">
                <UAvatar
                  :alt="client.name"
                  size="lg"
                  :text="getInitials(client.name)"
                  :src="null"
                  class="flex-shrink-0"
                />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <h3 class="text-base font-medium text-gray-900 truncate">
                      {{ client.name || 'Unnamed Client' }}
                    </h3>
                    <div class="ml-2">
                      <UDropdownMenu
                        :items="[
                          {
                            label: 'View',
                            icon: 'i-heroicons-eye',
                            click: () => navigateTo(getViewClientPath(client.id)),
                          },
                          {
                            label: 'Edit',
                            icon: 'i-heroicons-pencil',
                            click: () => navigateTo(getEditClientPath(client.id)),
                          },
                          {
                            type: 'divider',
                          },
                          {
                            label: 'Delete',
                            icon: 'i-heroicons-trash',
                            click: () => confirmDelete(client),
                            color: 'error',
                          },
                        ]"
                        :content="{ align: 'end', side: 'bottom', sideOffset: 8 }"
                      >
                        <UButton
                          color="neutral"
                          variant="ghost"
                          size="xs"
                          icon="i-heroicons-ellipsis-vertical"
                          class="p-1"
                        />
                      </UDropdownMenu>
                    </div>
                  </div>

                  <!-- Contact Information -->
                  <div class="mt-1 space-y-0.5">
                    <div v-if="client.email" class="flex items-center space-x-1.5">
                      <UIcon
                        name="i-heroicons-envelope"
                        class="w-3 h-3 text-gray-400 flex-shrink-0"
                      />
                      <p class="text-xs text-gray-600 truncate">{{ client.email }}</p>
                    </div>
                    <div v-if="client.phone" class="flex items-center space-x-1.5">
                      <UIcon name="i-heroicons-phone" class="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <p class="text-xs text-gray-600">{{ client.phone }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </template>
    </BaseListPage>

    <!-- Delete Confirmation Modal -->
    <DeleteModal
      v-model:model-value="isDeleteModalOpen"
      title="Delete Client"
      :loading="_isDeleting"
      @confirm="deleteClient"
    >
      <p class="text-gray-700 dark:text-gray-300">
        Are you sure you want to delete
        <span class="font-semibold">{{ clientToDelete?.name || 'this client' }}</span
        >? This action cannot be undone.
      </p>
    </DeleteModal>
  </div>
</template>

<script setup lang="ts">
// Import stores and utilities
import { ref, computed, watch, h, resolveComponent } from 'vue'
import { ROUTE_NAMES } from '../../constants/routes'
import type { Client } from '../../types/client'
import { useListData } from '../../composables/useListData'

// Resolve UI components
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UButton = resolveComponent('UButton')
const UAvatar = resolveComponent('UAvatar')

// Initialize router and route
const router = useRouter()
const route = useRoute()

// Delete modal state
const isDeleteModalOpen = ref(false)
const clientToDelete = ref<Client | null>(null)
const _isDeleting = ref(false)

// Route helpers
const getEditClientPath = (id: number) => `/clients/${id}/edit`
const getViewClientPath = (id: number) => `/clients/${id}`

// Constants
const ITEMS_PER_PAGE = 10

// Use unified list data management
const {
  state: {
    items: localClients,
    totalCount: localTotalCount,
    currentPage,
    search,
    sortBy,
    isLoading: pending,
    isFilterOpen,
    hasActiveFilters,
    activeFiltersCount,
  },
  actions: { handleSearch, handleSort, handlePageChange, resetFilters },
  setFilter,
  getFilter,
} = useListData<Client>({
  endpoint: '/api/clients',
  defaultPageSize: ITEMS_PER_PAGE,
  defaultSortBy: 'name-asc',
  filterKeys: ['hasOrders', 'dateAdded'],
  transform: (client: Client) => ({
    ...client,
    name: client.name || 'Unnamed Client',
    hasOrders: Boolean(client.hasOrders),
  }),
  serverSide: false,
  sortByMapping: {
    newest: { sortBy: 'createdAt', sortOrder: 'desc' },
    oldest: { sortBy: 'createdAt', sortOrder: 'asc' },
    'name-asc': { sortBy: 'name', sortOrder: 'asc' },
    'name-desc': { sortBy: 'name', sortOrder: 'desc' },
  },
})

// Additional filter refs for easier access
const hasOrdersFilter = computed({
  get: () => getFilter('hasOrders') || 'all',
  set: value => setFilter('hasOrders', value === 'all' ? null : value),
})

const dateAddedFilter = computed({
  get: () => getFilter('dateAdded') || 'any',
  set: value => setFilter('dateAdded', value === 'any' ? null : value),
})

// Sort options
const sortOptions = [
  { label: 'Name (A-Z)', value: 'name-asc' },
  { label: 'Name (Z-A)', value: 'name-desc' },
  { label: 'Newest First', value: 'createdAt-desc' },
  { label: 'Oldest First', value: 'createdAt-asc' },
  { label: 'Most Orders', value: 'orderCount-desc' },
  { label: 'Highest Spending', value: 'totalSpent-desc' },
]

// Date options
const dateOptions = [
  { label: 'Last 7 days', value: '7days' },
  { label: 'Last 30 days', value: '30days' },
  { label: 'Last 3 months', value: '3months' },
  { label: 'Last year', value: '1year' },
]

// Additional methods
const filterClients = () => {
  currentPage.value = 1
}

const deleteClient = async () => {
  if (!clientToDelete.value) return

  const toast = useToast()
  _isDeleting.value = true

  try {
    const response = await $fetch(`/api/clients/${clientToDelete.value.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response) {
      // Remove the client from the list
      const index = localClients.value.findIndex(c => c.id === clientToDelete.value?.id)
      if (index !== -1) {
        localClients.value.splice(index, 1)
      }

      toast.add({
        title: 'Client deleted',
        description: `${clientToDelete.value.name} has been deleted successfully.`,
        color: 'primary',
      })
    } else {
      throw new Error('Failed to delete client')
    }
  } catch (error) {
    console.error('Error deleting client:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to delete client. Please try again.',
      color: 'error',
    })
  } finally {
    _isDeleting.value = false
    isDeleteModalOpen.value = false
    clientToDelete.value = null
  }
}

// Confirm delete
const confirmDelete = (client: Client) => {
  clientToDelete.value = client
  isDeleteModalOpen.value = true
}

// Computed property for filtered clients
// Since the API handles filtering, sorting, and pagination, we just return the local clients
const filteredClients = computed<Client[]>(() => {
  console.log('Computing filteredClients, clients:', localClients.value)
  return localClients.value || []
})

// Computed property for paginated clients
// Since the API handles pagination, we just return the filtered clients directly
const paginatedClients = computed<Client[]>(() => {
  return filteredClients.value
})

// Table columns
interface TableColumn<T> {
  accessorKey?: keyof T
  id?: string
  header: string
  enableSorting: boolean
  cell?: (props: { row: { original: T } }) => unknown
  meta?: {
    class?: {
      th?: string
      td?: string
    }
  }
}

const tableColumns: TableColumn<Client>[] = [
  {
    id: 'index',
    header: '#',
    enableSorting: false,
    cell: ({ row }) => {
      // Find the index of this client in the paginatedClients array
      const index = paginatedClients.value.findIndex(client => client.id === row.original.id)
      return h(
        'div',
        { class: 'font-medium text-neutral-700' },
        String((currentPage.value - 1) * ITEMS_PER_PAGE + index + 1)
      )
    },
  },
  {
    accessorKey: 'name',
    header: 'Name',
    enableSorting: true,
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-3' }, [
        h(UAvatar, {
          alt: row.original.name || 'Unnamed Client',
          size: 'lg',
          text: getInitials(row.original.name),
        }),
        h('div', undefined, [
          h('p', { class: 'font-medium text-neutral-700' }, row.original.name || 'Unnamed Client'),
        ]),
      ])
    },
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    enableSorting: false,
  },
  {
    accessorKey: 'hasOrders',
    header: 'Has Orders',
    enableSorting: true,
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    cell: ({ row }) => {
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
                onSelect: () => navigateTo(getViewClientPath(row.original.id)),
              },
              {
                label: 'Edit',
                icon: 'i-heroicons-pencil',
                onSelect: () => navigateTo(getEditClientPath(row.original.id)),
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
            'aria-label': 'Actions dropdown',
          },
          () =>
            h(UButton, {
              icon: 'i-lucide-ellipsis-vertical',
              color: 'neutral',
              variant: 'ghost',
              'aria-label': 'Actions dropdown',
            })
        )
      )
    },
    meta: {
      class: { th: 'text-center', td: 'text-center' },
    },
  },
]

// Set page title
useHead({
  title: 'Clients',
})

// Watch for route changes
watch(
  () => route.query,
  newQuery => {
    if (newQuery.page) {
      const page = parseInt(newQuery.page as string, 10)
      if (!isNaN(page) && page !== currentPage.value) {
        currentPage.value = page
      }
    }
  },
  { immediate: true }
)

// Watch for page changes to update URL
watch(
  () => currentPage.value,
  newPage => {
    const query = { ...route.query, page: newPage > 1 ? newPage : undefined }
    router.replace({ query })
  }
)

// Function to get initials from name
const getInitials = (name: string) => {
  if (!name) return 'UC'

  const names = name.split(' ')
  if (names.length === 1) {
    return names[0].substring(0, 2).toUpperCase()
  }

  return (names[0][0] + names[names.length - 1][0]).toUpperCase()
}
</script>
