<template>
  <div class="space-y-8">
    <!-- 1. Page Header -->
    <PageHeader :title="title" :primary-action="primaryAction">
      <template v-if="hasHeaderActions" #actions>
        <slot name="header-actions"></slot>
      </template>
    </PageHeader>

    <!-- 2. Search and Filter Card -->
    <UCard v-if="showSearch" class="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm">
      <div class="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-4 items-center">
        <!-- Search Input -->
        <div class="relative w-full sm:w-80 group">
          <UInput
            :id="`${pageType}-search`"
            v-model="searchQuery"
            :placeholder="`Search ${pageType}...`"
            icon="i-heroicons-magnifying-glass"
            size="lg"
            class="w-full focus-within:ring-2 ring-primary-200"
            @input="handleSearchInput"
          />
          <span
            v-if="searchQuery"
            class="absolute right-2 top-2.5 cursor-pointer text-gray-400 hover:text-gray-600"
            @click="resetSearch"
          >
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </span>
        </div>

        <!-- Sort and Filter Controls -->
        <div class="flex gap-2 w-full sm:w-auto sm:ml-auto">
          <slot name="filters">
            <!-- Default sort dropdown if no filters slot is provided -->
            <USelect
              v-if="sortOptions?.length"
              v-model="sortBy"
              :options="sortOptions"
              option-attribute="label"
              size="lg"
              class="w-full sm:w-52"
              @update:model-value="(value: unknown) => handleSort(value as string)"
            />
          </slot>

          <UButton
            :color="isFilterOpen ? 'primary' : 'neutral'"
            :variant="isFilterOpen ? 'soft' : 'outline'"
            icon="i-heroicons-funnel"
            class="transition-all duration-200"
            :class="{
              'ring-2 ring-primary-200 bg-primary-50': isFilterOpen,
              'hover:bg-gray-50': !isFilterOpen,
            }"
            @click="$emit('toggle-filter')"
          >
            <span class="flex items-center space-x-1">
              <span>Filter</span>
              <UBadge
                v-if="activeFiltersCount > 0"
                :label="activeFiltersCount.toString()"
                color="primary"
                variant="solid"
                size="xs"
                class="ml-1"
              />
            </span>
          </UButton>
        </div>
      </div>

      <!-- Filter Panel Slot -->
      <slot name="filter-panel"></slot>
    </UCard>

    <!-- 3. Main Content Card -->
    <UCard class="bg-white">
      <!-- Loading State -->
      <div v-if="isLoading" key="loading" class="flex justify-center items-center p-8">
        <div class="flex flex-col items-center space-y-4">
          <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary-500" />
          <p class="text-gray-500">Loading {{ pageType }}...</p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!hasItems" key="empty">
        <ClientOnly>
          <EmptyState
            :icon="emptyStateIcon || 'i-heroicons-inbox'"
            :title="emptyStateTitle || `No ${pageType} found`"
            :description="emptyStateDescription || 'Create your first item to get started.'"
          >
            <template #actions>
              <slot name="empty-state-actions">
                <UButton
                  v-if="emptyStateAction"
                  size="lg"
                  :to="emptyStateAction.to"
                  @click="emptyStateAction.onClick"
                >
                  {{ emptyStateAction.label }}
                </UButton>
              </slot>
            </template>
          </EmptyState>
        </ClientOnly>
      </div>

      <!-- Content with Pagination -->
      <div v-else key="content">
        <!-- Main content slot -->
        <slot name="default"></slot>

        <!-- Pagination -->
        <div v-if="showPagination" class="mt-6">
          <div
            class="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-gray-100 pt-4"
          >
            <div class="text-sm text-gray-500 order-2 sm:order-1">
              {{ paginationInfo }}
            </div>

            <UPagination
              v-if="totalPages > 1"
              :model-value="currentPage"
              :page-count="totalPages"
              :total="totalItems"
              :ui="{
                root: 'flex items-center gap-1',
                item: '!rounded-lg min-w-8 w-8 h-8',
              }"
              @update:model-value="handlePageChange"
            >
              <template #prev>
                <UTooltip text="Previous page">
                  <UButton
                    icon="i-heroicons-chevron-left"
                    color="neutral"
                    variant="ghost"
                    :disabled="currentPage <= 1"
                    class="w-8 h-8"
                    @click="goToPage(currentPage - 1)"
                  />
                </UTooltip>
              </template>

              <template #next>
                <UTooltip text="Next page">
                  <UButton
                    icon="i-heroicons-chevron-right"
                    color="neutral"
                    variant="ghost"
                    :disabled="currentPage >= totalPages"
                    class="w-8 h-8"
                    @click="goToPage(currentPage + 1)"
                  />
                </UTooltip>
              </template>
            </UPagination>
          </div>
        </div>
      </div>
    </UCard>

    <!-- 4. Delete Confirmation Modal -->
    <DeleteModal
      v-if="showDeleteModal"
      :model-value="showDeleteModal"
      :item-type="pageType"
      :item-name="itemToDelete?.name || itemToDelete?.title"
      @update:model-value="val => $emit('update:showDeleteModal', val)"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, useSlots } from 'vue'

const props = defineProps({
  // Page configuration
  title: {
    type: String,
    required: true,
  },
  pageType: {
    type: String,
    required: true,
  },

  // Search and filter
  showSearch: {
    type: Boolean,
    default: true,
  },
  initialSearch: {
    type: String,
    default: '',
  },
  sortOptions: {
    type: Array,
    default: () => [],
  },

  // Pagination
  currentPage: {
    type: Number,
    default: 1,
  },
  pageSize: {
    type: Number,
    default: 10,
  },
  totalItems: {
    type: Number,
    default: 0,
  },
  showPagination: {
    type: Boolean,
    default: true,
  },

  // Loading and empty states
  isLoading: {
    type: Boolean,
    default: false,
  },
  hasItems: {
    type: Boolean,
    default: false,
  },
  emptyStateIcon: {
    type: String,
    default: 'i-heroicons-inbox',
  },
  emptyStateTitle: {
    type: String,
    default: '',
  },
  emptyStateDescription: {
    type: String,
    default: '',
  },
  emptyStateAction: {
    type: Object,
    default: null,
  },

  // Actions
  primaryAction: {
    type: Object,
    default: null,
  },

  // Delete modal
  showDeleteModal: {
    type: Boolean,
    default: false,
  },
  itemToDelete: {
    type: Object,
    default: null,
  },
  hasActiveFilters: {
    type: Boolean,
    default: false,
  },
  isFilterOpen: {
    type: Boolean,
    default: false,
  },
  activeFiltersCount: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits([
  'update:currentPage',
  'update:search',
  'update:showDeleteModal',
  'search',
  'sort',
  'reset-filters',
  'delete-confirm',
  'toggle-filter',
])

const slots = useSlots()
const hasHeaderActions = computed(() => !!slots['header-actions'])

// Search
const searchQuery = ref(props.initialSearch)
const sortBy = ref(props.sortOptions?.[0] ? (props.sortOptions[0] as { value: string }).value : '')

// Pagination
const totalPages = computed(() => Math.ceil(props.totalItems / props.pageSize))

const paginationInfo = computed(() => {
  console.log('Computing paginationInfo with:', {
    currentPage: props.currentPage,
    pageSize: props.pageSize,
    totalItems: props.totalItems,
  })

  // If there are no items, show 0-0 of 0
  if (!props.totalItems || props.totalItems <= 0) {
    return `Showing 0-0 of 0 ${props.pageType}`
  }

  // Calculate start and end for pagination display
  const start = Math.max((props.currentPage - 1) * props.pageSize + 1, 1)
  const end = Math.min(props.currentPage * props.pageSize, props.totalItems)
  return `Showing ${start}-${end} of ${props.totalItems} ${props.pageType}`
})

// Event handlers
const handleSearchInput = () => {
  emit('search', searchQuery.value)
}

const resetSearch = () => {
  searchQuery.value = ''
  emit('search', '')
}

const handleSort = (value: string) => {
  emit('sort', value)
}

const handlePageChange = (page: number) => {
  emit('update:currentPage', page)
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    emit('update:currentPage', page)
  }
}

const handleDeleteConfirm = () => {
  emit('delete-confirm')
}

// Watch for prop changes
watch(
  () => props.initialSearch,
  newVal => {
    searchQuery.value = newVal
  }
)

watch(
  () => props.sortOptions,
  newVal => {
    if (newVal.length && !sortBy.value) {
      sortBy.value = (newVal[0] as { value: string }).value
    }
  },
  { immediate: true }
)
</script>
