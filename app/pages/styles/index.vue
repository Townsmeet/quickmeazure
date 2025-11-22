<template>
  <div class="min-h-screen">
    <div class="max-w-7xl mx-auto pb-20 md:pb-6">
      <!-- Header Section -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Styles</h1>
          </div>
          <div class="flex gap-3">
            <UButton color="primary" size="lg" @click="showAddSlideover = true">
              Add Style
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
                placeholder="Search styles by name or description..."
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
      <div
        v-if="isLoading"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <StyleCardSkeleton v-for="i in 8" :key="i" />
      </div>

      <!-- Style Cards -->
      <div v-else-if="!isLoading && paginatedStyles.length > 0">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <StyleCard
            v-for="style in paginatedStyles"
            :key="style.id"
            :style="style"
            @click="openDetailSlideover"
            @view="openDetailSlideover"
            @edit="openEditSlideover"
            @delete="confirmDelete"
          />
        </div>

        <!-- Pagination -->
        <div
          v-if="filteredStyles.length > itemsPerPage"
          class="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div class="text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
            Showing
            <span class="font-semibold text-gray-900">{{
              (currentPage - 1) * itemsPerPage + 1
            }}</span>
            to
            <span class="font-semibold text-gray-900">{{
              Math.min(currentPage * itemsPerPage, filteredStyles.length)
            }}</span>
            of <span class="font-semibold text-gray-900">{{ filteredStyles.length }}</span> styles
          </div>
          <UPagination
            v-model="currentPage"
            :page-count="itemsPerPage"
            :total="filteredStyles.length"
          />
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="flex items-center justify-center min-h-[60vh]">
        <div class="max-w-xl mx-auto text-center">
          <UEmpty
            icon="i-heroicons-swatch"
            :title="
              error
                ? 'Unable to load styles'
                : hasActiveFilters
                  ? 'No styles found'
                  : 'No styles yet'
            "
            :description="
              error
                ? 'We encountered an error while loading your styles. Please try refreshing the page.'
                : hasActiveFilters
                  ? 'Try adjusting your search or filters to find what you\'re looking for.'
                  : 'Get started by adding your first style to showcase your designs.'
            "
            :actions="
              error
                ? [
                    {
                      icon: 'i-heroicons-arrow-path',
                      label: 'Refresh',
                      onClick: () => refreshStyles(),
                    },
                  ]
                : hasActiveFilters
                  ? [
                      {
                        icon: 'i-heroicons-x-mark',
                        label: 'Clear Filters',
                        color: 'neutral',
                        variant: 'subtle',
                        onClick: resetFilters,
                      },
                      {
                        icon: 'i-heroicons-plus',
                        label: 'Add Style',
                        onClick: () => {
                          showAddSlideover = true
                        },
                      },
                    ]
                  : [
                      {
                        icon: 'i-heroicons-plus',
                        label: 'Add Your First Style',
                        onClick: () => {
                          showAddSlideover = true
                        },
                      },
                    ]
            "
          />
        </div>
      </div>
    </div>

    <!-- Style Detail Component -->
    <StyleDetail
      :is-open="showDetailSlideover"
      :style="selectedStyle"
      :related-orders="relatedOrders"
      @close="handleDetailClose"
      @edit="handleDetailEdit"
    />

    <!-- Style Edit Component -->
    <StyleEdit
      :is-open="showEditSlideover"
      :style="selectedStyle"
      :is-saving="isSavingStyle"
      @close="handleEditClose"
      @save="_updateStyle"
    />

    <!-- Style Delete Component -->
    <StyleDelete
      :is-open="showDeleteModal"
      :style="styleToDelete"
      :is-deleting="isDeleting"
      @close="showDeleteModal = false"
      @confirm="deleteStyle"
    />

    <!-- Style Add Component -->
    <StyleAdd
      :is-open="showAddSlideover"
      @close="showAddSlideover = false"
      @success="handleStyleAdded"
    />
  </div>
</template>

<script setup lang="ts">
import { nextTick } from 'vue'
import type { Style } from '~/types/style'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import StyleCardSkeleton from '~/components/skeleton/StyleCardSkeleton.vue'
import StyleCard from '~/components/styles/StyleCard.vue'

dayjs.extend(isSameOrAfter)

definePageMeta({
  middleware: ['auth', 'setup-required'],
  layout: 'dashboard',
})

// Use the styles composable
const { styles, isLoading, error, deleteStyle: _deleteStyleApi, refreshStyles } = useStyles()

// Local state
const search = ref('')
const sortBy = ref('updatedAt_desc')
const currentPage = ref(1)
const itemsPerPage = ref(20)

const showDeleteModal = ref(false)
const styleToDelete = ref<Style | null>(null)
const isDeleting = ref(false)

// Slideover state
const showDetailSlideover = ref(false)
const showEditSlideover = ref(false)
const showAddSlideover = ref(false)
const selectedStyle = ref<Style | null>(null)
const relatedOrders = ref<any[]>([])
const isEditingFromDetail = ref(false)
const isSavingStyle = ref(false)

// Sort options
const sortOptions = [
  { label: 'Recently Updated', value: 'updatedAt_desc' },
  { label: 'Oldest First', value: 'updatedAt_asc' },
  { label: 'Name (A-Z)', value: 'name_asc' },
  { label: 'Name (Z-A)', value: 'name_desc' },
  { label: 'Recently Created', value: 'createdAt_desc' },
  { label: 'Oldest Created', value: 'createdAt_asc' },
]

// Computed properties
const filteredStyles = computed(() => {
  let result = [...styles.value]

  // Apply search filter
  if (search.value) {
    const searchTerm = search.value.toLowerCase()
    result = result.filter(style => {
      return (
        style.name?.toLowerCase().includes(searchTerm) ||
        style.description?.toLowerCase().includes(searchTerm) ||
        style.category?.toLowerCase().includes(searchTerm) ||
        style.type?.toLowerCase().includes(searchTerm) ||
        (style.tags && style.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
      )
    })
  }

  // Apply sorting
  result.sort((a, b) => {
    const [sortField, sortDirection] = sortBy.value.split('_')
    const direction = sortDirection === 'desc' ? -1 : 1

    if (sortField === 'updatedAt' || sortField === 'createdAt') {
      const dateA = new Date(a[sortField] || a.createdAt).getTime()
      const dateB = new Date(b[sortField] || b.createdAt).getTime()
      return (dateA - dateB) * direction
    } else if (sortField === 'name') {
      return (a.name || '').localeCompare(b.name || '') * direction
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
  return search.value !== ''
})

const _activeStylesCount = computed(() => {
  return styles.value.length
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

const resetFilters = () => {
  search.value = ''
  currentPage.value = 1
}

const openDetailSlideover = async (style: Style) => {
  try {
    selectedStyle.value = style
    relatedOrders.value = []
    // Fetch full style data with related orders
    const response = await $fetch(`/api/styles/${style.id}`)

    if (response && typeof response === 'object' && 'success' in response && response.success) {
      const apiResponse = response as {
        success: boolean
        data?: { style?: Style; relatedOrders?: any[] }
      }
      selectedStyle.value = apiResponse.data?.style || style
      relatedOrders.value = apiResponse.data?.relatedOrders || []
    } else {
      selectedStyle.value = style
      relatedOrders.value = []
    }
  } catch (error) {
    console.error('Failed to fetch style details:', error)
    selectedStyle.value = style
    relatedOrders.value = []
  }

  showDetailSlideover.value = true
}

const openEditSlideover = async (style: Style) => {
  try {
    // Fetch full style data
    const response = await $fetch(`/api/styles/${style.id}`)

    if (response && typeof response === 'object' && 'success' in response && response.success) {
      const apiResponse = response as { success: boolean; data?: { style?: Style } }
      selectedStyle.value = apiResponse.data?.style || style
    } else {
      selectedStyle.value = style
    }
  } catch (error) {
    console.error('Failed to fetch style details:', error)
    selectedStyle.value = style
  }

  showEditSlideover.value = true
}

const closeDetailSlideover = (options?: { preserveSelection?: boolean }) => {
  showDetailSlideover.value = false
  if (!options?.preserveSelection) {
    selectedStyle.value = null
    relatedOrders.value = []
  } else {
    relatedOrders.value = []
  }
}

const handleDetailClose = () => {
  isEditingFromDetail.value = false
  closeDetailSlideover()
}

const handleDetailEdit = async (style: Style) => {
  isEditingFromDetail.value = true
  closeDetailSlideover({ preserveSelection: true })
  await nextTick()
  await openEditSlideover(style)
}

const closeEditSlideover = () => {
  showEditSlideover.value = false
  selectedStyle.value = null
  isEditingFromDetail.value = false
}

const handleEditClose = () => {
  closeEditSlideover()
}

const confirmDelete = (style: Style) => {
  styleToDelete.value = style
  showDeleteModal.value = true
}

const _updateStyle = async (style: Style, imageFiles?: File[]) => {
  if (!style) return

  try {
    isSavingStyle.value = true
    let updateData: any

    if (imageFiles && imageFiles.length > 0) {
      // Create FormData for multipart upload
      const formData = new FormData()
      formData.append('name', style.name)

      if (style.description) {
        formData.append('description', style.description)
      }

      if (style.type) {
        formData.append('type', style.type)
      }

      if (style.status) {
        formData.append('status', style.status)
      }

      if (style.notes) {
        formData.append('notes', style.notes)
      }

      if (style.measurements && Object.keys(style.measurements).length > 0) {
        formData.append('measurements', JSON.stringify(style.measurements))
      }

      // Add multiple image files
      imageFiles.forEach((file, index) => {
        formData.append(`image_${index}`, file)
      })
      formData.append('imageCount', imageFiles.length.toString())

      updateData = formData
    } else {
      // Regular JSON update
      updateData = {
        name: style.name,
        description: style.description,
        type: style.type,
        category: style.category,
        status: style.status,
        notes: style.notes,
        measurements: style.measurements,
      }
    }

    // Update the style using the API
    const result = await $fetch(`/api/styles/${style.id}`, {
      method: 'PUT',
      body: updateData,
    })

    if (result.success) {
      closeEditSlideover()
      // Refresh the styles list
      await refreshStyles()

      useToast().add({
        title: 'Style updated',
        description: 'The style has been successfully updated.',
        color: 'success',
      })
    } else {
      throw new Error((result as any).message || 'Failed to update style')
    }
  } catch (error) {
    console.error('Failed to update style:', error)
    useToast().add({
      title: 'Error',
      description: 'Failed to update style. Please try again.',
      color: 'error',
    })
  } finally {
    isSavingStyle.value = false
  }
}

const deleteStyle = async (style: Style | null) => {
  if (!style) return

  try {
    isDeleting.value = true

    // Delete the style using the API
    const success = await _deleteStyleApi(style.id)

    if (success) {
      showDeleteModal.value = false
      styleToDelete.value = null
      // Refresh the styles list
      await refreshStyles()

      useToast().add({
        title: 'Style deleted',
        description: 'The style has been successfully deleted.',
        color: 'success',
      })
    } else {
      throw new Error('Failed to delete style')
    }
  } catch (error) {
    console.error('Failed to delete style:', error)
    useToast().add({
      title: 'Error',
      description: 'Failed to delete style. Please try again.',
      color: 'error',
    })
  } finally {
    isDeleting.value = false
  }
}

const handleStyleAdded = async (style: Style) => {
  // Close the add slideover
  showAddSlideover.value = false

  // Refresh the styles list
  await refreshStyles()

  // Open the detail slideover for the newly created style
  await openDetailSlideover(style)
}
</script>
