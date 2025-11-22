<template>
  <div
    class="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 space-y-6"
  >
    <LogoLink />
    <!-- Title and Subtitle - Outside Card -->
    <div class="text-center mb-6 w-full max-w-md">
      <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
        Forgot your password?
      </h2>
      <p class="mt-2 text-gray-600 dark:text-gray-300">
        Enter your email address and we'll send you a link to reset your password.
      </p>
    </div>

    <div
      class="w-full max-w-md space-y-6 p-4 sm:p-8 bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-700/50"
    >
      <UForm
        :schema="forgotPasswordSchema"
        :state="state"
        class="mt-8 space-y-6"
        @submit="sendResetLink"
      >
        <div class="space-y-4 flex flex-col">
          <UFormField label="Email address" name="email">
            <UInput
              v-model="state.email"
              type="email"
              placeholder="Email address"
              class="w-full"
              size="lg"
              autocomplete="email"
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
          class="mb-4"
        >
          Send Reset Link
        </UButton>

        <div class="text-center text-sm text-gray-600 dark:text-gray-400">
          Remember your password?
          <NuxtLink to="/auth/login" class="text-primary-600 hover:text-primary-500 font-medium">
            Sign in
          </NuxtLink>
        </div>
      </UForm>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types'
import { forgotPasswordSchema, type ForgotPasswordData } from '~/schemas/auth'
import LogoLink from '~/components/common/LogoLink.vue'

definePageMeta({
  layout: 'auth',
  middleware: 'guest-only',
})

// Set page metadata
useHead({
  title: 'Forgot Password',
})

// State
const state = reactive<ForgotPasswordData>({
  email: '',
})
const loading = ref(false)
const router = useRouter()
const toast = useToast()

const sendResetLink = async (_event: FormSubmitEvent<ForgotPasswordData>) => {
  loading.value = true
  try {
    // Send request to reset password
    const response = await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: state.email },
    })

    if (response.success) {
      toast.add({
        title: 'Success',
        description: 'If there is an account with that email, we have sent a password reset link.',
        color: 'primary',
        icon: 'i-heroicons-check-circle',
      })

      // Clear email
      state.email = ''

      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push('/auth/login')
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
