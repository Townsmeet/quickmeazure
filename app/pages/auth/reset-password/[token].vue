<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 p-4">
    <div class="w-full max-w-md space-y-8 p-10 bg-white rounded-xl shadow">
      <!-- Back to login link -->
      <div class="text-left">
        <ULink
          :to="routes.ROUTE_PATHS[routes.ROUTE_NAMES.AUTH.LOGIN]"
          class="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <UIcon name="i-heroicons-arrow-left" class="mr-1 h-4 w-4" />
          Back to login
        </ULink>
      </div>

      <div class="text-center">
        <h2 class="text-2xl md:text-3xl font-bold">Reset your password</h2>
        <p class="mt-2 text-sm text-gray-600">Enter your new password below</p>
      </div>

      <div class="mt-8">
        <div class="space-y-6">
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">New Password</label>
            <UInput
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              required
              placeholder="New password"
              class="w-full"
              size="lg"
            >
              <template #trailing>
                <UButton
color="gray"
variant="ghost"
icon
@click="showPassword = !showPassword">
                  <UIcon :name="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'" />
                </UButton>
              </template>
            </UInput>
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">Confirm Password</label>
            <UInput
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              autocomplete="new-password"
              required
              placeholder="Confirm new password"
              :color="passwordsMatch ? undefined : 'red'"
              :help="!passwordsMatch && confirmPassword ? 'Passwords do not match' : undefined"
              class="w-full"
              size="lg"
            >
              <template #trailing>
                <UButton
                  color="gray"
                  variant="ghost"
                  icon
                  @click="showConfirmPassword = !showConfirmPassword"
                >
                  <UIcon
                    :name="showConfirmPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                  />
                </UButton>
              </template>
            </UInput>
          </div>

          <UButton
            type="submit"
            block
            size="lg"
            color="primary"
            :loading="loading"
            :disabled="!canSubmit"
            @click="resetPassword"
          >
            Reset Password
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Set page metadata
import { useAppRoutes } from '~/composables/useRoutes'

useHead({
  title: 'Reset Password - QuickMeazure',
})

// Set layout for this page
definePageMeta({
  layout: 'auth',
})

// Composable
const route = useRoute()
const router = useRouter()
const toast = useToast()
const routes = useAppRoutes()

// State
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const token = ref(route.params.token as string)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// Computed properties for password validation
const passwordsMatch = computed(() => {
  return !confirmPassword.value || password.value === confirmPassword.value
})

const canSubmit = computed(() => {
  return password.value && confirmPassword.value && password.value === confirmPassword.value
})

const resetPassword = async () => {
  if (!canSubmit.value) return

  loading.value = true
  try {
    // Send request to reset password
    const response = await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: {
        token: token.value,
        password: password.value,
      },
    })

    if (response.success) {
      toast.add({
        title: 'Success',
        description: 'Your password has been reset successfully.',
        color: 'green',
      })

      // Clear fields
      password.value = ''
      confirmPassword.value = ''

      // Redirect to login
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    }
  } catch (error) {
    toast.add({
      title: 'Error',
      description:
        error.response?.data?.message ||
        'Failed to reset password. The link may be invalid or expired.',
      color: 'red',
    })
  } finally {
    loading.value = false
  }
}
</script>
