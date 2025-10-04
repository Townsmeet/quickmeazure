<template>
  <div>
    <BaseListPage
      title="Styles"
      page-type="styles"
      :primary-action="{
        label: 'Add Style',
        to: ROUTE_NAMES.DASHBOARD.STYLES.NEW,
      }"
      :show-search="true"
      :initial-search="search"
      :sort-options="sortOptions"
      :current-page="currentPage"
      :page-size="itemsPerPage"
      :total-items="filteredStyles.length"
      :is-loading="isLoading"
      :has-items="filteredStyles.length > 0"
      :has-active-filters="hasActiveFilters"
      empty-state-icon="i-heroicons-swatch"
      :empty-state-title="search || hasActiveFilters ? 'No styles found' : 'No styles yet'"
      :empty-state-description="
        search || hasActiveFilters
          ? 'Try adjusting your search or filters to find what you\'re looking for.'
          : 'Get started by adding your first style.'
      "
      :empty-state-action="
        !search && !hasActiveFilters
          ? {
              label: 'Add Style',
              to: ROUTE_NAMES.DASHBOARD.STYLES.NEW,
              icon: 'i-heroicons-plus',
            }
          : undefined
      "
      :is-filter-open="isFilterOpen"
      :active-filters-count="Object.values(filters).filter(v => v !== null && v !== 'all').length"
      @update:current-page="handlePageChange"
      @search="handleSearch"
      @sort="handleSort"
      @reset-filters="resetFilters"
      @toggle-filter="isFilterOpen = !isFilterOpen"
    >
      <!-- Filters slot -->
      <template #filters>
        <USelect
          v-model="sortBy"
          :items="sortOptions"
          placeholder="Sort by"
          size="lg"
          class="w-full sm:w-52"
          @update:model-value="filterStyles"
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
                    {{ Object.values(filters).filter(v => v !== null && v !== 'all').length }}
                    active
                  </div>
                </div>
              </div>

              <!-- Filter Content -->
              <div class="p-6">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <!-- Style Source Filter -->
                  <div class="space-y-2">
                    <UFormField label="Style Source" name="style-source-filter">
                      <template #label>
                        <div class="flex items-center space-x-2">
                          <UIcon name="i-heroicons-user-circle" class="w-4 h-4 text-gray-500" />
                          <span class="text-sm font-medium text-gray-700">Style Source</span>
                        </div>
                      </template>
                      <USelect
                        v-model="filters.styleSource as string | undefined"
                        :items="styleSourceOptions"
                        placeholder="All styles"
                        size="lg"
                        class="transition-all duration-200 hover:shadow-sm"
                        :ui="{
                          base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0',
                          placeholder: 'text-gray-400 dark:text-gray-500',
                        }"
                        @update:model-value="filterStyles"
                      />
                    </UFormField>
                  </div>

                  <!-- Style Type Filter -->
                  <div class="space-y-2">
                    <UFormField label="Style Type" name="style-type-filter">
                      <template #label>
                        <div class="flex items-center space-x-2">
                          <UIcon name="i-heroicons-swatch" class="w-4 h-4 text-gray-500" />
                          <span class="text-sm font-medium text-gray-700">Style Type</span>
                        </div>
                      </template>
                      <USelect
                        v-model="filters.styleType as string | undefined"
                        :items="styleTypeOptions"
                        placeholder="All types"
                        size="lg"
                        class="transition-all duration-200 hover:shadow-sm"
                        :ui="{
                          base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0',
                          placeholder: 'text-gray-400 dark:text-gray-500',
                        }"
                        @update:model-value="filterStyles"
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
        <!-- Styles grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          <UCard
            v-for="style in filteredStyles"
            :key="style.id"
            class="bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden group flex flex-col"
            :ui="{
              root: 'h-full flex flex-col',
              body: 'flex-1',
            }"
          >
            <!-- Style Image -->
            <div class="aspect-w-1 aspect-h-1 w-full bg-gray-50 rounded-lg overflow-hidden mb-4">
              <img
                v-if="style.imageUrl"
                :src="style.imageUrl"
                :alt="style.name"
                class="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400"
              >
                <UIcon name="i-heroicons-photo" class="w-12 h-12" />
              </div>
            </div>

            <!-- Style Info -->
            <div class="flex-1">
              <div class="flex items-start justify-between">
                <h3 class="text-lg font-medium text-gray-900 line-clamp-2 flex-1 mr-2">
                  {{ style.name }}
                </h3>

                <!-- Actions Dropdown -->
                <UDropdownMenu
                  :items="
                    [
                      {
                        label: 'View',
                        icon: 'i-heroicons-eye',
                        to: `/styles/${style.id}`,
                      },
                      {
                        label: 'Edit',
                        icon: 'i-heroicons-pencil',
                        to: getEditStylePath(String(style.id)),
                      },
                      {
                        type: 'divider',
                      },
                      {
                        label: 'Delete',
                        icon: 'i-heroicons-trash',
                        click: () => confirmDelete(style),
                        color: 'error',
                      },
                    ] as DropdownMenuItem[]
                  "
                  :popper="{ placement: 'bottom-end' }"
                >
                  <UButton
                    color="neutral"
                    variant="ghost"
                    icon="i-heroicons-ellipsis-vertical"
                    size="sm"
                    class="transition-opacity duration-200"
                    aria-label="Style actions"
                  />
                </UDropdownMenu>
              </div>

              <p class="mt-1 text-sm text-gray-500 line-clamp-2">
                {{ style.description || 'No description' }}
              </p>
            </div>
          </UCard>
        </div>
      </template>
    </BaseListPage>

    <!-- Delete Confirmation Modal -->
    <DeleteModal
      v-model:model-value="showDeleteModal"
      :item-type="'style'"
      :item-name="styleToDelete?.name || 'this style'"
      :loading="isDeleting"
      @confirm="deleteStyle"
      @update:model-value="val => (showDeleteModal = val)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { DropdownMenuItem } from '@nuxt/ui'
import type { Style } from '~/types/style'
import { ROUTE_NAMES } from '~/constants/routes'
import { useListData } from '~/composables/useListData'

// Route helper
const getEditStylePath = (id: string): string => {
  return `/styles/${id}/edit`
}

// Set page metadata
useHead({
  title: 'Styles',
})

// Delete modal state
const showDeleteModal = ref(false)
const styleToDelete = ref<Style | null>(null)
const isDeleting = ref(false)

// Use unified list data management
const {
  state: {
    items: styles,
    currentPage,
    pageSize: itemsPerPage,
    search,
    sortBy,
    isLoading,
    isFilterOpen,
    hasActiveFilters,
  },
  actions: { handleSearch, handleSort, handlePageChange, resetFilters, refresh: refreshStyles },
  setFilter,
  getFilter,
} = useListData<Style>({
  endpoint: '/api/styles',
  defaultPageSize: 10,
  defaultSortBy: 'newest',
  filterKeys: ['styleSource', 'styleType'],
  serverSide: false,
  sortByMapping: {
    newest: { sortBy: 'createdAt', sortOrder: 'desc' },
    oldest: { sortBy: 'createdAt', sortOrder: 'asc' },
    'name-asc': { sortBy: 'name', sortOrder: 'asc' },
    'name-desc': { sortBy: 'name', sortOrder: 'desc' },
  },
})

// Additional filter refs for easier access
const filters = computed({
  get: () => ({
    styleSource: getFilter('styleSource'),
    styleType: getFilter('styleType'),
  }),
  set: value => {
    setFilter('styleSource', value.styleSource)
    setFilter('styleType', value.styleType)
  },
})

// Filter options
const styleSourceOptions = [
  { label: 'All styles', value: 'all' },
  { label: 'My styles', value: 'user' },
  { label: 'System styles', value: 'system' },
]

const styleTypeOptions = [
  { label: 'All types', value: 'all' },
  { label: 'Casual', value: 'casual' },
  { label: 'Formal', value: 'formal' },
  { label: 'Business', value: 'business' },
  { label: 'Evening', value: 'evening' },
  { label: 'Traditional', value: 'traditional' },
]

// Computed
const filteredStyles = computed(() => styles.value)

// Sort options
const sortOptions = [
  { label: 'Newest first', value: 'newest', icon: 'i-heroicons-arrow-up' },
  { label: 'Oldest first', value: 'oldest', icon: 'i-heroicons-arrow-down' },
  { label: 'Name (A-Z)', value: 'name-asc', icon: 'i-heroicons-bars-arrow-down' },
  { label: 'Name (Z-A)', value: 'name-desc', icon: 'i-heroicons-bars-arrow-up' },
]

// Additional methods
const filterStyles = () => {
  currentPage.value = 1
  // Data will be automatically refetched due to filters watcher
}

const confirmDelete = (style: Style) => {
  console.log('confirmDelete called with style:', style)
  styleToDelete.value = style
  showDeleteModal.value = true
  console.log('showDeleteModal set to:', showDeleteModal.value)
}

const deleteStyle = async () => {
  if (!styleToDelete.value) return

  try {
    isDeleting.value = true
    const response = await $fetch(`/api/styles/${styleToDelete.value.id}`, {
      method: 'DELETE',
    })

    if (response) {
      // Add success notification
      useToast().add({
        title: 'Success',
        description: 'Style deleted successfully',
        icon: 'i-heroicons-check-circle',
        color: 'primary',
      })
      // Refresh data
      await refreshStyles()
      // Close modal
      showDeleteModal.value = false
      styleToDelete.value = null
    }
  } catch (error) {
    console.error('Error deleting style:', error)
    // Add error notification
    useToast().add({
      title: 'Error',
      description: 'Failed to delete style',
      icon: 'i-heroicons-exclamation-triangle',
      color: 'error',
    })
  } finally {
    isDeleting.value = false
  }
}
</script>
