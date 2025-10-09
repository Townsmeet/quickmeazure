<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <header class="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div class="container mx-auto px-4 py-3 flex justify-between items-center">
        <div class="flex items-center">
          <ULink to="/" class="flex items-center space-x-2">
            <UIcon name="i-heroicons-scissors" class="text-primary-600 text-2xl" />
            <span class="text-xl font-bold text-primary-600">QuickMeazure</span>
          </ULink>
        </div>

        <div v-if="!isLoggedIn" class="flex items-center space-x-2 sm:space-x-4">
          <UButton
            v-if="route.path !== '/auth/login'"
            to="/auth/login"
            color="neutral"
            variant="outline"
          >
            Login
          </UButton>
          <UButton v-if="route.path !== '/auth/register'" to="/auth/register" color="primary">
            Register
          </UButton>
        </div>
      </div>
    </header>

    <div class="container mx-auto px-4 pt-16 pb-20 sm:pb-6 flex-grow">
      <main>
        <slot />
      </main>
    </div>

    <footer v-if="!isLoggedIn" class="bg-white border-t border-gray-200 py-6 mt-auto">
      <div class="container mx-auto px-4 text-center text-sm text-gray-600">
        <p>© {{ new Date().getFullYear() }} QuickMeazure. All rights reserved.</p>
        <div class="flex justify-center space-x-4 mt-2">
          <ULink to="/legal/terms" class="hover:text-primary-600"> Terms of Service </ULink>
          <ULink to="/legal/privacy" class="hover:text-primary-600"> Privacy Policy </ULink>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
const { isAuthenticated } = useAuth()
const isLoggedIn = computed(() => isAuthenticated.value)
const route = useRoute()
</script>
