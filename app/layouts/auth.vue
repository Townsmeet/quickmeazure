<template>
  <div class="min-h-screen bg-gray-50 py-4">
    <!-- Top Navigation Bar -->
    <header class="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div class="container mx-auto px-4 py-3 flex justify-between items-center">
        <div class="flex items-center">
          <ULink
            :to="routes.ROUTE_PATHS[routes.ROUTE_NAMES.HOME]"
            class="flex items-center space-x-2"
          >
            <UIcon name="i-heroicons-scissors" class="text-primary-600 text-2xl" />
            <span class="text-xl font-bold text-primary-600">QuickMeazure</span>
          </ULink>
        </div>

        <!-- Navigation for guests -->
        <div class="flex items-center space-x-2 sm:space-x-4">
          <UButton
            v-if="showLoginButton"
            :to="routes.ROUTE_PATHS[routes.ROUTE_NAMES.AUTH.LOGIN]"
            color="neutral"
            variant="outline"
          >
            Login
          </UButton>
          <UButton
            v-if="showRegisterButton"
            :to="routes.ROUTE_PATHS[routes.ROUTE_NAMES.AUTH.REGISTER]"
            color="primary"
          >
            Register
          </UButton>
        </div>
      </div>
    </header>

    <!-- Main content wrapper -->
    <div class="container mx-auto px-4 pt-16 pb-20 sm:pb-6">
      <main>
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useSubscriptionStore } from '~/store/modules/subscription'
import { useAppRoutes } from '~/composables/useRoutes'

// Get current route for conditional rendering
const route = useRoute()
const routes = useAppRoutes()
const subscriptionStore = useSubscriptionStore()

// Fetch plans on layout mount
const fetchPlans = async () => {
  try {
    const response = await $fetch('/api/plans')
    // Handle both direct array response and object with plans property
    const plansData = Array.isArray(response) ? response : response.plans || []
    subscriptionStore.setPlans(
      plansData.map(plan => ({
        ...plan,
        isActive: true, // Set default value for isActive
        createdAt: new Date().toISOString(), // Set current timestamp for createdAt
      }))
    )
  } catch (error) {
    console.error('Error fetching plans in auth layout:', error)
  }
}

// Fetch plans when layout is mounted
onMounted(() => {
  fetchPlans()
})

// Check if current page is subscription confirm page
const isSubscriptionConfirmPage = computed(() => {
  return route.path === routes.ROUTE_PATHS[routes.ROUTE_NAMES.AUTH.CONFIRM]
})

// Check if current page is setup measurements page
const isSetupMeasurementsPage = computed(() => {
  return route.path === routes.ROUTE_NAMES.AUTH.SETUP_MEASUREMENT
})

// Show login button condition
const showLoginButton = computed(() => {
  return (
    route.path !== routes.ROUTE_PATHS[routes.ROUTE_NAMES.AUTH.LOGIN] &&
    !isSubscriptionConfirmPage.value &&
    !isSetupMeasurementsPage.value
  )
})

// Show register button condition
const showRegisterButton = computed(() => {
  return (
    route.path !== routes.ROUTE_PATHS[routes.ROUTE_NAMES.AUTH.REGISTER] &&
    !isSubscriptionConfirmPage.value &&
    !isSetupMeasurementsPage.value
  )
})
</script>
