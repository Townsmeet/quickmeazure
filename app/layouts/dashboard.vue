<template>
  <UDashboardGroup v-model:sidebar="isSidebarOpen">
    <!-- SIDEBAR: use slots for header and footer -->
    <UDashboardSidebar collapsible resizable :ui="{ footer: 'border-t border-default' }">
      <template #header="{ collapsed }">
        <div v-if="!collapsed" class="flex items-center gap-3">
          <UIcon name="i-heroicons-scissors" class="text-primary-600 text-2xl" />
          <span class="font-bold text-lg">QuickMeazure</span>
        </div>
        <UIcon v-else name="i-heroicons-scissors" class="size-5 text-primary mx-auto" />
      </template>

      <template #default="{ collapsed }">
        <UButton
          :label="collapsed ? undefined : 'Search...'"
          icon="i-heroicons-magnifying-glass"
          color="neutral"
          variant="outline"
          block
          :square="collapsed"
        >
          <template v-if="!collapsed" #trailing>
            <div class="flex items-center gap-0.5 ms-auto">
              <UKbd value="meta" variant="subtle" />
              <UKbd value="K" variant="subtle" />
            </div>
          </template>
        </UButton>

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
        <UButton
          :avatar="{
            src: (user as any)?.avatar || undefined,
            alt: (user as any)?.name || 'User',
          }"
          :label="collapsed ? undefined : (user as any)?.name || 'User'"
          color="neutral"
          variant="ghost"
          class="w-full"
          :block="collapsed"
          @click="handleUserMenu"
        >
          <template v-if="!collapsed" #trailing>
            <UButton
              icon="i-heroicons-power"
              color="neutral"
              variant="ghost"
              size="xs"
              aria-label="Logout"
              @click.stop="handleLogout"
            />
          </template>
        </UButton>
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
        <div class="p-4 sm:p-6">
          <slot />
        </div>
      </div>
    </UDashboardPanel>
  </UDashboardGroup>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const router = useRouter()
const route = useRoute()

// State for sidebar
const isSidebarOpen = ref(false)

// User/auth composable (replace/use as your project implements)
const { user = ref({}) } = useAuth() || {}

// Navigation items structured for UNavigationMenu
const navigationItems: NavigationMenuItem[][] = [
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
          label: 'Profile',
          to: '/settings',
        },
        {
          label: 'Measurement Templates',
          to: '/measurement-templates',
        },
      ],
    },
  ],
  [
    {
      label: 'Help & Support',
      icon: 'i-heroicons-question-mark-circle',
      to: '/help',
    },
  ],
]

// Title in navbar can be derived from nav or page context
const navTitle = computed(() => {
  const mainNavItems = navigationItems[0]
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

const handleLogout = async () => {
  try {
    const { logout } = useAuth()
    await logout()
    await navigateTo('/auth/login')
  } catch (_error) {
    if (import.meta.client) localStorage.removeItem('intentionalLogout')
  }
}
</script>
