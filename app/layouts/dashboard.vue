<template>
  <UDashboardGroup v-model:sidebar="isSidebarOpen">
    <!-- SIDEBAR: use slots for header and footer -->
    <UDashboardSidebar collapsible resizable :ui="{ footer: 'border-t border-default' }">
      <template #header="{ collapsed }">
        <div v-if="!collapsed" class="flex items-center gap-3">
          <img
src="/logo.png"
alt="QuickMeazure Logo"
width="40"
height="40" />
          <!-- <span class="font-bold text-lg">QuickMeazure</span> -->
        </div>
        <UIcon v-else name="i-heroicons-scissors" class="size-5 text-primary mx-auto" />
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="navigationItems[0]"
          orientation="vertical"
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="navigationItems[1]"
          orientation="vertical"
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <ClientOnly>
          <UButton
            :avatar="{
              src: userDisplayData.avatar,
              alt: userDisplayData.name,
            }"
            :label="collapsed ? undefined : userDisplayData.name"
            color="neutral"
            variant="ghost"
            class="w-full"
            :block="collapsed"
            @click="handleUserMenu"
          />
        </ClientOnly>
      </template>
    </UDashboardSidebar>

    <!-- MAIN PANEL -->
    <UDashboardPanel class="h-screen overflow-hidden flex flex-col">
      <template #header>
        <UDashboardNavbar :title="navTitle">
          <template #left>
            <UButton
              icon="i-heroicons-bars-3"
              class="md:hidden"
              variant="ghost"
              @click="isSidebarOpen = !isSidebarOpen"
            />
          </template>
          <template #right>
            <UButton icon="i-heroicons-bell" to="/notifications" color="primary" />
            <UButton icon="i-heroicons-user" to="/settings" color="primary" />
          </template>
        </UDashboardNavbar>
      </template>
      <!-- DEFAULT SLOT: main content -->
      <div class="flex-1 overflow-y-auto">
        <div class="p-4 sm:p-6 pb-20 md:pb-6">
          <slot />
        </div>
      </div>
      <!-- MOBILE BOTTOM NAVIGATION -->
      <div class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div class="grid grid-cols-5 gap-1 p-2 relative">
          <UButton
            v-for="item in mobileNavItems"
            :key="item.label"
            :to="item.isMore ? undefined : item.to"
            :icon="item.icon"
            :color="isActiveRoute(item) ? 'primary' : 'neutral'"
            variant="ghost"
            size="sm"
            class="flex flex-col items-center justify-center h-16 relative mobile-more-button"
            :class="isActiveRoute(item) ? 'text-primary-600' : 'text-gray-600'"
            @click="item.isMore ? toggleMobileMore() : undefined"
          >
            <UIcon :name="item.icon" class="w-5 h-5 mb-1" />
            <span class="text-xs">{{ item.label }}</span>
          </UButton>

          <!-- Mobile More Dropdown -->
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 transform translate-y-2"
            enter-to-class="opacity-100 transform translate-y-0"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 transform translate-y-0"
            leave-to-class="opacity-0 transform translate-y-2"
          >
            <div
              v-if="isMobileMoreOpen"
              class="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50"
              @click.stop
            >
              <div class="space-y-1">
                <!-- Settings submenu -->
                <div class="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Settings
                </div>
                <UButton
                  v-for="settingItem in settingsItems"
                  :key="settingItem.to"
                  :to="settingItem.to"
                  :icon="settingItem.icon"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  class="w-full justify-start"
                  @click="isMobileMoreOpen = false"
                >
                  {{ settingItem.label }}
                </UButton>

                <!-- Separator -->
                <div class="border-t border-gray-100 my-2"></div>

                <!-- Help & Support -->
                <UButton
                  to="/help"
                  icon="i-heroicons-question-mark-circle"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  class="w-full justify-start"
                  @click="isMobileMoreOpen = false"
                >
                  Help & Support
                </UButton>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </UDashboardPanel>
  </UDashboardGroup>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { onMounted, onUnmounted } from 'vue'

const route = useRoute()

// State for sidebar
const isSidebarOpen = ref(false)

// State for mobile more menu
const isMobileMoreOpen = ref(false)

// User/auth composable
const { user, init } = useAuth()

// Initialize auth on mount
onMounted(() => {
  init()
})

// Computed property to handle hydration mismatch
const userDisplayData = computed(() => {
  // Ensure consistent data structure between server and client
  if (!user.value) {
    return {
      name: 'User',
      avatar: undefined,
    }
  }

  const currentUser = user.value as any
  // Ensure name is consistent and properly formatted
  const userName = currentUser?.name || 'User'

  return {
    name: userName,
    avatar: currentUser?.avatar || undefined,
  }
})
const settingsItems = [
  {
    label: 'Templates',
    icon: 'i-heroicons-document-text',
    to: '/settings/templates',
  },
  {
    label: 'Profile',
    icon: 'i-heroicons-user',
    to: '/settings/profile',
  },
  {
    label: 'Billing',
    icon: 'i-heroicons-credit-card',
    to: '/settings/billing',
  },
  {
    label: 'Security',
    icon: 'i-heroicons-shield-check',
    to: '/settings/security',
  },
]

// Function to toggle mobile more menu
const toggleMobileMore = () => {
  isMobileMoreOpen.value = !isMobileMoreOpen.value
}

// Close mobile more menu when clicking outside (but not on the More button)
const closeMobileMore = (event: Event) => {
  // Don't close if clicking on the More button itself
  if (event.target && (event.target as Element).closest('.mobile-more-button')) {
    return
  }
  isMobileMoreOpen.value = false
}

// Add click outside listener
onMounted(() => {
  if (import.meta.client) {
    document.addEventListener('click', closeMobileMore)
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    document.removeEventListener('click', closeMobileMore)
  }
})
type MobileNavItem = {
  label: string
  icon: string
  to: string
  isMore?: boolean
}

// Mobile navigation items (subset of main navigation for bottom nav)
const mobileNavItems: MobileNavItem[] = [
  {
    label: 'Dashboard',
    icon: 'i-heroicons-home',
    to: '/dashboard',
  },
  {
    label: 'Clients',
    icon: 'i-heroicons-users',
    to: '/clients',
  },
  {
    label: 'Styles',
    icon: 'i-heroicons-swatch',
    to: '/styles',
  },
  {
    label: 'Orders',
    icon: 'i-heroicons-shopping-bag',
    to: '/orders',
  },
  {
    label: 'More',
    icon: 'i-heroicons-ellipsis-horizontal',
    to: '', // No navigation, opens dropdown instead
    isMore: true,
  },
]

// Helper function to check if a mobile nav item is active
const isActiveRoute = (item: MobileNavItem) => {
  // More button is active if we're on settings or help pages
  if (item.isMore) {
    return route.path.startsWith('/settings') || route.path.startsWith('/help')
  }

  if (item.to && route.path === item.to) return true
  if (item.to && route.path.startsWith(item.to + '/')) return true

  // Handle special cases for nested routes
  switch (item.to) {
    case '/clients':
      return route.path.startsWith('/clients')
    case '/styles':
      return route.path.startsWith('/styles')
    case '/orders':
      return route.path.startsWith('/orders')
    case '/dashboard':
      return route.path === '/dashboard'
    default:
      return false
  }
}

// Navigation items structured for UNavigationMenu — make computed so `active` updates
const navigationItems = computed<NavigationMenuItem[][]>(() => [
  [
    {
      label: 'Dashboard',
      icon: 'i-heroicons-home',
      to: '/dashboard',
      active: route.path === '/dashboard',
    },
    {
      label: 'Clients',
      icon: 'i-heroicons-users',
      to: '/clients',
      active: route.path.startsWith('/clients'),
    },
    {
      label: 'Styles',
      icon: 'i-heroicons-swatch',
      to: '/styles',
      active: route.path.startsWith('/styles'),
    },
    {
      label: 'Orders',
      icon: 'i-heroicons-shopping-bag',
      to: '/orders',
      active: route.path.startsWith('/orders'),
    },
    {
      label: 'Settings',
      icon: 'i-heroicons-cog-6-tooth',
      defaultOpen: true,
      children: [
        {
          label: 'Templates',
          to: '/settings/templates',
        },
        {
          label: 'Profile',
          to: '/settings/profile',
        },
        {
          label: 'Billing',
          to: '/settings/billing',
        },
        {
          label: 'Security',
          to: '/settings/security',
        },
      ],
    },
  ],
  [
    {
      label: 'Help & Support',
      icon: 'i-heroicons-question-mark-circle',
      to: '/',
    },
  ],
])

// Title in navbar can be derived from nav or page context
const navTitle = computed(() => {
  const mainNavItems = navigationItems.value[0]
  const found = mainNavItems?.find(item => {
    if (item.to && route.path === item.to) return true
    if (item.children) {
      return item.children.some(child => child.to === route.path)
    }
    return false
  })
  return found?.label || 'Dashboard'
})

const handleUserMenu = () => {
  // Handle user menu click - could open a dropdown or navigate to profile
  navigateTo('/settings')
}
</script>
