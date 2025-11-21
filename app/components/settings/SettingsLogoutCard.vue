<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">Logout</h3>

    <div class="space-y-4">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Sign out of your account. You will need to log in again to access your account.
      </p>

      <UButton
        color="error"
        variant="outline"
        icon="i-heroicons-power"
        :loading="isLoggingOut"
        @click="handleLogout"
      >
        Logout
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
const isLoggingOut = ref(false)
const toast = useToast()

const handleLogout = async () => {
  try {
    isLoggingOut.value = true
    const { logout } = useAuth()
    await logout()
  } catch (error) {
    console.error('Logout error:', error)
    toast.add({
      title: 'Error',
      description: 'An error occurred while logging out. Please try again.',
      color: 'error',
      icon: 'i-heroicons-exclamation-circle',
    })
    if (import.meta.client) localStorage.removeItem('intentionalLogout')
    // Navigate to login as fallback
    await navigateTo('/auth/login')
  } finally {
    isLoggingOut.value = false
  }
}
</script>
