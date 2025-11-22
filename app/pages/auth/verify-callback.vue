<template>
  <div
    class="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 space-y-6"
  >
    <LogoLink />
    <!-- Title and Subtitle - Outside Card -->
    <div class="text-center mb-6 w-full max-w-md">
      <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Email Verified!</h2>
      <p class="mt-2 text-gray-600 dark:text-gray-300">Your account is ready to set up</p>
    </div>

    <div
      class="w-full max-w-md space-y-6 p-4 sm:p-8 bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-700/50"
    >
      <!-- Loading state (brief) -->
      <div v-if="isVerifying" class="text-center space-y-4">
        <div
          class="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center"
        >
          <UIcon
            name="i-heroicons-arrow-path"
            class="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin"
          />
        </div>
        <div class="space-y-2">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Finalizing verification...
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Just a moment while we complete the process.
          </p>
        </div>
      </div>

      <!-- Success state -->
      <div v-else class="text-center space-y-4">
        <div
          class="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center"
        >
          <UIcon
            name="i-heroicons-check-circle"
            class="w-8 h-8 text-green-600 dark:text-green-400"
          />
        </div>
        <div class="space-y-2">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Verification Complete!
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
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
import LogoLink from '~/components/common/LogoLink.vue'
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

    // Check if user session exists after verification
    try {
      const { data: sessionData } = await authClient.getSession()

      if (sessionData?.user) {
        // User is authenticated via better-auth
        console.log('User session confirmed after verification:', sessionData.user.email)

        toast.add({
          title: 'Email verified!',
          description: 'Your email has been successfully verified.',
          color: 'success',
        })
      } else {
        console.warn('No session found after verification')
        toast.add({
          title: 'Verification complete',
          description: 'Please sign in to continue with your subscription.',
          color: 'warning',
        })

        // Redirect to login page since no session exists
        await navigateTo('/auth/login')
        return
      }
    } catch (sessionError) {
      console.warn('Could not verify session after email verification:', sessionError)
      toast.add({
        title: 'Verification complete',
        description: 'Please sign in to continue with your subscription.',
        color: 'warning',
      })

      // Redirect to login page
      await navigateTo('/auth/login')
      return
    }
  }, 1500)
})

const continueToSetup = () => {
  const { goToNextStep } = useOnboarding()
  goToNextStep()
}
</script>
