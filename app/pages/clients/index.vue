<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Clients</h1>
        <p class="mt-1 text-sm text-gray-500">Manage your clients and their information</p>
      </div>
      <UButton to="/clients/new" icon="i-heroicons-plus" color="primary"> Add Client </UButton>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3">
      <UInput
        v-model="search"
        placeholder="Search clients..."
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
v-if="hasActiveFilters"
color="primary"
variant="solid"
class="ml-1">
            {{ activeFiltersCount }}
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
            v-if="hasActiveFilters"
            color="neutral"
            variant="ghost"
            size="sm"
            icon="i-heroicons-x-mark"
            @click="resetFilters"
          >
            Clear all
          </UButton>
        </div>

        <!-- Has Orders Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Order Status</label>
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <UButton
              v-for="option in orderStatusOptions"
              :key="option.value"
              :color="hasOrdersFilter === option.value ? 'primary' : 'neutral'"
              :variant="hasOrdersFilter === option.value ? 'solid' : 'outline'"
              size="sm"
              class="justify-center"
              @click="hasOrdersFilter = option.value"
            >
              <UIcon
                :name="option.icon"
                class="w-4 h-4 mr-1.5"
                :class="{
                  'text-white': hasOrdersFilter === option.value,
                  'text-gray-500': hasOrdersFilter !== option.value,
                }"
              />
              {{ option.label }}
            </UButton>
          </div>
        </div>

        <!-- Date Added Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Date Added</label>
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <UButton
              v-for="dateOption in dateAddedOptions"
              :key="dateOption.value"
              :color="dateAddedFilter === dateOption.value ? 'primary' : 'neutral'"
              :variant="dateAddedFilter === dateOption.value ? 'solid' : 'outline'"
              size="sm"
              class="justify-center"
              @click="dateAddedFilter = dateOption.value"
            >
              <UIcon
                :name="dateOption.icon"
                class="w-4 h-4 mr-1.5"
                :class="{
                  'text-white': dateAddedFilter === dateOption.value,
                  'text-gray-500': dateAddedFilter !== dateOption.value,
                }"
              />
              {{ dateOption.label }}
            </UButton>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Desktop Table View -->
    <div v-if="!isLoading" class="hidden md:block">
      <UTable
        :rows="paginatedClients"
        :columns="columns"
        :loading="isLoading"
        :empty-state="{
          icon: 'i-heroicons-user-group',
          label: 'No clients found',
          description: hasActiveFilters
            ? 'Try adjusting your filters'
            : 'Add your first client to get started',
        }"
        :sort="{
          column: sortBy.split('_')[0],
          direction: sortBy.endsWith('_desc') ? 'desc' : 'asc',
        }"
        class="w-full"
        @sort="handleSort"
      />

      <!-- Pagination -->
      <div class="mt-6 flex items-center justify-between">
        <div class="text-sm text-gray-500">
          Showing <span class="font-medium">{{ (currentPage - 1) * itemsPerPage + 1 }}</span> to
          <span class="font-medium">{{
            Math.min(currentPage * itemsPerPage, filteredClients.length)
          }}</span>
          of <span class="font-medium">{{ filteredClients.length }}</span> results
        </div>
        <UPagination
          v-model="currentPage"
          :page-count="itemsPerPage"
          :total="filteredClients.length"
          :ui="{ rounded: 'first-of-type:rounded-s-md last-of-type:rounded-e-md' }"
        />
      </div>
    </div>

    <!-- Loading state for desktop -->
    <div v-else class="hidden md:block">
      <div class="flex items-center justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400 mr-3" />
        <span class="text-gray-500">Loading clients...</span>
      </div>
    </div>

    <!-- Mobile List View -->
    <div v-if="!isLoading" class="md:hidden space-y-4">
      <div
        v-for="client in paginatedClients"
        :key="client.id"
        class="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-5 hover:border-gray-300"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center space-x-2">
              <span class="text-base font-medium text-gray-900"
                >{{ client.firstName }} {{ client.lastName }}</span
              >
              <UBadge
v-if="client.isActive"
color="success"
variant="subtle"
size="xs">
                Active
              </UBadge>
            </div>
            <p v-if="client.email" class="mt-1 text-sm text-gray-500 flex items-center">
              <UIcon name="i-heroicons-envelope" class="w-4 h-4 mr-1.5 text-gray-400" />
              {{ client.email }}
            </p>
            <p v-if="client.phone" class="mt-1 text-sm text-gray-500 flex items-center">
              <UIcon name="i-heroicons-phone" class="w-4 h-4 mr-1.5 text-gray-400" />
              {{ client.phone }}
            </p>
            <p class="mt-2 text-sm text-gray-500">
              <span class="font-medium text-gray-900">{{ client.orderCount || 0 }}</span> orders
              <span class="mx-2 text-gray-300">•</span>
              <span class="text-gray-500">Joined {{ formatDate(client.createdAt) }}</span>
            </p>
          </div>
          <UDropdownMenu
            :items="[
              [
                {
                  label: 'View',
                  icon: 'i-heroicons-eye',
                  click: () => navigateTo(`/clients/${client.id}`),
                },
                {
                  label: 'Edit',
                  icon: 'i-heroicons-pencil',
                  click: () => navigateTo(`/clients/${client.id}/edit`),
                },
              ],
              [
                {
                  label: 'Delete',
                  icon: 'i-heroicons-trash',
                  click: () => confirmDelete(client),
                },
              ],
            ]"
          >
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-heroicons-ellipsis-horizontal"
              size="sm"
            />
          </UDropdownMenu>
        </div>
      </div>

      <!-- Empty state for mobile -->
      <div v-if="!isLoading && paginatedClients.length === 0" class="text-center py-12">
        <UIcon name="i-heroicons-user-group" class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">No clients</h3>
        <p class="mt-1 text-sm text-gray-500">
          {{
            hasActiveFilters
              ? 'Try adjusting your filters'
              : 'Get started by adding your first client'
          }}
        </p>
        <div class="mt-6">
          <UButton to="/clients/new" icon="i-heroicons-plus" color="primary"> Add Client </UButton>
        </div>
      </div>

      <!-- Pagination for mobile -->
      <div v-if="filteredClients.length > itemsPerPage" class="mt-6">
        <UPagination
          v-model="currentPage"
          :page-count="itemsPerPage"
          :total="filteredClients.length"
          :ui="{ rounded: 'first-of-type:rounded-s-md last-of-type:rounded-e-md' }"
        />
      </div>
    </div>

    <!-- Loading state for mobile -->
    <div v-else class="md:hidden">
      <div class="flex items-center justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400 mr-3" />
        <span class="text-gray-500">Loading clients...</span>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="showDeleteModal">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-medium text-gray-900">Delete Client</h3>
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-heroicons-x-mark"
                @click="showDeleteModal = false"
              />
            </div>
          </template>

          <p class="text-sm text-gray-500">
            Are you sure you want to delete
            <span class="font-medium"
              >{{ clientToDelete?.firstName }} {{ clientToDelete?.lastName }}</span
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
              <UButton color="error" :loading="isDeleting" @click="deleteClient"> Delete </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Client } from '~/types/client'

definePageMeta({
  middleware: ['auth', 'setup-required'],
  layout: 'dashboard',
})

// Use the clients composable
const {
  clients,
  isLoading,
  deleteClient: _deleteClientApi,
  sort,
  search: searchTerm,
} = useClients()

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

// Sync pagination
watch([currentPage, itemsPerPage], () => {
  // Pagination is handled locally in this component
})
const hasOrdersFilter = ref('all')
const dateAddedFilter = ref('any')
const showDeleteModal = ref(false)
const clientToDelete = ref<Client | null>(null)
const isDeleting = ref(false)

// Sort options
const sortOptions = [
  { label: 'Newest', value: 'createdAt_desc' },
  { label: 'Oldest', value: 'createdAt_asc' },
  { label: 'Name (A-Z)', value: 'name_asc' },
  { label: 'Name (Z-A)', value: 'name_desc' },
  { label: 'Most Orders', value: 'orderCount_desc' },
  { label: 'Least Orders', value: 'orderCount_asc' },
]

// Order status options
const orderStatusOptions = [
  { label: 'All', value: 'all', icon: 'i-heroicons-funnel' },
  { label: 'With Orders', value: 'true', icon: 'i-heroicons-shopping-bag' },
  { label: 'Without Orders', value: 'false', icon: 'i-heroicons-shopping-bag-slash' },
]

// Date added options
const dateAddedOptions = [
  { label: 'Any Time', value: 'any', icon: 'i-heroicons-calendar' },
  { label: 'Last 7 Days', value: '7days', icon: 'i-heroicons-calendar-days' },
  { label: 'Last 30 Days', value: '30days', icon: 'i-heroicons-calendar-days' },
  { label: 'Last 3 Months', value: '3months', icon: 'i-heroicons-calendar-days' },
  { label: 'This Year', value: '1year', icon: 'i-heroicons-calendar-days' },
]

// Computed
const filteredClients = computed(() => {
  let result = [...clients.value]

  // Apply search filter
  if (search.value) {
    const searchTerm = search.value.toLowerCase()
    result = result.filter(
      client =>
        client.firstName?.toLowerCase().includes(searchTerm) ||
        client.lastName?.toLowerCase().includes(searchTerm) ||
        client.email?.toLowerCase().includes(searchTerm) ||
        client.phone?.toLowerCase().includes(searchTerm) ||
        `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchTerm)
    )
  }

  // Apply has orders filter
  if (hasOrdersFilter.value !== 'all') {
    const hasOrders = hasOrdersFilter.value === 'true'
    result = result.filter(client =>
      hasOrders ? (client.orderCount || 0) > 0 : (client.orderCount || 0) === 0
    )
  }

  // Apply date added filter
  if (dateAddedFilter.value !== 'any') {
    const now = new Date()
    const fromDate = new Date()

    switch (dateAddedFilter.value) {
      case '7days':
        fromDate.setDate(now.getDate() - 7)
        break
      case '30days':
        fromDate.setDate(now.getDate() - 30)
        break
      case '3months':
        fromDate.setMonth(now.getMonth() - 3)
        break
      case '1year':
        fromDate.setFullYear(now.getFullYear() - 1)
        break
    }

    result = result.filter(client => {
      const clientDate = new Date(client.createdAt)
      return clientDate >= fromDate
    })
  }

  // Apply sorting
  result.sort((a, b) => {
    const [sortField, sortDirection] = sortBy.value.split('_')
    const direction = sortDirection === 'desc' ? -1 : 1

    if (sortField === 'createdAt') {
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction
    } else if (sortField === 'name') {
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase()
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase()
      return nameA.localeCompare(nameB) * direction
    } else if (sortField === 'orderCount') {
      return ((a.orderCount || 0) - (b.orderCount || 0)) * direction
    }

    return 0
  })

  return result
})

const paginatedClients = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredClients.value.slice(start, end)
})

const hasActiveFilters = computed(() => {
  return hasOrdersFilter.value !== 'all' || dateAddedFilter.value !== 'any' || search.value !== ''
})

const activeFiltersCount = computed(() => {
  let count = 0
  if (hasOrdersFilter.value !== 'all') count++
  if (dateAddedFilter.value !== 'any') count++
  return count
})

// Table columns
const columns = [
  {
    id: 'name',
    key: 'name',
    label: 'Name',
    sortable: true,
    render: (row: Client) => `${row.firstName} ${row.lastName}`,
  },
  {
    id: 'email',
    key: 'email',
    label: 'Email',
    sortable: true,
  },
  {
    id: 'phone',
    key: 'phone',
    label: 'Phone',
    sortable: true,
  },
  {
    id: 'orderCount',
    key: 'orderCount',
    label: 'Orders',
    sortable: true,
    align: 'center',
    render: (row: Client) => row.orderCount || 0,
  },
  {
    id: 'createdAt',
    key: 'createdAt',
    label: 'Date Added',
    sortable: true,
    format: (value: string) => formatDate(value),
  },
  {
    id: 'status',
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (row: Client) =>
      h(
        UBadge,
        {
          color: row.isActive ? 'green' : 'gray',
          variant: 'subtle',
          class: 'capitalize',
        },
        () => (row.isActive ? 'Active' : 'Inactive')
      ),
  },
  {
    id: 'actions',
    key: 'actions',
    label: '',
    sortable: false,
    align: 'right',
    render: (row: Client) =>
      h(
        UDropdownMenu,
        {
          items: [
            [
              {
                label: 'View',
                icon: 'i-heroicons-eye',
                click: () => navigateTo(`/clients/${row.id}`),
              },
              {
                label: 'Edit',
                icon: 'i-heroicons-pencil',
                click: () => navigateTo(`/clients/${row.id}/edit`),
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
              icon: 'i-heroicons-ellipsis-horizontal',
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

const handleSort = (value: string) => {
  sortBy.value = value
  currentPage.value = 1
}

const toggleFilter = () => {
  isFilterOpen.value = !isFilterOpen.value
}

const resetFilters = () => {
  hasOrdersFilter.value = 'all'
  dateAddedFilter.value = 'any'
  search.value = ''
  currentPage.value = 1
}

const confirmDelete = (client: Client) => {
  clientToDelete.value = client
  showDeleteModal.value = true
}

const deleteClient = async () => {
  if (!clientToDelete.value) return

  try {
    isDeleting.value = true
    // Replace with your actual API call
    // await $fetch(`/api/clients/${clientToDelete.value.id}`, { method: 'DELETE' })

    // Remove the client from the list
    const index = clients.value.findIndex(c => c.id === clientToDelete.value?.id)
    if (index !== -1) {
      clients.value.splice(index, 1)
    }

    showDeleteModal.value = false
    clientToDelete.value = null
  } catch (error) {
    console.error('Failed to delete client:', error)
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
</script>
