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
            <ULink to="/dashboard" class="flex items-center space-x-2">
              <UIcon name="i-heroicons-scissors" class="text-primary-600 text-2xl" />
              <span class="text-xl font-bold text-primary-600">QuickMeazure</span>
            </ULink>
          </div>

          <!-- Navigation Menu -->
          <div class="flex-1 flex flex-col justify-between pt-12 pb-4">
            <nav class="flex-1 flex flex-col gap-1 px-4 overflow-y-auto">
              <NuxtLink
                to="/dashboard"
                class="rounded-lg px-3 py-2.5 text-sm flex items-center gap-3 font-medium justify-start hover:bg-gray-100 transition-all duration-200 hover:translate-x-1"
                :class="
                  route.path === '/dashboard'
                    ? 'bg-primary-50/80 font-semibold text-primary-700 shadow-sm border-l-4 border-primary-500 -ml-1'
                    : 'text-gray-600 hover:text-gray-900'
                "
              >
                <UIcon name="i-heroicons-home" class="size-5 shrink-0" />
                <span class="truncate">Dashboard</span>
              </NuxtLink>

              <NuxtLink
                to="/clients/new"
                class="rounded-lg px-3 py-2.5 text-sm flex items-center gap-3 font-medium justify-start hover:bg-gray-100 transition-all duration-200 hover:translate-x-1"
                :class="
                  route.path.startsWith('/clients/new') && route.path !== '/clients/new'
                    ? 'bg-primary-50/80 font-semibold text-primary-700 shadow-sm border-l-4 border-primary-500 -ml-1'
                    : 'text-gray-600 hover:text-gray-900'
                "
              >
                <UIcon name="i-heroicons-users" class="size-5 shrink-0" />
                <span class="truncate">Clients</span>
              </NuxtLink>

              <a
                :href="'/clients/new'"
                class="rounded-lg px-3 py-2.5 text-sm flex items-center gap-3 font-medium justify-start hover:bg-gray-100 transition-all duration-200 hover:translate-x-1 cursor-pointer"
                :class="
                  route.path === '/clients/new'
                    ? 'bg-primary-50/80 font-semibold text-primary-700 shadow-sm border-l-4 border-primary-500 -ml-1'
                    : 'text-gray-600 hover:text-gray-900'
                "
                @click="navigateToMeasure"
              >
                <UIcon name="i-heroicons-variable" class="size-5 shrink-0" />
                <span class="truncate">Measure</span>
              </a>

              <NuxtLink
                to="/styles"
                class="rounded-lg px-3 py-2.5 text-sm flex items-center gap-3 font-medium justify-start hover:bg-gray-100 transition-all duration-200 hover:translate-x-1"
                :class="
                  route.path.startsWith('/styles')
                    ? 'bg-primary-50/80 font-semibold text-primary-700 shadow-sm border-l-4 border-primary-500 -ml-1'
                    : 'text-gray-600 hover:text-gray-900'
                "
              >
                <UIcon name="i-heroicons-swatch" class="size-5 shrink-0" />
                <span class="truncate">Styles</span>
              </NuxtLink>

              <NuxtLink
                to="/orders"
                class="rounded-lg px-3 py-2.5 text-sm flex items-center gap-3 font-medium justify-start hover:bg-gray-100 transition-all duration-200 hover:translate-x-1"
                :class="
                  route.path.startsWith('/orders')
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
                to="/settings"
                class="rounded-lg px-3 py-2.5 text-sm flex items-center gap-3 font-medium justify-start hover:bg-gray-100 transition-all duration-200 hover:translate-x-1 text-gray-600 hover:text-gray-900"
                :class="{
                  'bg-primary-50/80 font-semibold text-primary-700 shadow-sm border-l-4 border-primary-500 -ml-1':
                    route.path.startsWith('/settings'),
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
          to="/"
          class="flex-col h-auto py-2 rounded-lg flex items-center gap-1.5 font-medium text-sm transition-colors"
          :class="
            route.path === '/'
              ? 'bg-primary-50 font-semibold text-primary-700 border-t-2 border-primary-600'
              : 'text-gray-500'
          "
        >
          <UIcon name="i-heroicons-home" class="size-5 shrink-0" />
          <span class="text-xs mt-1">Dashboard</span>
        </NuxtLink>

        <NuxtLink
          to="/clients"
          class="flex-col h-auto py-2 rounded-lg flex items-center gap-1.5 font-medium text-sm transition-colors"
          :class="
            route.path.startsWith('/clients') && route.path !== '/clients/new'
              ? 'bg-primary-50 font-semibold text-primary-700 border-t-2 border-primary-600'
              : 'text-gray-500'
          "
        >
          <UIcon name="i-heroicons-users" class="size-5 shrink-0" />
          <span class="text-xs mt-1">Clients</span>
        </NuxtLink>

        <NuxtLink
          to="/clients/new"
          class="flex-col h-auto py-2 rounded-lg flex items-center gap-1.5 font-medium text-sm transition-colors"
          :class="
            route.path === '/clients/new'
              ? 'bg-primary-50 font-semibold text-primary-700 border-t-2 border-primary-600'
              : 'text-gray-500'
          "
        >
          <UIcon name="i-heroicons-variable" class="size-5 shrink-0" />
          <span class="text-xs mt-1">Measure</span>
        </NuxtLink>

        <NuxtLink
          to="/styles"
          class="flex-col h-auto py-2 rounded-lg flex items-center gap-1.5 font-medium text-sm transition-colors"
          :class="
            route.path.startsWith('/styles')
              ? 'bg-primary-50 font-semibold text-primary-700 border-t-2 border-primary-600'
              : 'text-gray-500'
          "
        >
          <UIcon name="i-heroicons-swatch" class="size-5 shrink-0" />
          <span class="text-xs mt-1">Styles</span>
        </NuxtLink>

        <NuxtLink
          to="/orders"
          class="flex-col h-auto py-2 rounded-lg flex items-center gap-1.5 font-medium text-sm transition-colors"
          :class="
            route.path.startsWith('/orders')
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
import { useRouter, useRoute } from 'vue-router'

// Get current route and router
const route = useRoute()
const router = useRouter()

// Navigation methods
const navigateToMeasure = (e: Event) => {
  console.log('Navigate to measure clicked', e)
  e.preventDefault()
  router.push('/clients/new')
  return false
}

// Get composables
const { user, isAuthenticated } = useAuth()
const toast = useToast()

// Use notifications composable
const {
  notifications,
  unreadCount,
  isLoading: notificationsLoading,
  error: notificationsError,
  markAsRead,
} = useNotifications()

// Delete notification
// const _deleteNotification = async (id: string) => {
//   // Implementation here
// }

// Types for the icons object
type IconMap = {
  [key: string]: string | { critical: string; default: string }
  payment: { critical: string; default: string }
  subscription: { critical: string; default: string }
  order: string
}

const handleLogout = async () => {
  try {
    const { logout } = useAuth()
    await logout()

    // Redirect to login page
    await navigateTo('/auth/login')
  } catch (_error) {
    // Handle error
    console.error('Error in dashboard layout:', _error)
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
