<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-gray-50 space-y-6">
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

      <form v-else class="mt-8 space-y-6" @submit.prevent="resetPassword">
        <div class="space-y-4 flex flex-col">
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">New Password</label>
            <UInput
              v-model="password"
              type="password"
              placeholder="Enter your new password"
              required
              class="w-full"
              size="lg"
            />
            <div v-if="password" class="mt-2">
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
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">Confirm New Password</label>
            <UInput
              v-model="confirmPassword"
              type="password"
              placeholder="Confirm your new password"
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
          :disabled="!isFormValid || loading"
        >
          Reset Password
        </UButton>
      </form>
    </div>
  </div>
</template>

<script setup>
// Set page metadata
useHead({
  title: 'Reset Password',
})

// Set layout for this page
definePageMeta({
  layout: 'auth',
})

const route = useRoute()
const router = useRouter()
const toast = useToast()

const token = ref(route.query.token || '')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const invalidToken = ref(false)

// Check token on page load
onMounted(async () => {
  if (!token.value) {
    invalidToken.value = true
    return
  }

  // Verify token is valid
  try {
    loading.value = true
    const response = await $fetch('/api/auth/verify-reset-token', {
      method: 'POST',
      body: { token: token.value },
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

// Password validation
const hasLowerCase = str => /[a-z]/.test(str)
const hasUpperCase = str => /[A-Z]/.test(str)
const hasNumber = str => /\d/.test(str)
const hasSpecialChar = str => /[!@#$%^&*()_+\-={}();':"\\|,.<>/?]/.test(str)

const passwordStrength = computed(() => {
  if (!password.value) return 0

  let strength = 0
  if (password.value.length >= 8) strength++
  if (hasLowerCase(password.value) && hasUpperCase(password.value)) strength++
  if (hasNumber(password.value)) strength++
  if (hasSpecialChar(password.value)) strength++

  return strength
})

// Form validation
const isFormValid = computed(() => {
  return (
    password.value.length >= 8 &&
    password.value === confirmPassword.value &&
    passwordStrength.value >= 3
  )
})

// Reset password
const resetPassword = async () => {
  if (!isFormValid.value) return

  loading.value = true
  error.value = ''

  try {
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
        color: 'primary',
        icon: 'i-heroicons-check-circle',
      })

      // Wait a moment then redirect to login
      setTimeout(() => {
        router.push('/auth/login')
      }, 1500)
    } else {
      error.value = response.message || 'Failed to reset password'
    }
  } catch (error) {
    console.error('Password reset error:', error)
    error.value = 'An error occurred while resetting your password'
  } finally {
    loading.value = false
  }
}
</script>
