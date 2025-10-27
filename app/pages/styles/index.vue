<template>
  <div class="min-h-screen">
    <div class="max-w-7xl mx-auto pb-20 md:pb-6">
      <!-- Header Section -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Styles</h1>
          </div>
          <div class="flex gap-3">
            <UButton
              icon="i-heroicons-plus"
              color="primary"
              size="lg"
              @click="showAddSlideover = true"
            >
              Add Style
            </UButton>
          </div>
        </div>

        <!-- Stats -->
        <div class="mt-6 flex flex-wrap items-center gap-6">
          <div class="flex items-center">
            <div class="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span class="text-sm font-medium text-gray-700">{{ filteredStyles.length }} Total</span>
          </div>
          <div class="flex items-center">
            <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span class="text-sm font-medium text-gray-700">{{ activeStylesCount }} Styles</span>
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

      <!-- Style Cards -->
      <div v-if="!isLoading">
        <div
          v-if="paginatedStyles.length > 0"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <div
            v-for="style in paginatedStyles"
            :key="style.id"
            class="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-primary-200 h-96 flex flex-col"
          >
            <!-- Image Section -->
            <div class="relative cursor-pointer" @click="openDetailSlideover(style as Style)">
              <!-- Single Image -->
              <div v-if="getImageCount(style) === 1" class="relative h-80">
                <img
                  v-if="getFirstImageUrl(style)"
                  :src="getFirstImageUrl(style)"
                  :alt="style.name"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div v-else class="w-full h-full bg-gray-100 flex items-center justify-center">
                  <UIcon name="i-heroicons-photo" class="w-12 h-12 text-gray-400" />
                </div>
              </div>

              <!-- Multiple Images with Carousel -->
              <div
                v-else-if="getImageCount(style) > 1"
                class="relative h-80 carousel-container overflow-hidden"
              >
                <div class="h-80 w-full overflow-hidden">
                  <UCarousel
                    v-if="getAllImageUrls(style).length > 0"
                    v-slot="{ item }"
                    :items="getAllImageUrls(style)"
                    arrows
                    dots
                    loop
                    auto-play
                    class="w-full h-80"
                    :prev="{ size: 'xs', color: 'neutral', variant: 'solid' }"
                    :next="{ size: 'xs', color: 'neutral', variant: 'solid' }"
                    :ui="{
                      root: 'h-80 max-h-80',
                      viewport: 'h-80 max-h-80 overflow-hidden',
                      container: 'h-80 max-h-80',
                      item: 'h-80 max-h-80',
                      prev: 'absolute top-1/2 left-2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg',
                      next: 'absolute top-1/2 right-2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg',
                      dots: 'absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity',
                      dot: 'w-2 h-2 bg-white/60 hover:bg-white',
                    }"
                  >
                    <img
                      :src="item"
                      :alt="style.name"
                      class="w-full h-80 max-h-80 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </UCarousel>
                </div>

                <!-- Multiple images indicator -->
                <div
                  class="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm"
                >
                  <UIcon name="i-heroicons-photo" class="w-3 h-3" />
                  {{ getImageCount(style) }}
                </div>
              </div>

              <!-- No Image -->
              <div v-else class="w-full h-80 bg-gray-100 flex items-center justify-center">
                <UIcon name="i-heroicons-photo" class="w-12 h-12 text-gray-400" />
              </div>

              <!-- Hover Overlay -->
              <div
                class="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              ></div>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-between p-4 border-t border-gray-100">
              <span class="text-sm font-medium text-gray-900 truncate flex-1 mr-3">
                {{ style.name }}
              </span>

              <!-- Actions Menu -->
              <UDropdownMenu :items="getStyleActions(style as Style)">
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-heroicons-ellipsis-horizontal"
                  size="xs"
                  class="opacity-60 hover:opacity-100 transition-opacity"
                  @click.stop
                />
              </UDropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-20">
        <div
          class="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-8"
        >
          <UIcon name="i-heroicons-swatch" class="w-16 h-16 text-gray-400" />
        </div>
        <h3 class="text-2xl font-bold text-gray-900 mb-3">
          {{ hasActiveFilters ? 'No styles found' : 'No styles yet' }}
        </h3>
        <p class="text-gray-600 mb-8 max-w-md mx-auto text-lg">
          {{
            hasActiveFilters
              ? "Try adjusting your search or filters to find what you're looking for."
              : 'Get started by adding your first style to showcase your designs.'
          }}
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <UButton
            v-if="hasActiveFilters"
            color="neutral"
            variant="outline"
            icon="i-heroicons-x-mark"
            size="lg"
            @click="resetFilters"
          >
            Clear Filters
          </UButton>
          <UButton
            icon="i-heroicons-plus"
            color="primary"
            size="lg"
            class="shadow-lg"
            @click="showAddSlideover = true"
          >
            Add Your First Style
          </UButton>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="filteredStyles.length > itemsPerPage"
        class="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div class="text-sm text-gray-600 text-center sm:text-left">
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
      <!-- Loading State -->
      <div v-else class="flex items-center justify-center py-20">
        <div class="text-center">
          <div
            class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-primary-600" />
          </div>
          <p class="text-gray-600 text-lg font-medium">Loading your styles...</p>
        </div>
      </div>
    </div>

    <!-- Style Detail Component -->
    <StyleDetail
      :is-open="showDetailSlideover"
      :style="selectedStyle"
      :related-orders="relatedOrders"
      @close="showDetailSlideover = false"
      @edit="openEditSlideover"
    />

    <!-- Style Edit Component -->
    <StyleEdit
      :is-open="showEditSlideover"
      :style="selectedStyle"
      @close="showEditSlideover = false"
      @save="saveStyle"
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
import type { Style } from '~/types/style'
import dayjs from 'dayjs'

definePageMeta({
  middleware: ['auth', 'setup-required'],
  layout: 'dashboard',
})

// Use the styles composable
const {
  styles,
  isLoading,
  getStyle,
  updateStyle,
  deleteStyle: _deleteStyleApi,
  refreshStyles,
} = useStyles()

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

const activeStylesCount = computed(() => {
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

const getStyleActions = (style: Style) => [
  [
    {
      label: 'View Details',
      icon: 'i-heroicons-eye',
      onSelect: () => openDetailSlideover(style),
    },
    {
      label: 'Edit Style',
      icon: 'i-heroicons-pencil',
      onSelect: () => openEditSlideover(style),
    },
  ],
  [
    {
      label: 'Delete',
      icon: 'i-heroicons-trash',
      color: 'error' as const,
      onSelect: () => confirmDelete(style),
    },
  ],
]

const openDetailSlideover = async (style: Style) => {
  try {
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

const confirmDelete = (style: Style) => {
  styleToDelete.value = style
  showDeleteModal.value = true
}

const saveStyle = async (style: Style, imageFiles?: File[]) => {
  if (!style) return

  try {
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
      showEditSlideover.value = false
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

// Helper functions for multiple images
const getFirstImageUrl = (style: any) => {
  if (style.imageUrls && Array.isArray(style.imageUrls) && style.imageUrls.length > 0) {
    return style.imageUrls[0]
  }
  return style.imageUrl || null
}

const getAllImageUrls = (style: any): string[] => {
  if (style.imageUrls && Array.isArray(style.imageUrls) && style.imageUrls.length > 0) {
    return style.imageUrls.filter((url: any) => url && typeof url === 'string')
  }
  return style.imageUrl && typeof style.imageUrl === 'string' ? [style.imageUrl] : []
}

const getImageCount = (style: any) => {
  if (style.imageUrls && Array.isArray(style.imageUrls)) {
    return style.imageUrls.length
  }
  return style.imageUrl ? 1 : 0
}

const formatStatus = (status: string | undefined) => {
  if (!status) return 'Draft'
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const getStatusColor = (status: string | undefined) => {
  switch (status) {
    case 'active':
      return 'success'
    case 'draft':
      return 'warning'
    case 'archived':
    case 'inactive':
      return 'neutral'
    default:
      return 'neutral'
  }
}

const formatDate = (dateString: string | Date | number) => {
  let date: Date

  if (typeof dateString === 'number') {
    // Handle Unix timestamp (seconds)
    date = new Date(dateString * 1000)
  } else {
    date = new Date(dateString)
  }

  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) return 'today'
  if (diffInDays === 1) return 'yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`

  return dayjs(date).format('MMM D, YYYY')
}
</script>

<style scoped>
/* Smooth image loading */
img {
  transition: opacity 0.3s ease;
}

img[src=''] {
  opacity: 0;
}

/* Ensure carousel doesn't overflow */
.carousel-container {
  height: 320px !important;
  max-height: 320px !important;
  overflow: hidden !important;
}

/* Force carousel components to respect height */
:deep(.carousel-container *) {
  max-height: 320px !important;
}
</style>
