<template>
  <USlideover
    :open="isOpen"
    title="Style Details"
    side="right"
    @update:open="value => !value && $emit('close')"
  >
    <template #body>
      <div v-if="style" class="space-y-6">
        <!-- Style Header -->
        <div class="flex items-center space-x-4 pb-6 border-b border-gray-200">
          <div class="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            <img
              v-if="currentImageUrl"
              :src="currentImageUrl"
              :alt="style.name"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
              <UIcon name="i-heroicons-photo" class="w-8 h-8" />
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-xl font-semibold text-gray-900 truncate">{{ style.name }}</h3>
            <div class="flex items-center space-x-2 mt-1">
              <UBadge :color="getStatusColor(style.status)" variant="soft">
                {{ formatStatus(style.status) }}
              </UBadge>
              <span v-if="style.itemCount" class="text-sm text-gray-500">
                {{ style.itemCount }} {{ style.itemCount === 1 ? 'item' : 'items' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Image Gallery -->
        <div v-if="imageUrls.length > 0" class="space-y-4">
          <h4 class="text-lg font-medium text-gray-900">Images</h4>
          <div class="space-y-4">
            <!-- Main Image -->
            <div class="w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
              <img :src="currentImageUrl" :alt="style.name" class="w-full h-full object-cover" />
            </div>

            <!-- Image Thumbnails -->
            <div v-if="imageUrls.length > 1" class="flex gap-2 overflow-x-auto pb-2">
              <button
                v-for="(imageUrl, index) in imageUrls"
                :key="index"
                class="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border-2 transition-colors"
                :class="
                  currentImageIndex === index
                    ? 'border-primary-500'
                    : 'border-transparent hover:border-gray-300'
                "
                @click="currentImageIndex = index"
              >
                <img
                  :src="imageUrl"
                  :alt="`${style.name} ${index + 1}`"
                  class="w-full h-full object-cover"
                />
              </button>
            </div>

            <!-- Navigation Arrows -->
            <div v-if="imageUrls.length > 1" class="flex justify-center gap-2">
              <UButton
                color="neutral"
                variant="outline"
                size="sm"
                icon="i-heroicons-chevron-left"
                :disabled="currentImageIndex === 0"
                @click="previousImage"
              />
              <span class="flex items-center text-sm text-gray-500">
                {{ currentImageIndex + 1 }} / {{ imageUrls.length }}
              </span>
              <UButton
                color="neutral"
                variant="outline"
                size="sm"
                icon="i-heroicons-chevron-right"
                :disabled="currentImageIndex === imageUrls.length - 1"
                @click="nextImage"
              />
            </div>
          </div>
        </div>

        <!-- Description -->
        <div v-if="style.description" class="space-y-4">
          <h4 class="text-lg font-medium text-gray-900">Description</h4>
          <div class="p-4 bg-gray-50 rounded-lg">
            <p class="text-sm text-gray-700">{{ style.description }}</p>
          </div>
        </div>

        <!-- Style Information -->
        <div class="space-y-4">
          <h4 class="text-lg font-medium text-gray-900">Style Information</h4>
          <div class="space-y-3">
            <div v-if="style.type" class="flex items-center text-sm">
              <UIcon name="i-heroicons-tag" class="w-5 h-5 mr-3 text-gray-400" />
              <span class="text-gray-600">Type:</span>
              <span class="text-gray-900 ml-2 capitalize">{{ style.type }}</span>
            </div>
            <div v-if="style.category" class="flex items-center text-sm">
              <UIcon name="i-heroicons-folder" class="w-5 h-5 mr-3 text-gray-400" />
              <span class="text-gray-600">Category:</span>
              <span class="text-gray-900 ml-2 capitalize">{{ style.category }}</span>
            </div>
            <div class="flex items-center text-sm">
              <UIcon name="i-heroicons-calendar" class="w-5 h-5 mr-3 text-gray-400" />
              <span class="text-gray-600">Created:</span>
              <span class="text-gray-900 ml-2">{{ formatDate(style.createdAt) }}</span>
            </div>
            <div v-if="style.updatedAt" class="flex items-center text-sm">
              <UIcon name="i-heroicons-clock" class="w-5 h-5 mr-3 text-gray-400" />
              <span class="text-gray-600">Last Updated:</span>
              <span class="text-gray-900 ml-2">{{ formatDate(style.updatedAt) }}</span>
            </div>
          </div>
        </div>

        <!-- Related Orders -->
        <div v-if="relatedOrders && relatedOrders.length > 0" class="space-y-4">
          <h4 class="text-lg font-medium text-gray-900">Related Orders</h4>
          <div class="space-y-3">
            <div
              v-for="order in relatedOrders"
              :key="order.id"
              class="p-3 bg-gray-50 rounded-lg flex items-center justify-between"
            >
              <div>
                <div class="text-sm font-medium text-gray-900">{{ order.clientName }}</div>
                <div class="text-xs text-gray-500">
                  Order #{{ order.id }} • {{ formatDate(order.createdAt) }}
                </div>
              </div>
              <div class="text-right">
                <UBadge :color="getOrderStatusColor(order.status)" variant="soft" size="xs">
                  {{ formatStatus(order.status) }}
                </UBadge>
                <div class="text-sm font-medium text-gray-900 mt-1">
                  ₦{{ (order.totalAmount || 0).toLocaleString() }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end space-x-3">
        <UButton color="neutral" variant="outline" @click="$emit('close')"> Close </UButton>
        <UButton color="primary" @click="style && $emit('edit', style)"> Edit Style </UButton>
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import type { Style } from '~/types/style'
import dayjs from 'dayjs'

interface Props {
  isOpen: boolean
  style: Style | null
  relatedOrders?: Array<{
    id: number
    clientName: string
    createdAt: string | number
    status: string
    totalAmount?: number
  }>
}

interface Emits {
  (e: 'close'): void
  (e: 'edit', style: Style): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

// Image gallery state
const currentImageIndex = ref(0)

// Computed properties for images
const imageUrls = computed(() => {
  if (!props.style) return []

  // Check if style has imageUrls array (new format)
  if (props.style.imageUrls && Array.isArray(props.style.imageUrls)) {
    return props.style.imageUrls
  }

  // Fallback to single imageUrl (backward compatibility)
  if (props.style.imageUrl) {
    return [props.style.imageUrl]
  }

  return []
})

const currentImageUrl = computed(() => {
  return imageUrls.value[currentImageIndex.value] || undefined
})

// Image navigation methods
const nextImage = () => {
  if (currentImageIndex.value < imageUrls.value.length - 1) {
    currentImageIndex.value++
  }
}

const previousImage = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
  }
}

// Reset image index when style changes
watch(
  () => props.style,
  () => {
    currentImageIndex.value = 0
  }
)

const formatDate = (dateString: string | Date | number) => {
  let date: Date

  if (typeof dateString === 'number') {
    // Handle Unix timestamp (seconds)
    date = new Date(dateString * 1000)
  } else {
    date = new Date(dateString)
  }

  return dayjs(date).format('MMMM D, YYYY')
}

const formatStatus = (status: string | undefined) => {
  if (!status) return 'Unknown'
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

const getOrderStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'success'
    case 'in_progress':
    case 'pending':
      return 'warning'
    case 'cancelled':
      return 'error'
    default:
      return 'neutral'
  }
}
</script>
