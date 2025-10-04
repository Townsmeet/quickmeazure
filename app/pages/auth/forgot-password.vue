<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-gray-50 space-y-6">
    <!-- Title and Subtitle - Outside Card -->
    <div class="text-center mb-6 w-full max-w-md">
      <h2 class="text-2xl md:text-3xl font-bold text-gray-900">Forgot your password?</h2>
      <p class="mt-2 text-gray-600">
        Enter your email address and we'll send you a link to reset your password.
      </p>
    </div>

    <div class="w-full max-w-md space-y-6 p-4 sm:p-8 bg-white rounded-xl shadow">
      <form class="mt-8 space-y-6">
        <div class="space-y-4 flex flex-col">
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">Email address</label>
            <UInput
              v-model="email"
              type="email"
              placeholder="Email address"
              required
              class="w-full"
              size="lg"
            />
          </div>
        </div>

        <UButton
          type="submit"
          block
          size="lg"
          color="primary"
          :loading="loading"
          :disabled="!email || loading"
          @click.prevent="sendResetLink"
        >
          Send Reset Link
        </UButton>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppRoutes } from '~/composables/useRoutes'
import { useRouter } from 'vue-router'

// Composable
const routes = useAppRoutes()
const router = useRouter()
const toast = useToast()

// Constants
const LOGIN_PATH = routes.ROUTE_PATHS[routes.ROUTE_NAMES.AUTH.LOGIN] as string

// Set page metadata
useHead({
  title: 'Forgot Password',
})

// Set layout for this page
definePageMeta({
  layout: 'auth',
})

// State
const email = ref('')
const loading = ref(false)

const sendResetLink = async () => {
  if (!email.value) return

  loading.value = true
  try {
    // Send request to reset password
    const response = await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: email.value },
    })

    if (response.success) {
      toast.add({
        title: 'Success',
        description: 'If there is an account with that email, we have sent a password reset link.',
        color: 'primary',
        icon: 'i-heroicons-check-circle',
      })

      // Clear email
      email.value = ''

      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push(LOGIN_PATH)
      }, 2000)
    }
  } catch (_error) {
    // Don't reveal if the email exists or not for security
    toast.add({
      title: 'Success',
      description: 'If there is an account with that email, we have sent a password reset link.',
      color: 'primary',
      icon: 'i-heroicons-check-circle',
    })
  } finally {
    loading.value = false
  }
}
</script>
