<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-gray-50 space-y-6">
    <LogoLink />
    <!-- Title and Subtitle - Outside Card -->
    <div class="text-center mb-6 w-full max-w-md">
      <h2 class="text-2xl md:text-3xl font-bold text-gray-900">Reset Your Password</h2>
      <p class="mt-2 text-gray-600">Enter your new password below</p>
    </div>

    <div class="w-full max-w-md space-y-6 p-4 sm:p-8 bg-white rounded-xl shadow">
      <div v-if="invalidToken" class="text-center py-4">
        <UIcon name="i-heroicons-exclamation-circle" class="text-red-500 h-12 w-12 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900">Invalid or Expired Link</h3>
        <p class="mt-2 text-gray-500">This password reset link is invalid or has expired.</p>
        <UButton to="/auth/forgot-password" color="primary" class="mt-4">
          Request a new link
        </UButton>
      </div>

      <UForm
        :schema="resetPasswordSchema"
        :state="state"
        class="mt-8 space-y-6"
        @submit="resetPassword"
      >
        <div class="space-y-4 flex flex-col">
          <UFormField label="New Password" name="password">
            <UInput
              v-model="state.password"
              type="password"
              placeholder="Enter your new password"
              class="w-full"
              size="lg"
              autocomplete="new-password"
              required
            />
            <div v-if="state.password" class="mt-2">
              <div class="flex items-center gap-2">
                <div
                  class="h-1 flex-grow rounded-full"
                  :class="[passwordStrength >= 1 ? 'bg-green-500' : 'bg-gray-200']"
                />
                <div
                  class="h-1 flex-grow rounded-full"
                  :class="[passwordStrength >= 2 ? 'bg-green-500' : 'bg-gray-200']"
                />
                <div
                  class="h-1 flex-grow rounded-full"
                  :class="[passwordStrength >= 3 ? 'bg-green-500' : 'bg-gray-200']"
                />
                <div
                  class="h-1 flex-grow rounded-full"
                  :class="[passwordStrength >= 4 ? 'bg-green-500' : 'bg-gray-200']"
                />
              </div>
              <p class="text-xs mt-1 text-gray-600">
                Password should be at least 8 characters with uppercase, lowercase, number and
                special character
              </p>
            </div>
          </UFormField>

          <UFormField label="Confirm New Password" name="confirmPassword">
            <UInput
              v-model="state.confirmPassword"
              type="password"
              placeholder="Confirm your new password"
              class="w-full"
              size="lg"
              autocomplete="new-password"
              required
            />
          </UFormField>
        </div>

        <UButton
          type="submit"
          block
          size="lg"
          color="primary"
          :loading="loading"
          :disabled="loading"
        >
          Reset Password
        </UButton>
      </UForm>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types'
import { resetPasswordSchema, type ResetPasswordData } from '~/schemas/auth'
import LogoLink from '~/components/common/LogoLink.vue'

// Set page metadata
useHead({
  title: 'Reset Password',
})

// Set layout for this page
definePageMeta({
  layout: 'auth',
  middleware: 'guest-only',
})

const route = useRoute()
const router = useRouter()
const toast = useToast()

const state = reactive<ResetPasswordData>({
  password: '',
  confirmPassword: '',
  token: route.query.token as string,
})
const loading = ref(false)
const invalidToken = ref(false)

// Check token on page load
onMounted(async () => {
  if (!state.token) {
    invalidToken.value = true
    return
  }

  // Verify token is valid
  try {
    loading.value = true
    const response = await $fetch('/api/auth/verify-reset-token', {
      method: 'POST',
      body: { token: state.token },
    })

    if (!response.valid) {
      invalidToken.value = true
    }
  } catch (error) {
    console.error('Token verification error:', error)
    invalidToken.value = true
  } finally {
    loading.value = false
  }
})

// Password strength indicator
const passwordStrength = computed(() => getPasswordStrength(state.password))

// Reset password
const resetPassword = async (_event: FormSubmitEvent<ResetPasswordData>) => {
  loading.value = true

  try {
    const response = await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: {
        token: state.token,
        password: state.password,
      },
    })

    if (response.success) {
      toast.add({
        title: 'Success',
        description: 'Your password has been reset successfully.',
        color: 'primary',
        icon: 'i-heroicons-check-circle',
      })

      // Wait a moment then redirect to login
      setTimeout(() => {
        router.push('/auth/login')
      }, 1500)
    } else {
      toast.add({
        title: 'Error',
        description: response.message || 'Failed to reset password',
        color: 'error',
        icon: 'i-heroicons-exclamation-circle',
      })
    }
  } catch (error) {
    console.error('Password reset error:', error)
    toast.add({
      title: 'Error',
      description: 'An error occurred while resetting your password',
      color: 'error',
      icon: 'i-heroicons-exclamation-circle',
    })
  } finally {
    loading.value = false
  }
}
</script>
