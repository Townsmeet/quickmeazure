<template>
  <div class="min-h-screen bg-gray-50 overflow-x-hidden">
    <!-- Top Navigation Bar -->

    <!-- Main content wrapper -->
    <div class="flex flex-nowrap min-h-screen">
      <!-- Fixed Sidebar -->
      <ClientOnly>
        <aside
          class="hidden md:flex flex-col w-64 flex-shrink-0 fixed top-0 left-0 h-screen bg-white border-r border-gray-200 z-40"
        >
          <!-- Logo at the top -->
          <div class="px-6 pt-8 pb-6">
            <ULink :to="DASHBOARD.INDEX" class="flex items-center space-x-2">
              <UIcon name="i-heroicons-scissors" class="text-primary-600 text-2xl" />
              <span class="text-xl font-bold text-primary-600">QuickMeazure</span>
            </ULink>
          </div>

          <!-- Navigation Menu -->
          <div class="flex-1 flex flex-col justify-between pt-12 pb-4">
            <nav class="flex-1 flex flex-col gap-1 px-4 overflow-y-auto">
              <NuxtLink
                :to="DASHBOARD.INDEX"
                class="rounded-lg px-3 py-2.5 text-sm flex items-center gap-3 font-medium justify-start hover:bg-gray-100 transition-all duration-200 hover:translate-x-1"
                :class="
                  route.path === DASHBOARD.INDEX
                    ? 'bg-primary-50/80 font-semibold text-primary-700 shadow-sm border-l-4 border-primary-500 -ml-1'
                    : 'text-gray-600 hover:text-gray-900'
                "
              >
                <UIcon name="i-heroicons-home" class="size-5 shrink-0" />
                <span class="truncate">Dashboard</span>
              </NuxtLink>

              <NuxtLink
                :to="DASHBOARD.CLIENTS.INDEX"
                class="rounded-lg px-3 py-2.5 text-sm flex items-center gap-3 font-medium justify-start hover:bg-gray-100 transition-all duration-200 hover:translate-x-1"
                :class="
                  route.path.startsWith(DASHBOARD.CLIENTS.INDEX) && route.path !== '/clients/new'
                    ? 'bg-primary-50/80 font-semibold text-primary-700 shadow-sm border-l-4 border-primary-500 -ml-1'
                    : 'text-gray-600 hover:text-gray-900'
                "
              >
                <UIcon name="i-heroicons-users" class="size-5 shrink-0" />
                <span class="truncate">Clients</span>
              </NuxtLink>

              <a
                :href="DASHBOARD.CLIENTS.NEW"
                class="rounded-lg px-3 py-2.5 text-sm flex items-center gap-3 font-medium justify-start hover:bg-gray-100 transition-all duration-200 hover:translate-x-1 cursor-pointer"
                :class="
                  route.path === DASHBOARD.CLIENTS.NEW
                    ? 'bg-primary-50/80 font-semibold text-primary-700 shadow-sm border-l-4 border-primary-500 -ml-1'
                    : 'text-gray-600 hover:text-gray-900'
                "
                @click="navigateToMeasure"
              >
                <UIcon name="i-heroicons-variable" class="size-5 shrink-0" />
                <span class="truncate">Measure</span>
              </a>

              <NuxtLink
                :to="DASHBOARD.STYLES.INDEX"
                class="rounded-lg px-3 py-2.5 text-sm flex items-center gap-3 font-medium justify-start hover:bg-gray-100 transition-all duration-200 hover:translate-x-1"
                :class="
                  route.path.startsWith(DASHBOARD.STYLES.INDEX)
                    ? 'bg-primary-50/80 font-semibold text-primary-700 shadow-sm border-l-4 border-primary-500 -ml-1'
                    : 'text-gray-600 hover:text-gray-900'
                "
              >
                <UIcon name="i-heroicons-swatch" class="size-5 shrink-0" />
                <span class="truncate">Styles</span>
              </NuxtLink>

              <NuxtLink
                :to="DASHBOARD.ORDERS.INDEX"
                class="rounded-lg px-3 py-2.5 text-sm flex items-center gap-3 font-medium justify-start hover:bg-gray-100 transition-all duration-200 hover:translate-x-1"
                :class="
                  route.path.startsWith(DASHBOARD.ORDERS.INDEX)
                    ? 'bg-primary-50/80 font-semibold text-primary-700 shadow-sm border-l-4 border-primary-500 -ml-1'
                    : 'text-gray-600 hover:text-gray-900'
                "
              >
                <UIcon name="i-heroicons-shopping-bag" class="size-5 shrink-0" />
                <span class="truncate">Orders</span>
              </NuxtLink>

              <!-- Notifications -->
              <button
                class="w-full rounded-lg px-3 py-2.5 text-sm flex items-center gap-3 font-medium justify-start hover:bg-gray-100 transition-all duration-200 hover:translate-x-1 text-gray-600 hover:text-gray-900"
                :class="{
                  'bg-primary-50/80 font-semibold text-primary-700 shadow-sm border-l-4 border-primary-500 -ml-1':
                    route.path === '/notifications',
                }"
                @click="isNotificationsOpen = true"
              >
                <UIcon name="i-heroicons-bell" class="size-5 shrink-0" />
                <span class="truncate">Notifications</span>
                <UChip
                  v-if="unreadCount > 0"
                  :text="unreadCount.toString()"
                  size="xs"
                  color="primary"
                  class="ml-auto"
                />
              </button>

              <!-- Settings -->
              <NuxtLink
                :to="DASHBOARD.SETTINGS"
                class="rounded-lg px-3 py-2.5 text-sm flex items-center gap-3 font-medium justify-start hover:bg-gray-100 transition-all duration-200 hover:translate-x-1 text-gray-600 hover:text-gray-900"
                :class="{
                  'bg-primary-50/80 font-semibold text-primary-700 shadow-sm border-l-4 border-primary-500 -ml-1':
                    route.path.startsWith(DASHBOARD.SETTINGS),
                }"
              >
                <UIcon name="i-heroicons-cog-6-tooth" class="size-5 shrink-0" />
                <span class="truncate">Settings</span>
              </NuxtLink>
            </nav>
          </div>

          <!-- User Section at the bottom -->
          <div class="px-6 py-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="flex-shrink-0">
                  <div
                    class="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center"
                  >
                    <UIcon name="i-heroicons-user" class="h-6 w-6 text-primary-600" />
                  </div>
                </div>
                <div class="text-sm">
                  <template v-if="user?.name">
                    <div class="font-medium text-gray-900">
                      {{ user.name.split(' ')[0] || 'User' }}
                    </div>
                    <div class="text-gray-900">
                      {{ user.name.split(' ').slice(1).join(' ') || '' }}
                    </div>
                  </template>
                  <div v-else class="font-medium text-gray-900">User</div>
                </div>
              </div>
              <UButton
                color="neutral"
                variant="ghost"
                class="hover:bg-red-50 hover:text-red-600"
                icon="i-heroicons-power"
                aria-label="Logout"
                @click="handleLogout"
              />
            </div>
          </div>
        </aside>
      </ClientOnly>

      <!-- Main Content -->
      <div class="flex-1 min-w-0 md:ml-64 pt-24 pb-24 md:pb-8">
        <div class="container mx-auto px-6">
          <main class="w-full">
            <slot></slot>
          </main>
        </div>
      </div>
    </div>

    <!-- Mobile Footer Navigation -->
    <footer class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
      <nav class="grid grid-cols-5 gap-1 p-2">
        <NuxtLink
          :to="DASHBOARD.INDEX"
          class="flex-col h-auto py-2 rounded-lg flex items-center gap-1.5 font-medium text-sm transition-colors"
          :class="
            route.path === DASHBOARD.INDEX
              ? 'bg-primary-50 font-semibold text-primary-700 border-t-2 border-primary-600'
              : 'text-gray-500'
          "
        >
          <UIcon name="i-heroicons-home" class="size-5 shrink-0" />
          <span class="text-xs mt-1">Dashboard</span>
        </NuxtLink>

        <NuxtLink
          :to="DASHBOARD.CLIENTS.INDEX"
          class="flex-col h-auto py-2 rounded-lg flex items-center gap-1.5 font-medium text-sm transition-colors"
          :class="
            route.path.startsWith(DASHBOARD.CLIENTS.INDEX) && route.path !== DASHBOARD.CLIENTS.NEW
              ? 'bg-primary-50 font-semibold text-primary-700 border-t-2 border-primary-600'
              : 'text-gray-500'
          "
        >
          <UIcon name="i-heroicons-users" class="size-5 shrink-0" />
          <span class="text-xs mt-1">Clients</span>
        </NuxtLink>

        <NuxtLink
          :to="DASHBOARD.CLIENTS.NEW"
          class="flex-col h-auto py-2 rounded-lg flex items-center gap-1.5 font-medium text-sm transition-colors"
          :class="
            route.path === DASHBOARD.CLIENTS.NEW
              ? 'bg-primary-50 font-semibold text-primary-700 border-t-2 border-primary-600'
              : 'text-gray-500'
          "
        >
          <UIcon name="i-heroicons-variable" class="size-5 shrink-0" />
          <span class="text-xs mt-1">Measure</span>
        </NuxtLink>

        <NuxtLink
          :to="DASHBOARD.STYLES.INDEX"
          class="flex-col h-auto py-2 rounded-lg flex items-center gap-1.5 font-medium text-sm transition-colors"
          :class="
            route.path.startsWith(DASHBOARD.STYLES.INDEX)
              ? 'bg-primary-50 font-semibold text-primary-700 border-t-2 border-primary-600'
              : 'text-gray-500'
          "
        >
          <UIcon name="i-heroicons-swatch" class="size-5 shrink-0" />
          <span class="text-xs mt-1">Styles</span>
        </NuxtLink>

        <NuxtLink
          :to="DASHBOARD.ORDERS.INDEX"
          class="flex-col h-auto py-2 rounded-lg flex items-center gap-1.5 font-medium text-sm transition-colors"
          :class="
            route.path.startsWith(DASHBOARD.ORDERS.INDEX)
              ? 'bg-primary-50 font-semibold text-primary-700 border-t-2 border-primary-600'
              : 'text-gray-500'
          "
        >
          <UIcon name="i-heroicons-shopping-bag" class="size-5 shrink-0" />
          <span class="text-xs mt-1">Orders</span>
        </NuxtLink>
      </nav>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ROUTE_NAMES } from '~/constants/routes'
import { useRouter, useRoute } from 'vue-router'
import { API_ENDPOINTS } from '~/constants/api'

// Get current route and router
const route = useRoute()
const router = useRouter()

// Navigation methods
const navigateToMeasure = (e: Event) => {
  console.log('Navigate to measure clicked', e)
  e.preventDefault()
  router.push(ROUTE_NAMES.DASHBOARD.CLIENTS.NEW)
  return false
}

// Get composables
const { user, isAuthenticated } = useAuth()
const { currentSubscription } = useSubscriptions()

const toast = useToast()

// Notification state (since we don't have a notification composable yet)
const notifications = ref([])
const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)
const notificationsLoading = ref(false)
const notificationsError = ref(null)

// Destructure route names for easy access
const { DASHBOARD } = ROUTE_NAMES

// State for dropdowns and drawers
const isDropdownOpen = ref(false)
const isNotificationsOpen = ref(false)

// Simplified notifications (TODO: Create useNotifications composable)
const notificationsLoading = ref(false)
const notificationsError = ref(null)

// Get icon based on notification type and severity
const _getNotificationIcon = (notification: { type: string; severity: string }): string => {
  if (notification.type === 'payment') {
    return notification.severity === 'critical'
      ? 'i-heroicons-credit-card-solid'
      : 'i-heroicons-credit-card'
  } else if (notification.type === 'subscription') {
    return notification.severity === 'critical'
      ? 'i-heroicons-calendar-solid'
      : 'i-heroicons-calendar'
  } else if (notification.type === 'usage') {
    return notification.severity === 'critical'
      ? 'i-heroicons-chart-bar-solid'
      : 'i-heroicons-chart-bar'
  } else {
    return notification.severity === 'critical'
      ? 'i-heroicons-exclamation-circle-solid'
      : 'i-heroicons-information-circle'
  }
}

// Mark notification as read
const _markNotificationAsRead = async (id: string) => {
  try {
    notificationStore.setLoading(true)
    const response = await $fetch(`/api/notifications/${id}/read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authStore.token && { Authorization: `Bearer ${authStore.token}` }),
      },
      credentials: 'include',
    })

    if (response.success) {
      // Update local state
      notificationStore.updateNotification(id, { read: true })

      // Show success message
      toast.add({
        title: 'Success',
        description: 'Notification marked as read',
        color: 'primary',
      })
    }
  } catch (error: any) {
    console.error('Failed to mark notification as read:', error)
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to mark notification as read',
      color: 'error',
    })
  } finally {
    notificationStore.setLoading(false)
  }
}

/**
 * Mark all notifications as read
 */
const _markAllNotificationsAsRead = async () => {
  try {
    notificationStore.setLoading(true)
    const response = await $fetch(`${API_ENDPOINTS.USERS}/notifications/mark-all-read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authStore.token && { Authorization: `Bearer ${authStore.token}` }),
      },
      credentials: 'include',
    })

    if ((response as { success: boolean }).success) {
      // Update local state
      notificationStore.markAllRead()

      // Show success message
      toast.add({
        title: 'Success',
        description: 'All notifications marked as read',
        color: 'primary',
      })

      // Refresh notifications
      await refreshNotifications()
    } else {
      throw new Error(
        (response as { error?: string }).error || 'Failed to mark all notifications as read'
      )
    }
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error)
    notificationStore.setError(error.message || 'Failed to mark all notifications as read')

    // Show error toast
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to mark all notifications as read',
      color: 'error',
    })
  } finally {
    notificationStore.setLoading(false)
  }
}

// Refresh notifications when auth state changes
watch(
  () => authStore.isLoggedIn,
  isLoggedIn => {
    if (isLoggedIn) {
      refreshNotifications()
    } else {
      // Clear notifications when logging out
      notificationStore.setNotifications([])
    }
  }
)

// Close dropdown on route change
watch(route, () => {
  isDropdownOpen.value = false
})

// Handle user logout with improved error handling
const handleLogout = async () => {
  try {
    // Set a flag in localStorage to indicate this is an intentional logout
    // This will be used to prevent showing any toasts during logout
    if (import.meta.client) {
      localStorage.setItem('intentionalLogout', 'true')
    }

    // Logout using direct $fetch call
    await $fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Redirect to login page
    router.push('/auth/login')
  } catch (error) {
    console.error('Error logging out:', error)
  } finally {
    // Clean up the flag in all cases
    if (import.meta.client) {
      localStorage.removeItem('intentionalLogout')
    }
  }
}
</script>

<style scoped>
.active-nav-item {
  position: relative;
  font-weight: 500;
  color: rgb(var(--color-primary-600));
}

.active-nav-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 60%;
  width: 3px;
  background-color: rgb(var(--color-primary-600));
  border-radius: 0 4px 4px 0;
}
</style>
