<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <!-- Top Navigation Bar -->
    <header class="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div class="container mx-auto px-4 py-3 flex justify-between items-center">
        <div class="flex items-center">
          <ULink :to="ROUTE_NAMES.HOME" class="flex items-center space-x-2">
            <UIcon name="i-heroicons-scissors" class="text-primary-600 text-2xl" />
            <span class="text-xl font-bold text-primary-600">QuickMeazure</span>
          </ULink>
        </div>

        <!-- Navigation for guests -->
        <div v-if="!isLoggedIn" class="flex items-center space-x-2 sm:space-x-4">
          <UButton
            v-if="route.path !== ROUTE_NAMES.AUTH.LOGIN"
            :to="ROUTE_NAMES.AUTH.LOGIN"
            color="neutral"
            variant="outline"
          >
            Login
          </UButton>
          <UButton
            v-if="route.path !== ROUTE_NAMES.AUTH.REGISTER"
            :to="ROUTE_NAMES.AUTH.REGISTER"
            color="primary"
          >
            Register
          </UButton>
        </div>
      </div>
    </header>

    <!-- Main content wrapper -->
    <div class="container mx-auto px-4 pt-16 pb-20 sm:pb-6 flex-grow">
      <main>
        <slot />
      </main>
    </div>

    <!-- Footer - only show on public pages -->
    <footer v-if="!isLoggedIn" class="bg-white border-t border-gray-200 py-6 mt-auto">
      <div class="container mx-auto px-4 text-center text-sm text-gray-600">
        <p>© {{ new Date().getFullYear() }} QuickMeazure. All rights reserved.</p>
        <div class="flex justify-center space-x-4 mt-2">
          <ULink
:to="ROUTE_NAMES.LEGAL.TERMS"
class="hover:text-primary-600"
            >Terms of Service</ULink
          >
          <ULink
:to="ROUTE_NAMES.LEGAL.PRIVACY"
class="hover:text-primary-600"
            >Privacy Policy</ULink
          >
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
// Get authenticated user with the auth store
import { computed, watchEffect } from 'vue'
import { useAuthStore } from '~/store/modules/auth'
import { ROUTE_NAMES } from '~/constants/routes'

const authStore = useAuthStore()
const isLoggedIn = computed(() => authStore.isLoggedIn)
const route = useRoute()

// Redirect to dashboard if user is logged in and trying to access public pages
// Exclude auth pages from this redirection
watchEffect(() => {
  const isAuthPage = route.path.startsWith(ROUTE_NAMES.AUTH.LOGIN.split('/auth')[0] + '/auth')
  if (isLoggedIn.value && !isAuthPage && route.path !== ROUTE_NAMES.HOME) {
    // Only redirect for protected pages
    navigateTo(ROUTE_NAMES.DASHBOARD.INDEX)
  }
})
</script>
