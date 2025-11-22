<template>
  <div
    class="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 space-y-6"
  >
    <LogoLink />
    <!-- Title and Subtitle - Outside Card -->
    <div class="text-center mb-6 w-full max-w-md">
      <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Check your email</h2>
      <p class="mt-2 text-gray-600 dark:text-gray-300">Click the verification link to continue</p>
    </div>

    <div
      class="w-full max-w-md space-y-6 p-4 sm:p-8 bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-700/50"
    >
      <div class="text-center space-y-4">
        <div
          class="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center"
        >
          <UIcon name="i-heroicons-envelope" class="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>

        <div class="space-y-2">
          <p class="text-sm text-gray-600 dark:text-gray-400">Verification email sent to:</p>
          <p
            class="text-sm font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md"
          >
            {{ email }}
          </p>
        </div>
      </div>

      <div class="space-y-4">
        <UButton
          block
          variant="outline"
          :loading="isLoading"
          :disabled="isLoading"
          @click="resendVerification"
        >
          Resend email
        </UButton>

        <div class="text-center">
          <NuxtLink
            to="/auth/login"
            class="text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            Back to sign in
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LogoLink from '~/components/common/LogoLink.vue'
definePageMeta({
  layout: 'auth',
})

const route = useRoute()
const toast = useToast()
const { sendVerificationEmail, isLoading } = useAuth()

// Get email from query params
const email = computed(() => {
  const emailParam = route.query.email
  return Array.isArray(emailParam) ? emailParam[0] : emailParam || ''
})

const resendVerification = async () => {
  if (!email.value) {
    toast.add({
      title: 'Error',
      description: 'Email address not found. Please try registering again.',
      color: 'error',
    })
    return
  }

  const { error } = await sendVerificationEmail(email.value)

  if (error) {
    toast.add({
      title: 'Error',
      description: error.message,
      color: 'error',
    })
    return
  }

  toast.add({
    title: 'Email sent',
    description: 'Verification email resent successfully.',
    color: 'success',
  })
}

// Redirect if no email provided
onMounted(() => {
  if (!email.value) {
    navigateTo('/auth/register')
  }
})
</script>
