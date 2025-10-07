<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-gray-50 space-y-6">
    <!-- Title and Subtitle - Outside Card -->
    <div class="text-center mb-6 w-full max-w-md">
      <h2 class="text-2xl md:text-3xl font-bold text-gray-900">Email Verified!</h2>
      <p class="mt-2 text-gray-600">Your account is ready to set up</p>
    </div>

    <div class="w-full max-w-md space-y-6 p-4 sm:p-8 bg-white rounded-xl shadow">
      <!-- Loading state (brief) -->
      <div v-if="isVerifying" class="text-center space-y-4">
        <div class="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-blue-600 animate-spin" />
        </div>
        <div class="space-y-2">
          <h3 class="text-lg font-semibold text-gray-900">Finalizing verification...</h3>
          <p class="text-sm text-gray-600">Just a moment while we complete the process.</p>
        </div>
      </div>

      <!-- Success state -->
      <div v-else class="text-center space-y-4">
        <div class="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <UIcon name="i-heroicons-check-circle" class="w-8 h-8 text-green-600" />
        </div>
        <div class="space-y-2">
          <h3 class="text-lg font-semibold text-gray-900">Verification Complete!</h3>
          <p class="text-sm text-gray-600">
            Your email has been successfully verified. You can now complete your account setup.
          </p>
        </div>
        <UButton block color="primary" @click="continueToSetup">
          Continue to Account Setup
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

const route = useRoute()
const toast = useToast()

const isVerifying = ref(true)

// Handle verification callback
onMounted(async () => {
  const error = route.query.error

  if (error) {
    await navigateTo('/auth/verify-error')
    return
  }

  const { markEmailVerified } = useOnboardingUpdates()

  setTimeout(async () => {
    isVerifying.value = false

    // Mark email as verified in onboarding system
    await markEmailVerified()

    toast.add({
      title: 'Email verified!',
      description: 'Your email has been successfully verified.',
      color: 'success',
    })
  }, 1500)

  try {
    const { data } = await authClient.getSession()
    console.log('🔍 Updated session after verification:', data)
  } catch (sessionError) {
    console.warn('Could not refresh session, but verification was successful:', sessionError)
  }
})

const continueToSetup = () => {
  const { goToNextStep } = useOnboarding()
  goToNextStep()
}
</script>
