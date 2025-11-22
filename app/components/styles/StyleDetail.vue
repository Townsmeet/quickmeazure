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
        <div class="pb-4 border-b border-gray-200">
          <h3 class="text-2xl font-semibold text-gray-900 dark:text-white truncate">
            {{ style.name }}
          </h3>
        </div>

        <!-- Image Gallery -->
        <div v-if="imageUrls.length > 0" class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-lg font-medium text-gray-900 dark:text-white">Images</h4>
            <span class="text-sm text-gray-500">{{ imageUrls.length }} total</span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div
              v-for="(imageUrl, index) in imageUrls"
              :key="`${imageUrl}-${index}`"
              class="w-full h-32 sm:h-40 lg:h-48 bg-gray-100 rounded-lg overflow-hidden"
            >
              <img
                :src="imageUrl"
                :alt="`${style.name} image ${index + 1}`"
                class="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        <!-- Description -->
        <div v-if="style.description" class="space-y-4">
          <h4 class="text-lg font-medium text-gray-900 dark:text-white">Description</h4>
          <div class="p-4 bg-gray-50 dark:bg-gray-900/40 rounded-lg">
            <p class="text-sm text-gray-700 dark:text-gray-200">{{ style.description }}</p>
          </div>
        </div>

        <!-- Style Information -->
        <div class="space-y-4">
          <h4 class="text-lg font-medium text-gray-900 dark:text-white">Style Information</h4>
          <div class="space-y-3">
            <div v-if="style.type" class="flex items-center text-sm">
              <UIcon name="i-heroicons-tag" class="w-5 h-5 mr-3 text-gray-400" />
              <span class="text-gray-600 dark:text-gray-300">Type:</span>
              <span class="text-gray-900 dark:text-white ml-2 capitalize">{{ style.type }}</span>
            </div>
            <div v-if="style.category" class="flex items-center text-sm">
              <UIcon name="i-heroicons-folder" class="w-5 h-5 mr-3 text-gray-400" />
              <span class="text-gray-600 dark:text-gray-300">Category:</span>
              <span class="text-gray-900 dark:text-white ml-2 capitalize">{{
                style.category
              }}</span>
            </div>
            <div class="flex items-center text-sm">
              <UIcon name="i-heroicons-calendar" class="w-5 h-5 mr-3 text-gray-400" />
              <span class="text-gray-600 dark:text-gray-300">Created:</span>
              <span class="text-gray-900 dark:text-white ml-2">{{
                formatDate(style.createdAt)
              }}</span>
            </div>
            <div v-if="style.updatedAt" class="flex items-center text-sm">
              <UIcon name="i-heroicons-clock" class="w-5 h-5 mr-3 text-gray-400" />
              <span class="text-gray-600 dark:text-gray-300">Last Updated:</span>
              <span class="text-gray-900 dark:text-white ml-2">{{
                formatDate(style.updatedAt)
              }}</span>
            </div>
          </div>
        </div>

        <!-- Related Orders -->
        <div v-if="relatedOrders && relatedOrders.length > 0" class="space-y-4">
          <h4 class="text-lg font-medium text-gray-900 dark:text-white">Related Orders</h4>
          <div class="space-y-3">
            <div
              v-for="order in relatedOrders"
              :key="order.id"
              class="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-lg flex items-center justify-between"
            >
              <div>
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ order.clientName }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  Order #{{ order.id }} — {{ formatDate(order.createdAt) }}
                </div>
              </div>
              <div class="text-right">
                <UBadge :color="getOrderStatusColor(order.status)" variant="soft" size="xs">
                  {{ formatStatus(order.status) }}
                </UBadge>
                <div class="text-sm font-medium text-gray-900 dark:text-white mt-1">
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

// Computed properties for images
const imageUrls = computed(() => {
  if (!props.style) return []

  const urls = new Set<string>()

  parseImageUrls(props.style.imageUrls).forEach(url => urls.add(url))

  if (typeof props.style.imageUrl === 'string' && props.style.imageUrl.trim()) {
    urls.add(props.style.imageUrl.trim())
  }

  return Array.from(urls)
})

// const currentImageUrl = computed(() => imageUrls.value[0])

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

// const getStatusColor = (status: string | undefined) => {
//   switch (status) {
//     case 'active':
//       return 'success'
//     case 'draft':
//       return 'warning'
//     case 'archived':
//     case 'inactive':
//       return 'neutral'
//     default:
//       return 'neutral'
//   }
// }

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

function parseImageUrls(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string' && !!item.trim())
      .map(item => item.trim())
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []

    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed)
        return parseImageUrls(parsed)
      } catch {
        // ignore parse errors
      }
    }

    if (trimmed.includes(',')) {
      return trimmed
        .split(',')
        .map(part => part.trim())
        .filter(Boolean)
    }

    return [trimmed]
  }

  return []
}
</script>
