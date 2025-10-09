<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Styles</h1>
        <p class="mt-1 text-sm text-gray-500">Manage your styles and designs</p>
      </div>
      <UButton to="/styles/new" icon="i-heroicons-plus" color="primary"> Add Style </UButton>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3">
      <UInput
        v-model="search"
        placeholder="Search styles..."
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

        <!-- Style Type Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Style Type</label>
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <UButton
              v-for="type in styleTypeOptions"
              :key="type.value"
              :color="styleTypeFilter === type.value ? 'primary' : 'neutral'"
              :variant="styleTypeFilter === type.value ? 'solid' : 'outline'"
              size="sm"
              class="justify-center"
              @click="styleTypeFilter = type.value"
            >
              <UIcon
                :name="type.icon"
                class="w-4 h-4 mr-1.5"
                :class="{
                  'text-white': styleTypeFilter === type.value,
                  'text-gray-500': styleTypeFilter !== type.value,
                }"
              />
              {{ type.label }}
            </UButton>
          </div>
        </div>

        <!-- Status Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <UButton
              v-for="status in statusOptions"
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
      </div>
    </Transition>

    <!-- Desktop Grid View -->
    <div class="hidden md:block">
      <div
        v-if="isLoading"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 py-8"
      >
        <div v-for="i in 8" :key="i" class="bg-gray-50 rounded-lg h-64 animate-pulse"></div>
      </div>

      <div v-else-if="filteredStyles.length === 0" class="text-center py-12">
        <UIcon name="i-heroicons-swatch" class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">No styles found</h3>
        <p class="mt-1 text-sm text-gray-500">
          {{
            hasActiveFilters
              ? 'Try adjusting your filters'
              : 'Get started by adding your first style'
          }}
        </p>
        <div class="mt-6">
          <UButton to="/styles/new" icon="i-heroicons-plus" color="primary"> Add Style </UButton>
        </div>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <UCard
          v-for="style in paginatedStyles"
          :key="style.id"
          class="group relative overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col"
        >
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-base font-medium text-gray-900 truncate">{{ style.name }}</h3>
              <UDropdown
                :items="[
                  [
                    {
                      label: 'View',
                      icon: 'i-heroicons-eye',
                      click: () => navigateTo(`/styles/${style.id}`),
                    },
                    {
                      label: 'Edit',
                      icon: 'i-heroicons-pencil',
                      click: () => navigateTo(`/styles/${style.id}/edit`),
                    },
                  ],
                  [
                    {
                      label: 'Delete',
                      icon: 'i-heroicons-trash',
                      click: () => confirmDelete(style),
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
              </UDropdown>
            </div>
          </template>

          <div class="aspect-w-4 aspect-h-3 bg-gray-50 rounded-lg overflow-hidden mb-4">
            <img
              v-if="style.imageUrl"
              :src="style.imageUrl"
              :alt="style.name"
              class="w-full h-48 object-cover"
            />
            <div
              v-else
              class="w-full h-48 flex items-center justify-center bg-gray-100 text-gray-400"
            >
              <UIcon name="i-heroicons-photo" class="w-12 h-12" />
            </div>
          </div>

          <div class="mt-auto">
            <div class="flex items-center justify-between">
              <UBadge :color="getStatusColor(style.status)" variant="subtle" size="sm">
                {{ formatStatus(style.status) }}
              </UBadge>
              <span class="text-sm text-gray-500">{{ style.itemCount || 0 }} items</span>
            </div>

            <p v-if="style.description" class="mt-2 text-sm text-gray-500 line-clamp-2">
              {{ style.description }}
            </p>

            <div class="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span class="text-xs text-gray-500"> Updated {{ formatDate(style.updatedAt) }} </span>
              <UButton
                :to="`/styles/${style.id}`"
                color="neutral"
                variant="ghost"
                size="sm"
                icon="i-heroicons-arrow-right"
                :ui="{ rounded: 'rounded-full' }"
              />
            </div>
          </div>
        </UCard>
      </div>

      <!-- Pagination -->
      <div v-if="filteredStyles.length > 0" class="mt-8 flex items-center justify-between">
        <div class="text-sm text-gray-500">
          Showing <span class="font-medium">{{ (currentPage - 1) * itemsPerPage + 1 }}</span> to
          <span class="font-medium">{{
            Math.min(currentPage * itemsPerPage, filteredStyles.length)
          }}</span>
          of <span class="font-medium">{{ filteredStyles.length }}</span> results
        </div>
        <UPagination
          v-model="currentPage"
          :page-count="itemsPerPage"
          :total="filteredStyles.length"
          :ui="{ rounded: 'first-of-type:rounded-s-md last-of-type:rounded-e-md' }"
        />
      </div>
    </div>

    <!-- Mobile List View -->
    <div class="md:hidden space-y-4">
      <div
        v-for="style in paginatedStyles"
        :key="style.id"
        class="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-4 hover:border-gray-300"
      >
        <div class="flex">
          <div class="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
            <img
              v-if="style.imageUrl"
              :src="style.imageUrl"
              :alt="style.name"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
              <UIcon name="i-heroicons-photo" class="w-6 h-6" />
            </div>
          </div>

          <div class="ml-4 flex-1 min-w-0">
            <div class="flex items-start justify-between">
              <h3 class="text-base font-medium text-gray-900 truncate">{{ style.name }}</h3>
              <UDropdown
                :items="[
                  [
                    {
                      label: 'View',
                      icon: 'i-heroicons-eye',
                      click: () => navigateTo(`/styles/${style.id}`),
                    },
                    {
                      label: 'Edit',
                      icon: 'i-heroicons-pencil',
                      click: () => navigateTo(`/styles/${style.id}/edit`),
                    },
                  ],
                  [
                    {
                      label: 'Delete',
                      icon: 'i-heroicons-trash',
                      click: () => confirmDelete(style),
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
              </UDropdown>
            </div>

            <div class="mt-1">
              <UBadge
:color="getStatusColor(style.status)"
variant="subtle"
size="xs"
class="mr-2">
                {{ formatStatus(style.status) }}
              </UBadge>
              <span class="text-xs text-gray-500">{{ style.itemCount || 0 }} items</span>
            </div>

            <p v-if="style.description" class="mt-1 text-sm text-gray-500 line-clamp-2">
              {{ style.description }}
            </p>

            <div class="mt-2 pt-2 border-t border-gray-100">
              <span class="text-xs text-gray-500"> Updated {{ formatDate(style.updatedAt) }} </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state for mobile -->
      <div v-if="!isLoading && paginatedStyles.length === 0" class="text-center py-12">
        <UIcon name="i-heroicons-swatch" class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">No styles</h3>
        <p class="mt-1 text-sm text-gray-500">
          {{
            hasActiveFilters
              ? 'Try adjusting your filters'
              : 'Get started by adding your first style'
          }}
        </p>
        <div class="mt-6">
          <UButton to="/styles/new" icon="i-heroicons-plus" color="primary"> Add Style </UButton>
        </div>
      </div>

      <!-- Pagination for mobile -->
      <div v-if="filteredStyles.length > itemsPerPage" class="mt-6">
        <UPagination
          v-model="currentPage"
          :page-count="itemsPerPage"
          :total="filteredStyles.length"
          :ui="{ rounded: 'first-of-type:rounded-s-md last-of-type:rounded-e-md' }"
        />
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <UModal v-model="showDeleteModal">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium text-gray-900">Delete Style</h3>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="showDeleteModal = false"
            />
          </div>
        </template>

        <p class="text-sm text-gray-500">
          Are you sure you want to delete the style
          <span class="font-medium">{{ styleToDelete?.name }}</span
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
            <UButton color="error" :loading="isDeleting" @click="deleteStyle"> Delete </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Style } from '~/types/style'

definePageMeta({
  middleware: ['auth', 'setup-required'],
  layout: 'dashboard',
})

// Use the styles composable
const {
  styles,
  isLoading,
  _deleteStyleApi,
  sort,
  search: searchTerm,
  pagination,
  filters,
  styleTypes,
} = useStyles()

// Local state
const search = ref('')
const sortBy = ref('updatedAt_desc')
const currentPage = ref(1)
const itemsPerPage = ref(12)
const isFilterOpen = ref(false)
const styleTypeFilter = ref('all')
const statusFilter = ref('all')
const showDeleteModal = ref(false)
const styleToDelete = ref<Style | null>(null)
const isDeleting = ref(false)

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
  pagination.value = {
    page: currentPage.value,
    pageSize: itemsPerPage.value,
  }
})

// Sync filters
watch([styleTypeFilter, statusFilter], () => {
  filters.value = {
    type: styleTypeFilter.value !== 'all' ? styleTypeFilter.value : undefined,
    status: statusFilter.value !== 'all' ? statusFilter.value : undefined,
  }
  currentPage.value = 1
})

// Sort options
const sortOptions = [
  { label: 'Recently Updated', value: 'updatedAt_desc' },
  { label: 'Oldest First', value: 'updatedAt_asc' },
  { label: 'Name (A-Z)', value: 'name_asc' },
  { label: 'Name (Z-A)', value: 'name_desc' },
  { label: 'Most Items', value: 'itemCount_desc' },
  { label: 'Least Items', value: 'itemCount_asc' },
]

// Style type options
const styleTypeOptions = [
  { label: 'All Types', value: 'all', icon: 'i-heroicons-funnel' },
  { label: 'Casual', value: 'casual', icon: 'i-heroicons-t-shirt' },
  { label: 'Formal', value: 'formal', icon: 'i-heroicons-academic-cap' },
  { label: 'Traditional', value: 'traditional', icon: 'i-heroicons-sparkles' },
  { label: 'Custom', value: 'custom', icon: 'i-heroicons-paint-brush' },
]

// Status options
const statusOptions = [
  { label: 'All Statuses', value: 'all', icon: 'i-heroicons-funnel' },
  { label: 'Active', value: 'active', icon: 'i-heroicons-check-circle' },
  { label: 'Draft', value: 'draft', icon: 'i-heroicons-document-text' },
  { label: 'Archived', value: 'archived', icon: 'i-heroicons-archive-box' },
]

// Computed
const filteredStyles = computed(() => {
  let result = [...styles.value]

  // Apply search filter
  if (search.value) {
    const searchTerm = search.value.toLowerCase()
    result = result.filter(
      style =>
        style.name?.toLowerCase().includes(searchTerm) ||
        style.description?.toLowerCase().includes(searchTerm) ||
        style.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    )
  }

  // Apply style type filter
  if (styleTypeFilter.value !== 'all') {
    result = result.filter(style => style.type === styleTypeFilter.value)
  }

  // Apply status filter
  if (statusFilter.value !== 'all') {
    result = result.filter(style => style.status === statusFilter.value)
  }

  // Apply sorting
  result.sort((a, b) => {
    const [sortField, sortDirection] = sortBy.value.split('_')
    const direction = sortDirection === 'desc' ? -1 : 1

    if (sortField === 'updatedAt' || sortField === 'createdAt') {
      return (new Date(a[sortField]).getTime() - new Date(b[sortField]).getTime()) * direction
    } else if (sortField === 'name') {
      return (a.name || '').localeCompare(b.name || '') * direction
    } else if (sortField === 'itemCount') {
      return ((a.itemCount || 0) - (b.itemCount || 0)) * direction
    }

    return 0
  })

  return result
})

const paginatedStyles = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredStyles.value.slice(start, end)
})

const hasActiveFilters = computed(() => {
  return styleTypeFilter.value !== 'all' || statusFilter.value !== 'all' || search.value !== ''
})

const activeFiltersCount = computed(() => {
  let count = 0
  if (styleTypeFilter.value !== 'all') count++
  if (statusFilter.value !== 'all') count++
  return count
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

const toggleFilter = () => {
  isFilterOpen.value = !isFilterOpen.value
}

const resetFilters = () => {
  styleTypeFilter.value = 'all'
  statusFilter.value = 'all'
  search.value = ''
  currentPage.value = 1
}

const confirmDelete = (style: Style) => {
  styleToDelete.value = style
  showDeleteModal.value = true
}

const deleteStyle = async () => {
  if (!styleToDelete.value) return

  try {
    isDeleting.value = true
    // Replace with your actual API call
    // await $fetch(`/api/styles/${styleToDelete.value.id}`, { method: 'DELETE' })

    // Remove the style from the list
    const index = styles.value.findIndex(s => s.id === styleToDelete.value?.id)
    if (index !== -1) {
      styles.value.splice(index, 1)
    }

    showDeleteModal.value = false
    styleToDelete.value = null
  } catch (error) {
    console.error('Failed to delete style:', error)
  } finally {
    isDeleting.value = false
  }
}

// Helper functions
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) return 'today'
  if (diffInDays === 1) return 'yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`

  return date.toLocaleDateString('en-US', {
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
    case 'active':
      return 'success'
    case 'draft':
      return 'warning'
    case 'archived':
      return 'neutral'
    default:
      return 'neutral'
  }
}
</script>
