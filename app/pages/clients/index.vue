<template>
  <div class="min-h-screen">
    <div class="max-w-7xl mx-auto pb-20 md:pb-6">
      <!-- Setup Modal (shown if setup is needed) -->
      <UModal v-model:open="showSetupModal">
        <template #content>
          <SetupModal />
        </template>
      </UModal>
      <!-- Header Section -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <img src="/logo.png" alt="QuickMeazure Logo" class="h-8 w-auto md:hidden" />
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Clients</h1>
          </div>
          <div class="flex gap-3">
            <UButton color="primary" size="lg" @click="showAddSlideover = true">
              Add Client
            </UButton>
          </div>
        </div>
      </div>

      <!-- Search and Filters -->
      <div class="mb-8">
        <UCard class="shadow-sm border-0">
          <div class="flex flex-col gap-4">
            <!-- Search and Filter Toggle Button -->
            <div class="flex gap-3">
              <UInput
                v-model="search"
                placeholder="Search clients by name, email, or phone..."
                icon="i-heroicons-magnifying-glass"
                size="lg"
                class="flex-1"
                @input="handleSearch"
              />
              <!-- Mobile Filter Toggle Button -->
              <UButton
                color="neutral"
                variant="outline"
                size="lg"
                icon="i-heroicons-funnel"
                class="md:hidden"
                @click="isFilterOpen = !isFilterOpen"
              >
                <template v-if="hasActiveFilters" #trailing>
                  <UBadge color="primary" variant="solid" class="ml-1">
                    {{ hasOrdersFilter !== 'all' ? '1' : '0' }}
                  </UBadge>
                </template>
              </UButton>
            </div>

            <!-- Filters (hidden on mobile unless toggled) -->
            <div :class="['flex flex-wrap gap-3', isFilterOpen ? 'flex' : 'hidden md:flex']">
              <USelect
                v-model="sortBy"
                :items="sortOptions"
                placeholder="Sort by"
                size="lg"
                class="w-48"
                @update:model-value="handleSort"
              />

              <UButton
                :color="hasOrdersFilter !== 'all' ? 'primary' : 'neutral'"
                :variant="hasOrdersFilter !== 'all' ? 'solid' : 'outline'"
                size="lg"
                @click="toggleOrderFilter"
              >
                <UIcon name="i-heroicons-shopping-bag" class="w-4 h-4 mr-2" />
                {{ orderFilterLabel }}
              </UButton>

              <UButton
                v-if="hasActiveFilters"
                color="neutral"
                variant="ghost"
                size="lg"
                icon="i-heroicons-x-mark"
                @click="resetFilters"
              >
                Clear
              </UButton>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <ClientCardSkeleton v-for="i in 6" :key="i" />
      </div>

      <!-- Client Cards -->
      <div v-else-if="!isLoading && paginatedClients.length > 0">
        <!-- Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <ClientCard
            v-for="client in paginatedClients"
            :key="client.id"
            :client="client"
            @click="openDetailSlideover"
            @view="openDetailSlideover"
            @edit="openEditSlideover"
            @delete="confirmDelete"
            @new-order="navigateTo(`/orders/new?client=${client.id}`)"
          />
        </div>

        <!-- Pagination -->
        <div
          v-if="filteredClients.length > itemsPerPage"
          class="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div class="text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
            Showing
            <span class="font-semibold text-gray-900">{{
              (currentPage - 1) * itemsPerPage + 1
            }}</span>
            to
            <span class="font-semibold text-gray-900">{{
              Math.min(currentPage * itemsPerPage, filteredClients.length)
            }}</span>
            of <span class="font-semibold text-gray-900">{{ filteredClients.length }}</span> clients
          </div>
          <UPagination
            v-model="currentPage"
            :page-count="itemsPerPage"
            :total="filteredClients.length"
          />
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="flex items-center justify-center min-h-[60vh]">
        <div class="max-w-xl mx-auto text-center">
          <UEmpty
            icon="i-heroicons-user-group"
            :title="
              error
                ? 'Unable to load clients'
                : hasActiveFilters
                  ? 'No clients found'
                  : 'No clients yet'
            "
            :description="
              error
                ? 'We encountered an error while loading your clients. Please try refreshing the page.'
                : hasActiveFilters
                  ? 'Try adjusting your search or filters to find what you\'re looking for.'
                  : 'Get started by adding your first client to begin managing measurements and orders.'
            "
            :actions="
              error
                ? [
                    {
                      icon: 'i-heroicons-arrow-path',
                      label: 'Refresh',
                      onClick: () => refreshClients(),
                    },
                  ]
                : clientEmptyActions
            "
          />
        </div>
      </div>
    </div>

    <!-- Client Detail Component -->
    <ClientDetail
      :is-open="showDetailSlideover"
      :client="selectedClient"
      @close="showDetailSlideover = false"
      @edit="openEditSlideover"
    />

    <!-- Client Edit Component -->
    <ClientEdit
      :is-open="showEditSlideover"
      :client="selectedClient"
      :is-saving="isSavingClient"
      @close="showEditSlideover = false"
      @save="saveClient"
    />

    <!-- Client Delete Component -->
    <ClientDelete
      :is-open="showDeleteModal"
      :client="clientToDelete"
      :is-deleting="isDeleting"
      @close="showDeleteModal = false"
      @confirm="deleteClient"
    />

    <!-- Client Add Component -->
    <ClientAdd
      :is-open="showAddSlideover"
      @close="showAddSlideover = false"
      @success="handleClientAdded"
    />
  </div>
</template>

<script setup lang="ts">
import type { Client } from '~/types/client'
import _dayjs from 'dayjs'
import SetupModal from '~/components/measurements/SetupModal.vue'
import ClientCardSkeleton from '~/components/skeleton/ClientCardSkeleton.vue'
import ClientCard from '~/components/clients/ClientCard.vue'

definePageMeta({
  middleware: ['auth', 'setup-required'],
  layout: 'dashboard',
})

// Use the clients composable
const {
  clients,
  isLoading,
  error,
  getClient,
  updateClient,
  deleteClient: _deleteClientApi,
  refreshClients,
} = useClients()

// Auth user (for setup status)
const { user } = useAuth()

// Setup modal state
const showSetupModal = ref(true)

// Check setup status when component mounts
const checkSetupStatus = () => {
  if (user.value?.hasCompletedSetup) {
    showSetupModal.value = false
  }
}

onMounted(() => {
  checkSetupStatus()
})

// Watch for changes to hasCompletedSetup and update modal visibility
watch(
  () => user.value?.hasCompletedSetup,
  hasCompletedSetup => {
    if (hasCompletedSetup) {
      showSetupModal.value = false
    }
  }
)

// Local state
const search = ref('')
const sortBy = ref('createdAt_desc')
const currentPage = ref(1)
const itemsPerPage = ref(12)
const hasOrdersFilter = ref<'all' | 'true' | 'false'>('all')
const showDeleteModal = ref(false)
const clientToDelete = ref<Client | null>(null)
const isDeleting = ref(false)
const isSavingClient = ref(false)
const isFilterOpen = ref(false)

// Slideover state
const showDetailSlideover = ref(false)
const showEditSlideover = ref(false)
const showAddSlideover = ref(false)
const selectedClient = ref<Client | null>(null)

// Sort options
const sortOptions = [
  { label: 'Newest First', value: 'createdAt_desc' },
  { label: 'Oldest First', value: 'createdAt_asc' },
  { label: 'Name (A-Z)', value: 'name_asc' },
  { label: 'Name (Z-A)', value: 'name_desc' },
  { label: 'Most Orders', value: 'orderCount_desc' },
  { label: 'Least Orders', value: 'orderCount_asc' },
]

// Computed properties
const filteredClients = computed(() => {
  let result = [...clients.value]

  // Apply search filter
  if (search.value) {
    const searchTerm = search.value.toLowerCase()
    result = result.filter(client => {
      const fullName = client.name
      return (
        fullName.toLowerCase().includes(searchTerm) ||
        client.email?.toLowerCase().includes(searchTerm) ||
        client.phone?.toLowerCase().includes(searchTerm)
      )
    })
  }

  // Apply has orders filter
  if (hasOrdersFilter.value !== 'all') {
    const hasOrders = hasOrdersFilter.value === 'true'
    result = result.filter(client =>
      hasOrders ? (client.orderCount || 0) > 0 : (client.orderCount || 0) === 0
    )
  }

  // Apply sorting
  result.sort((a, b) => {
    const [sortField, sortDirection] = sortBy.value.split('_')
    const direction = sortDirection === 'desc' ? -1 : 1

    if (sortField === 'createdAt') {
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction
    } else if (sortField === 'name') {
      const nameA = a.name.toLowerCase()
      const nameB = b.name.toLowerCase()
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
  return hasOrdersFilter.value !== 'all' || search.value !== ''
})

// Empty state actions for clients
const clientEmptyActions = computed(() => [
  {
    icon: 'i-heroicons-plus',
    label: hasActiveFilters.value ? 'Add Client' : 'Add Your First Client',
    onClick: () => {
      showAddSlideover.value = true
    },
  },
])

const orderFilterLabel = computed(() => {
  switch (hasOrdersFilter.value) {
    case 'true':
      return 'With Orders'
    case 'false':
      return 'No Orders'
    default:
      return 'All Clients'
  }
})

// Methods
const handleSearch = (value: string) => {
  search.value = value
  currentPage.value = 1
}

const handleSort = (value: string) => {
  sortBy.value = value
  currentPage.value = 1
}

const toggleOrderFilter = () => {
  const options = ['all', 'true', 'false'] as const
  const currentIndex = options.indexOf(hasOrdersFilter.value)
  const nextIndex = (currentIndex + 1) % options.length
  hasOrdersFilter.value = options[nextIndex] || 'all'
  currentPage.value = 1
}

const resetFilters = () => {
  hasOrdersFilter.value = 'all'
  search.value = ''
  currentPage.value = 1
}

const openDetailSlideover = async (client: Client) => {
  // Fetch full client data with measurements
  const fullClient = await getClient(client.id)
  selectedClient.value = fullClient || client

  // Parse measurement values if they're stored as JSON string
  if (
    selectedClient.value?.measurement?.values &&
    typeof selectedClient.value.measurement.values === 'string'
  ) {
    try {
      selectedClient.value.measurement.values = JSON.parse(selectedClient.value.measurement.values)
    } catch (error) {
      console.error('Failed to parse measurement values:', error)
      selectedClient.value.measurement.values = {}
    }
  }

  showDetailSlideover.value = true
}

const openEditSlideover = async (client: Client) => {
  // Fetch full client data with measurements
  const fullClient = await getClient(client.id)
  selectedClient.value = fullClient || client

  // Ensure measurement values are properly initialized
  if (selectedClient.value?.measurement?.values) {
    // Parse values if it's a string (JSON from database)
    if (typeof selectedClient.value.measurement.values === 'string') {
      try {
        selectedClient.value.measurement.values = JSON.parse(
          selectedClient.value.measurement.values
        )
      } catch (error) {
        console.error('Failed to parse measurement values:', error)
        selectedClient.value.measurement.values = {}
      }
    }

    // Ensure values is an object
    if (
      typeof selectedClient.value.measurement.values !== 'object' ||
      selectedClient.value.measurement.values === null
    ) {
      selectedClient.value.measurement.values = {}
    }
  }

  showEditSlideover.value = true
}

const confirmDelete = (client: Client) => {
  clientToDelete.value = client
  showDeleteModal.value = true
}

const saveClient = async (client: Client) => {
  if (!client) return

  try {
    isSavingClient.value = true
    // Prepare the update data
    const updateData = {
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      notes: client.notes,
      measurements: client.measurement
        ? {
            values: client.measurement.values || {},
            notes: client.measurement.notes || undefined,
          }
        : undefined,
    }

    // Update the client using the API
    const result = await updateClient(client.id, updateData)

    if (result.success) {
      showEditSlideover.value = false
      showDetailSlideover.value = false
      selectedClient.value = null
      currentPage.value = 1
      resetFilters()
      // Refresh the clients list
      await refreshClients()

      useToast().add({
        title: 'Client updated',
        description: 'The client has been successfully updated.',
        color: 'success',
      })
    } else {
      throw new Error(result.message || 'Failed to update client')
    }
  } catch (error) {
    console.error('Failed to update client:', error)
    useToast().add({
      title: 'Error',
      description: 'Failed to update client. Please try again.',
      color: 'error',
    })
  } finally {
    isSavingClient.value = false
  }
}

const deleteClient = async (client: Client | null) => {
  if (!client) return

  try {
    isDeleting.value = true

    // Delete the client using the API
    const success = await _deleteClientApi(client.id)

    if (success) {
      showDeleteModal.value = false
      clientToDelete.value = null
      // Refresh the clients list
      await refreshClients()

      useToast().add({
        title: 'Client deleted',
        description: 'The client has been successfully deleted.',
        color: 'success',
      })
    } else {
      throw new Error('Failed to delete client')
    }
  } catch (error) {
    console.error('Failed to delete client:', error)
    useToast().add({
      title: 'Error',
      description: 'Failed to delete client. Please try again.',
      color: 'error',
    })
  } finally {
    isDeleting.value = false
  }
}

const handleClientAdded = async (client: Client) => {
  // Close the add slideover
  showAddSlideover.value = false

  // Refresh the clients list
  await refreshClients()

  // Open the detail slideover for the newly created client
  await openDetailSlideover(client)
}
</script>
