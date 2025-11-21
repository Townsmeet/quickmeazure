<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="mb-2">
      <h1 class="text-2xl font-semibold text-gray-900">Activity Log</h1>
      <p class="mt-1 text-sm text-gray-500">Track all actions performed in your account.</p>
    </div>

    <!-- Filter Card -->
    <UCard class="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm">
      <div class="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-end sm:gap-4">
        <UFormField label="Activity Type" class="w-full sm:w-1/3">
          <USelect
            v-model="filters.type"
            :items="activityTypeOptions"
            placeholder="All types"
            size="lg"
            class="w-full"
            clearable
          />
        </UFormField>

        <div class="w-full sm:w-2/5">
          <label class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
          <div class="flex items-center">
            <UInput
              v-model="filters.startDate"
              type="date"
              size="lg"
              placeholder="Start date"
              class="w-[45%]"
            />
            <span class="px-2 text-gray-500 font-medium">to</span>
            <UInput
              v-model="filters.endDate"
              type="date"
              size="lg"
              placeholder="End date"
              class="w-[45%]"
            />
          </div>
        </div>

        <div class="flex gap-2 mt-2 sm:mt-0">
          <UButton
color="primary"
size="lg"
icon="i-heroicons-funnel"
@click="fetchActivity">
            Apply
          </UButton>
          <UButton
            color="neutral"
            variant="subtle"
            size="lg"
            icon="i-heroicons-arrow-path"
            @click="resetFilters"
          >
            Reset
          </UButton>
        </div>
      </div>
    </UCard>

    <UCard class="bg-white">
      <div v-if="isLoading" class="space-y-4">
        <ActivityCardSkeleton v-for="i in 5" :key="i" />
      </div>

      <div v-else-if="error" class="text-center py-12">
        <UIcon name="i-heroicons-exclamation-triangle" class="mx-auto h-12 w-12 text-amber-400" />
        <h3 class="mt-2 text-sm font-semibold text-gray-900">Error loading activity data</h3>
        <p class="mt-1 text-sm text-gray-500">{{ error }}</p>
        <UButton
color="primary"
size="lg"
class="mt-4"
@click="fetchActivity"> Try Again </UButton>
      </div>

      <EmptyState
        v-else-if="activities.length === 0"
        icon="i-heroicons-document-magnifying-glass"
        title="No activity found"
        description="Try changing your filters or check back later."
      />

      <template v-else>
        <ul class="divide-y divide-gray-200">
          <li
            v-for="activity in activities"
            :key="activity.id"
            class="py-4 px-2 hover:bg-gray-50 transition duration-150"
          >
            <div class="flex items-start space-x-4">
              <div class="flex-shrink-0">
                <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <UIcon
                    :name="activity.icon || getActivityIcon(activity.type)"
                    class="text-primary-600"
                  />
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <!-- eslint-disable-next-line vue/no-v-html -->
                <p class="text-sm font-medium text-gray-900" v-html="activity.message" />
                <div class="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                  <div class="flex items-center">
                    <UIcon name="i-heroicons-clock" class="mr-1 h-4 w-4 text-gray-400" />
                    <span>{{ formatDateTime(activity.time || activity.timestamp) }}</span>
                  </div>
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="getActivityTypeClass(activity.type)"
                  >
                    {{ formatActivityType(activity.type) }}
                  </span>
                  <span v-if="activity.entity" class="text-xs text-gray-500">
                    {{ activity.entity }}
                  </span>
                </div>
              </div>
            </div>
          </li>
        </ul>

        <div class="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p class="text-sm text-gray-500">
            Showing {{ activities.length }} {{ totalCount ? `of ${totalCount}` : '' }} activities
          </p>
          <UPagination
            v-if="totalPages > 1"
            v-model="page"
            :total="totalPages"
            :ui="{ base: 'rounded-lg' }"
            @update:model-value="handlePageChange"
          />
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format, parseISO } from 'date-fns'
import ActivityCardSkeleton from '~/components/skeleton/ClientCardSkeleton.vue'
import EmptyState from '~/components/common/EmptyState.vue'

definePageMeta({
  layout: 'dashboard',
  middleware: 'setup-required',
})

// Set page metadata
useHead({
  title: 'Activity Log',
})

// Use activity composable
const {
  activities,
  isLoading,
  error,
  totalCount,
  currentPage,
  totalPages,
  perPage,
  fetchActivity: fetchActivityData,
  setPage,
} = useActivity()

// Local page ref for v-model binding (computed to sync with composable)
const page = computed({
  get: () => currentPage.value,
  set: (value: number) => {
    setPage(value)
  },
})

// Filter options
const activityTypeOptions = [
  { label: 'Client', value: 'client' },
  { label: 'Order', value: 'order' },
  { label: 'Payment', value: 'payment' },
  { label: 'Style', value: 'style' },
  { label: 'Measurement', value: 'measurement' },
  { label: 'User', value: 'user' },
  { label: 'System', value: 'system' },
]

// Filters
const filters = reactive({
  type: null as string | null,
  startDate: null as string | null,
  endDate: null as string | null,
})

// Reset filters
const resetFilters = () => {
  filters.type = null
  filters.startDate = null
  filters.endDate = null
  setPage(1)
  fetchActivity()
}

// Handle page change from pagination
const handlePageChange = (newPage: number) => {
  setPage(newPage)
  fetchActivity()
}

// Format date and time
const formatDateTime = timestamp => {
  if (!timestamp) return 'Unknown date'

  try {
    // If it's already a relative time string like "2 hours ago", return it as is
    if (
      typeof timestamp === 'string' &&
      (timestamp.includes('ago') || timestamp.includes('now') || timestamp.includes('Yesterday'))
    ) {
      return timestamp
    }

    // Try to parse the date in different formats
    let date
    if (typeof timestamp === 'string') {
      try {
        // Try ISO format first
        date = parseISO(timestamp)
        // Check if date is valid
        if (isNaN(date.getTime())) {
          // If not valid, try as regular date string
          date = new Date(timestamp)
        }
      } catch {
        // If parsing fails, try as regular date string
        date = new Date(timestamp)
      }
    } else {
      // If it's already a date object or timestamp
      date = new Date(timestamp)
    }

    // Check if the date is valid before formatting
    if (!isNaN(date.getTime())) {
      return format(date, 'MMM d, yyyy h:mm a')
    } else {
      // If all parsing attempts failed, return the original string
      return typeof timestamp === 'string' ? timestamp : 'Invalid date'
    }
  } catch (err) {
    console.error('Error in date formatting:', err)
    // Return the original timestamp as fallback
    return typeof timestamp === 'string' ? timestamp : 'Invalid date'
  }
}

// Format activity type for display
const formatActivityType = (type: string) => {
  if (!type) return 'Unknown'

  // Capitalize first letter
  return type.charAt(0).toUpperCase() + type.slice(1)
}

// Get icon for activity type
const getActivityIcon = (type: string) => {
  const icons = {
    client: 'i-heroicons-user',
    order: 'i-heroicons-shopping-bag',
    payment: 'i-heroicons-currency-dollar',
    style: 'i-heroicons-scissors',
    measurement: 'i-heroicons-ruler',
    user: 'i-heroicons-user-circle',
    system: 'i-heroicons-cog-6-tooth',
    default: 'i-heroicons-bell',
  }

  return icons[type] || icons.default
}

// Get class for activity type badge
const getActivityTypeClass = (type: string) => {
  const baseType = type?.toLowerCase() || 'default'

  const classes = {
    client: 'bg-blue-100 text-blue-800',
    order: 'bg-purple-100 text-purple-800',
    payment: 'bg-green-100 text-green-800',
    style: 'bg-pink-100 text-pink-800',
    measurement: 'bg-yellow-100 text-yellow-800',
    user: 'bg-indigo-100 text-indigo-800',
    system: 'bg-gray-100 text-gray-800',
    default: 'bg-gray-100 text-gray-800',
  }

  return classes[baseType] || classes.default
}

// Fetch activity data
const fetchActivity = async () => {
  const response = await fetchActivityData({
    page: page.value,
    perPage: perPage.value,
    filters: {
      type: filters.type,
      startDate: filters.startDate,
      endDate: filters.endDate,
    },
  })

  // If current page is greater than total pages and total pages > 0, reset to page 1
  if (response.success && page.value > totalPages.value && totalPages.value > 0) {
    setPage(1)
    await fetchActivityData({
      page: 1,
      perPage: perPage.value,
      filters: {
        type: filters.type,
        startDate: filters.startDate,
        endDate: filters.endDate,
      },
    })
  }
}

// Load activity data on component mount
onMounted(() => {
  fetchActivity()
})
</script>
