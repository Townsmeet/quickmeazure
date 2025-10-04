<template>
  <div class="space-y-8">
    <!-- Header with back button and title -->
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <UButton
          icon="i-heroicons-arrow-left"
          color="gray"
          variant="ghost"
          :to="STYLES_PATH"
          class="mr-3"
        />
        <h1 class="text-2xl font-bold text-gray-800">Style Details</h1>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400" />
    </div>

    <!-- Error state -->
    <UAlert v-else-if="error" color="red" icon="i-heroicons-exclamation-triangle">
      <p>{{ error }}</p>
      <UButton
color="red"
variant="link"
to="/styles"
class="mt-2"> Return to Styles </UButton>
    </UAlert>

    <!-- Style details -->
    <div v-else-if="style" class="grid grid-cols-1 gap-6">
      <!-- Combined card with image, name and description -->
      <UCard class="bg-white shadow-md">
        <template #header>
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold text-gray-800">
              {{ style.name }}
            </h2>
            <UBadge color="primary" variant="subtle"> Style </UBadge>
          </div>
        </template>

        <div class="flex flex-col md:flex-row gap-6">
          <!-- Left side: Image -->
          <div class="w-full md:w-1/3">
            <div class="aspect-w-3 aspect-h-4 bg-gray-100 rounded-md overflow-hidden">
              <img
                v-if="style.imageUrl"
                :src="style.imageUrl"
                :alt="style.name"
                class="w-full h-full object-contain rounded-md p-2"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200"
              >
                <UIcon name="i-heroicons-squares-2x2" class="text-gray-400 text-5xl" />
              </div>
            </div>
          </div>

          <!-- Right side: Details -->
          <div class="w-full md:w-2/3 space-y-4">
            <div>
              <h3 class="text-sm font-medium text-gray-500 mb-1">Description</h3>
              <p v-if="style.description" class="text-gray-700">
                {{ style.description }}
              </p>
              <p v-else class="text-gray-400 italic">No description provided</p>
            </div>

            <div v-if="style.notes" class="border-t border-gray-100 pt-3">
              <h3 class="text-sm font-medium text-gray-500 mb-1">Notes</h3>
              <p class="text-gray-700">
                {{ style.notes }}
              </p>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-between items-center">
            <div class="flex items-center text-sm text-gray-500">
              <UIcon name="i-heroicons-calendar" class="mr-1" />
              <span>Added {{ formatDate(style.createdAt) }}</span>
            </div>

            <div class="flex space-x-2">
              <UButton
                color="primary"
                variant="outline"
                icon="i-heroicons-pencil"
                :to="getEditStylePath(style.id)"
                :disabled="isLoading"
              />
              <UButton
                color="error"
                variant="outline"
                icon="i-heroicons-trash"
                :disabled="isLoading || isDeleting"
                @click="confirmDelete = true"
              />
            </div>
          </div>
        </template>
      </UCard>

      <!-- Related orders -->
      <UCard class="bg-white shadow-md">
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-medium">Related Orders</h3>
            <UBadge color="gray" variant="subtle">
              {{ relatedOrders?.length || 0 }}
            </UBadge>
          </div>
        </template>

        <div v-if="relatedOrders && relatedOrders.length > 0">
          <UTable
            :columns="[
              { key: 'client', label: 'Client', id: 'client' },
              { key: 'date', label: 'Order Date', id: 'date' },
              { key: 'status', label: 'Status', id: 'status' },
              { key: 'actions', label: '', id: 'actions' },
            ]"
            :rows="relatedOrders"
            :ui="{
              td: {
                padding: 'py-2 px-3',
              },
            }"
          >
            <template #client-data="{ row }">
              <div class="flex items-center">
                <div
                  class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-2"
                >
                  <span class="text-primary-700 font-medium text-sm">{{
                    getInitials(row.clientName)
                  }}</span>
                </div>
                <div>
                  <div class="font-medium text-gray-900 text-sm">
                    {{ row.clientName }}
                  </div>
                </div>
              </div>
            </template>

            <template #date-data="{ row }">
              <div class="text-sm text-gray-600">
                {{ formatDate(row.createdAt) }}
              </div>
            </template>

            <template #status-data="{ row }">
              <UBadge :color="getStatusColor(row.status)" variant="subtle" size="sm">
                {{ row.status }}
              </UBadge>
            </template>

            <template #actions-data="{ row }">
              <UButton
                icon="i-heroicons-eye"
                color="gray"
                variant="ghost"
                size="xs"
                :to="`/orders/${row.id}/detail`"
              />
            </template>
          </UTable>
        </div>

        <div v-else class="text-center py-6">
          <UIcon name="i-heroicons-shopping-bag" class="mx-auto h-10 w-10 text-gray-300" />
          <h3 class="mt-2 text-sm font-medium text-gray-900">No Orders Yet</h3>
          <p class="mt-1 text-sm text-gray-500">This style hasn't been used in any orders yet.</p>
          <UButton
to="/orders/new"
color="primary"
variant="outline"
class="mt-4"
size="sm">
            Create Order
          </UButton>
        </div>
      </UCard>
    </div>

    <!-- Delete Confirmation Modal -->
    <DeleteModal
      v-model="confirmDelete"
      title="Delete Style"
      :message="`Are you sure you want to delete <strong>${style?.name}</strong>? This action cannot be undone and will permanently remove this style from your catalog.`"
      :loading="isDeleting"
      @confirm="deleteStyle"
    />
  </div>
</template>

<script setup lang="ts">
// Router and utilities
import { useRouter, useRoute } from 'vue-router'

// Stores and composables
import { useAuthStore } from '~/store/modules/auth'
import { useStyleStore } from '~/store/modules/style'
// No need to import useStyleApi anymore

// Types
import type { Style } from '~/types/style'

// Router and route
const router = useRouter()
const route = useRoute()

// Composable, stores, and API
const routes = useAppRoutes()
const authStore = useAuthStore()
const styleStore = useStyleStore()
const toast = useToast()

// Constants
const STYLES_PATH = routes.ROUTE_PATHS[routes.ROUTE_NAMES.DASHBOARD.STYLES.INDEX] as string
const getEditStylePath = (id: string): string =>
  (
    routes.ROUTE_PATHS[routes.ROUTE_NAMES.DASHBOARD.STYLES.EDIT] as (params: {
      id: string
    }) => string
  )({ id })

// Set page metadata
useHead({
  title: 'Style Details',
})

// Types
interface Order {
  id: string
  clientName: string
  status: string
  createdAt: string
  // Add other order properties as needed
}

// State
const style = ref<Style | null>(null)
const relatedOrders = ref<Order[]>([])
const isLoading = ref(true)
const isDeleting = ref(false)
const error = ref<string | null>(null)
const confirmDelete = ref(false)

// Fetch style data
const fetchStyleData = async () => {
  try {
    const styleId = route.params.id as string
    if (!styleId) {
      error.value = 'Style ID is required'
      return
    }

    isLoading.value = true
    error.value = null

    // Check if user is authenticated
    if (!authStore.isLoggedIn) {
      error.value = 'Authentication required. Please log in.'
      navigateTo('/auth/login')
      return
    }

    // Fetch style data using direct fetch
    const { data, error: fetchError } = await useAsyncData(`style-${styleId}`, () =>
      $fetch(`/api/styles/${styleId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(authStore.token && { Authorization: `Bearer ${authStore.token}` }),
        },
      })
    )

    if (fetchError.value) {
      throw new Error(fetchError.value?.data?.message || 'Failed to fetch style')
    }

    if (data.value) {
      style.value = data.value

      // Update the style in the store for consistency
      styleStore.currentStyle = data.value

      // Fetch related orders (still using direct API call for now)
      try {
        const relatedOrdersData = await $fetch(`/api/orders?styleId=${styleId}`, {
          headers: {
            ...(authStore.token && { Authorization: `Bearer ${authStore.token}` }),
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })
        relatedOrders.value = relatedOrdersData || []
      } catch (err) {
        console.error('Error fetching related orders:', err)
        // Don't fail the whole page if orders fail to load
      }
    } else {
      error.value = 'Style not found'
      toast.add({
        title: 'Error',
        description: error.value,
        color: 'error',
      })
    }
  } catch (err: any) {
    console.error('Error in style detail page:', err)
    error.value = 'An unexpected error occurred while loading style details'
    toast.add({
      title: 'Error',
      description: error.value,
      color: 'error',
    })
  } finally {
    isLoading.value = false
  }
}

// Initial data fetch
onMounted(fetchStyleData)

// Refresh data when route changes
watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      fetchStyleData()
    }
  }
)

// Format date for display
const formatDate = dateString => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(date)
}

// Get initials from a name
const getInitials = name => {
  if (!name) return '?'
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

// Get color based on order status
const getStatusColor = status => {
  const statusColors = {
    pending: 'yellow',
    'in-progress': 'blue',
    completed: 'green',
    cancelled: 'red',
  }

  return statusColors[status?.toLowerCase()] || 'gray'
}

// Delete style
const deleteStyle = async () => {
  if (!style.value) return

  try {
    isDeleting.value = true

    // Delete the style using direct fetch
    await $fetch(`/api/styles/${style.value.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(authStore.token && { Authorization: `Bearer ${authStore.token}` }),
      },
    })

    {
      toast.add({
        title: 'Success',
        description: 'Style deleted successfully',
        color: 'green',
      })

      // Clear the current style from the store
      if (styleStore.currentStyle?.id === style.value.id) {
        styleStore.currentStyle = null
      }

      // Navigate back to styles list
      router.push(STYLES_PATH)
    }
  } catch (err: any) {
    console.error('Error deleting style:', err)

    const errorMessage = err.message || 'Failed to delete style. Please try again.'
    toast.add({
      title: 'Error',
      description: errorMessage,
      color: 'error',
    })
  } finally {
    isDeleting.value = false
    confirmDelete.value = false
  }
}
</script>
