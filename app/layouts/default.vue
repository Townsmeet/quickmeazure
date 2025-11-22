<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
    <header
      class="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-700/50"
    >
      <div class="container mx-auto px-4 py-3 flex justify-between items-center">
        <div class="flex items-center">
          <ULink to="/" class="flex items-center space-x-2">
            <img
src="/logo.png"
alt="QuickMeazure Logo"
width="40"
height="40" />
            <span class="text-xl font-bold text-gray-900 dark:text-white">QuickMeazure</span>
          </ULink>
        </div>

        <div v-if="!isLoggedIn" class="flex items-center space-x-2 sm:space-x-4">
          <UButton
            v-if="route.path !== '/auth/login'"
            to="/auth/login"
            color="neutral"
            variant="outline"
            size="lg"
          >
            Login
          </UButton>
          <UButton
            v-if="route.path !== '/auth/register'"
            to="/auth/register"
            color="primary"
            size="lg"
            class="hidden sm:inline-flex"
          >
            Register
          </UButton>
          <ClientOnly v-if="!colorMode?.forced">
            <UButton
              :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
              color="neutral"
              variant="ghost"
              :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
              class="flex items-center justify-center h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              @click="isDark = !isDark"
            />
            <template #fallback>
              <div class="size-10" />
            </template>
          </ClientOnly>
        </div>
      </div>
    </header>

    <div class="container mx-auto px-4 pt-16 pb-20 sm:pb-6 flex-grow">
      <main>
        <slot />
      </main>
    </div>

    <footer
      v-if="!isLoggedIn"
      class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6 mt-auto"
    >
      <div class="container mx-auto px-4 text-center text-sm text-gray-600 dark:text-gray-400">
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
const colorMode = useColorMode()
const isDark = computed({
  get() {
    return colorMode.value === 'dark'
  },
  set(_isDark) {
    colorMode.preference = _isDark ? 'dark' : 'light'
  },
})
</script>
