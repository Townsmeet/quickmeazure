<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-gray-50 space-y-6">
    <!-- Title and Subtitle - Outside Card -->
    <div class="text-center mb-6 w-full max-w-md">
      <h2 class="text-2xl md:text-3xl font-bold text-gray-900">Create your account</h2>
      <p class="mt-2 text-gray-600">Start managing your tailor business.</p>
    </div>

    <div class="max-w-md w-full space-y-6 bg-white p-4 sm:p-8 rounded-xl shadow">
      <!-- Google Sign Up Button -->
      <div class="mt-8">
        <UButton
          block
          size="lg"
          variant="outline"
          class="flex items-center justify-center"
          @click="handleGoogleRegister"
        >
          <UIcon name="i-simple-icons-google" class="mr-2 text-lg" />
          Sign up with Google
        </UButton>
      </div>

      <!-- Divider -->
      <div class="relative my-4">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300" />
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-white text-gray-500">or sign up with email</span>
        </div>
      </div>

      <form class="space-y-6" @submit.prevent="handleRegister">
        <div class="space-y-6">
          <div class="space-y-2">
            <label for="fullName" class="block text-sm font-medium text-gray-700">
              Full Name <span class="text-red-500">*</span>
            </label>
            <UInput
              id="fullName"
              v-model="name"
              name="name"
              placeholder="Your full name"
              required
              size="lg"
              class="w-full"
              :state="formErrors.name ? 'error' : undefined"
            >
              <template #trailing>
                <UIcon v-if="name" name="i-heroicons-check-circle" class="text-green-500" />
              </template>
            </UInput>
            <p v-if="formErrors.name" class="mt-1 text-sm text-red-600">
              {{ formErrors.name }}
            </p>
          </div>

          <div class="space-y-2">
            <label for="email" class="block text-sm font-medium text-gray-700">
              Email <span class="text-red-500">*</span>
            </label>
            <UInput
              id="email"
              v-model="email"
              name="email"
              type="email"
              placeholder="Your email address"
              required
              size="lg"
              class="w-full"
              :state="formErrors.email ? 'error' : undefined"
            >
              <template #trailing>
                <UIcon
                  v-if="email && email.includes('@')"
                  name="i-heroicons-check-circle"
                  class="text-green-500"
                />
              </template>
            </UInput>
            <p v-if="formErrors.email" class="mt-1 text-sm text-red-600">
              {{ formErrors.email }}
            </p>
          </div>

          <div class="space-y-2">
            <label for="password" class="block text-sm font-medium text-gray-700">
              Password <span class="text-red-500">*</span>
            </label>
            <UInput
              id="password"
              v-model="password"
              name="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Choose a strong password"
              required
              size="lg"
              class="w-full"
              :ui="{ trailing: 'pe-1' }"
            >
              <template #trailing>
                <UButton
                  color="neutral"
                  variant="link"
                  size="sm"
                  :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                  @click="showPassword = !showPassword"
                />
              </template>
            </UInput>
            <div v-if="password && !isPasswordValid" class="mt-2">
              <div class="flex justify-between items-center mb-1">
                <span class="text-sm text-gray-600">Password strength</span>
                <span
                  class="text-sm"
                  :class="{
                    'text-red-500': passwordStrength <= 1,
                    'text-yellow-500': passwordStrength === 2,
                    'text-blue-500': passwordStrength === 3,
                    'text-green-500': passwordStrength === 4,
                  }"
                >
                  {{
                    passwordStrength === 0
                      ? 'Very weak'
                      : passwordStrength === 1
                        ? 'Weak'
                        : passwordStrength === 2
                          ? 'Fair'
                          : passwordStrength === 3
                            ? 'Good'
                            : 'Strong'
                  }}
                </span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="h-2 rounded-full transition-all duration-300"
                  :class="{
                    'bg-red-500': passwordStrength <= 1,
                    'bg-yellow-500': passwordStrength === 2,
                    'bg-blue-500': passwordStrength === 3,
                    'bg-green-500': passwordStrength === 4,
                  }"
                  :style="{ width: `${(passwordStrength / 4) * 100}%` }"
                ></div>
              </div>

              <!-- Password criteria checklist -->
              <div class="mt-3 space-y-1">
                <div class="text-sm">
                  <div class="flex items-center space-x-2">
                    <UIcon
                      :name="
                        password.length >= 8 ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'
                      "
                      :class="password.length >= 8 ? 'text-green-600' : 'text-gray-500'"
                      class="h-4 w-4"
                    />
                    <span :class="password.length >= 8 ? 'text-green-600' : 'text-gray-500'"
                      >At least 8 characters</span
                    >
                  </div>
                  <div class="flex items-center space-x-2">
                    <UIcon
                      :name="
                        hasUpperCase(password) && hasLowerCase(password)
                          ? 'i-heroicons-check-circle'
                          : 'i-heroicons-x-circle'
                      "
                      :class="
                        hasUpperCase(password) && hasLowerCase(password)
                          ? 'text-green-600'
                          : 'text-gray-500'
                      "
                      class="h-4 w-4"
                    />
                    <span
                      :class="
                        hasUpperCase(password) && hasLowerCase(password)
                          ? 'text-green-600'
                          : 'text-gray-500'
                      "
                      >Upper and lowercase letters</span
                    >
                  </div>
                  <div class="flex items-center space-x-2">
                    <UIcon
                      :name="
                        hasNumber(password) ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'
                      "
                      :class="hasNumber(password) ? 'text-green-600' : 'text-gray-500'"
                      class="h-4 w-4"
                    />
                    <span :class="hasNumber(password) ? 'text-green-600' : 'text-gray-500'"
                      >At least one number</span
                    >
                  </div>
                  <div class="flex items-center space-x-2">
                    <UIcon
                      :name="
                        hasSpecialChar(password)
                          ? 'i-heroicons-check-circle'
                          : 'i-heroicons-x-circle'
                      "
                      :class="hasSpecialChar(password) ? 'text-green-600' : 'text-gray-500'"
                      class="h-4 w-4"
                    />
                    <span :class="hasSpecialChar(password) ? 'text-green-600' : 'text-gray-500'"
                      >Special character</span
                    >
                  </div>
                </div>
              </div>
            </div>
            <p v-if="formErrors.password" class="mt-1 text-sm text-red-600">
              {{ formErrors.password }}
            </p>
          </div>

          <div class="space-y-2">
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
              Confirm Password <span class="text-red-500">*</span>
            </label>
            <UInput
              id="confirmPassword"
              v-model="confirmPassword"
              name="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="Confirm your password"
              required
              size="lg"
              class="w-full"
              :color="passwordMismatchError ? 'error' : undefined"
              :ui="{ trailing: 'pe-1' }"
            >
              <template #trailing>
                <UButton
                  color="neutral"
                  variant="link"
                  size="sm"
                  :icon="showConfirmPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
                  @click="showConfirmPassword = !showConfirmPassword"
                />
              </template>
            </UInput>
            <div v-if="passwordMismatchError" class="text-red-500 text-sm mt-1">
              <div class="flex items-center">
                <UIcon name="i-heroicons-exclamation-circle" class="mr-1 h-4 w-4" />
                Passwords do not match
              </div>
            </div>
            <p v-else-if="formErrors.confirmPassword" class="mt-1 text-sm text-red-600">
              {{ formErrors.confirmPassword }}
            </p>
          </div>
        </div>

        <div class="flex items-center">
          <div class="flex items-center">
            <UCheckbox
id="terms"
v-model="agreeToTerms"
name="terms"
required
size="lg" />
            <label for="terms" class="ml-2 block text-sm text-gray-700">
              I agree to the
              <ULink :to="ROUTE_PATHS[LEGAL.TERMS]" class="font-medium"> terms </ULink>
              and
              <ULink :to="ROUTE_PATHS[LEGAL.PRIVACY]" class="font-medium"> privacy policies </ULink>
              <span class="text-red-500">*</span>
            </label>
          </div>
        </div>
        <p v-if="formErrors.terms" class="mt-1 text-sm text-red-600">
          {{ formErrors.terms }}
        </p>

        <div>
          <UButton
            type="submit"
            color="primary"
            block
            size="lg"
            :loading="isLoading"
            :disabled="!isFormValid"
            aria-label="Create account with email"
          >
            Create Account with Email
          </UButton>
        </div>

        <div class="text-center my-4">
          <p class="text-sm text-gray-600">
            Already have an account?
            <ULink :to="ROUTE_PATHS[AUTH.LOGIN]" class="font-medium"> Sign in </ULink>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTE_NAMES, ROUTE_PATHS } from '~/constants/routes'

const router = useRouter()
const toast = useToast()

// Constants
const { AUTH, LEGAL } = ROUTE_NAMES
const CONFIRM_PATH = ROUTE_NAMES.AUTH.CONFIRM

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const agreeToTerms = ref(false)
const isLoading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const formErrors = ref<Record<string, string>>({})

const hasLowerCase = (str: string) => /[a-z]/.test(str)
const hasUpperCase = (str: string) => /[A-Z]/.test(str)
const hasNumber = (str: string) => /\d/.test(str)
const hasSpecialChar = (str: string) => /[!@#$%^&*()_+\-={}();':"\\|,.<>/?]/.test(str)

const passwordStrength = computed(() => {
  if (!password.value) return 0

  let strength = 0
  if (password.value.length >= 8) strength++
  if (hasLowerCase(password.value) && hasUpperCase(password.value)) strength++
  if (hasNumber(password.value)) strength++
  if (hasSpecialChar(password.value)) strength++

  return strength
})

const passwordMismatchError = computed(() => {
  return password.value && confirmPassword.value && password.value !== confirmPassword.value
})

const isPasswordValid = computed(() => {
  return (
    password.value.length >= 8 &&
    hasUpperCase(password.value) &&
    hasLowerCase(password.value) &&
    hasNumber(password.value) &&
    hasSpecialChar(password.value)
  )
})

const isFormValid = computed(() => {
  const fieldsValid =
    !!name.value &&
    !!email.value &&
    !!password.value &&
    password.value === confirmPassword.value &&
    agreeToTerms.value

  return fieldsValid && isPasswordValid.value
})

const validateForm = () => {
  const errors: Record<string, string> = {}

  if (!name.value.trim()) {
    errors.name = 'Name is required'
  }

  if (!email.value.trim()) {
    errors.email = 'Email is required'
  } else if (!/^\S+@\S+\.\S+$/.test(email.value)) {
    errors.email = 'Please enter a valid email address'
  }

  if (!password.value) {
    errors.password = 'Password is required'
  } else {
    const passwordIssues = []

    if (password.value.length < 8) {
      passwordIssues.push('at least 8 characters')
    }
    if (!hasUpperCase(password.value)) {
      passwordIssues.push('an uppercase letter')
    }
    if (!hasLowerCase(password.value)) {
      passwordIssues.push('a lowercase letter')
    }
    if (!hasNumber(password.value)) {
      passwordIssues.push('a number')
    }
    if (!hasSpecialChar(password.value)) {
      passwordIssues.push('a special character')
    }

    if (passwordIssues.length > 0) {
      errors.password = `Password must include ${passwordIssues.join(', ')}`
    }
  }

  if (password.value !== confirmPassword.value) {
    errors.confirmPassword = 'Passwords do not match'
  }

  if (!agreeToTerms.value) {
    errors.terms = 'You must agree to the terms and privacy policy'
  }

  formErrors.value = errors
  return Object.keys(errors).length === 0
}

async function handleRegister() {
  formErrors.value = {}

  if (!validateForm()) {
    return
  }

  isLoading.value = true

  try {
    const response = await $fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: name.value,
        email: email.value,
        password: password.value,
        subscriptionPlan: 'free',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response) {
      throw new Error('No response received from server')
    }

    // The API returns { user, token } directly, not wrapped in success/data
    if (!response.user || !response.token) {
      throw new Error('Invalid response format from server')
    }

    // Show success message
    toast.add({
      title: 'Registration Successful',
      description: 'Your account has been created. Please select your subscription plan.',
      color: 'primary',
      icon: 'i-heroicons-check-circle',
    })

    // Redirect to subscription plan confirmation page
    await router.push(CONFIRM_PATH)
  } catch (error: any) {
    console.error('Registration error:', error)
    const errorMessage = error.data?.message || error.message || 'Registration failed'

    // Handle specific error cases
    if (
      errorMessage.toLowerCase().includes('email is already registered') ||
      errorMessage.toLowerCase().includes('email already exists') ||
      errorMessage.toLowerCase().includes('email already registered')
    ) {
      formErrors.value.email =
        'This email is already registered. Please use a different email or login instead.'
    } else if (errorMessage.toLowerCase().includes('email')) {
      formErrors.value.email = errorMessage
    } else if (errorMessage.toLowerCase().includes('password')) {
      formErrors.value.password = errorMessage
    } else {
      toast.add({
        title: 'Registration Error',
        description: errorMessage,
        color: 'error',
        icon: 'i-heroicons-exclamation-triangle',
      })
    }
  } finally {
    isLoading.value = false
  }
}

// Handle Google registration (same as login)
async function handleGoogleRegister() {
  try {
    // Show notification that Google sign-up is not currently available
    toast.add({
      title: 'Google Sign-up',
      description: 'Google sign-up is currently not available. Please use email and password.',
      color: 'warning',
      icon: 'i-heroicons-information-circle',
    })
  } catch (error) {
    console.error('Google registration error:', error)
  }
}
</script>
