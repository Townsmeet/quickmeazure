<template>
  <div
    class="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 space-y-6"
  >
    <LogoLink />
    <!-- Title and Subtitle - Outside Card -->
    <div class="text-center mb-6 w-full max-w-md">
      <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
        Create your account
      </h2>
      <p class="mt-2 text-gray-600 dark:text-gray-300">Start managing your tailor business.</p>
    </div>

    <div
      class="max-w-md w-full space-y-6 bg-white dark:bg-gray-800 p-4 sm:p-8 rounded-xl shadow dark:shadow-gray-700/50"
    >
      <!-- Google Sign Up Button -->
      <!-- <div class="mt-8">
        <UButton
          block
          size="lg"
          variant="outline"
          class="flex items-center justify-center"
          :loading="isGoogleLoading"
          @click="handleGoogleRegister"
        >
          <UIcon name="i-simple-icons-google" class="mr-2 text-lg" />
          Sign up with Google
        </UButton>
      </div> -->

      <!-- Divider -->
      <!-- <div class="relative my-4">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300" />
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-white text-gray-500">or sign up with email</span>
        </div>
      </div> -->

      <UForm
        :schema="registerSchema"
        :state="state"
        class="space-y-6"
        autocomplete="off"
        @submit="onSubmit"
      >
        <div class="space-y-6">
          <div class="space-y-2">
            <UFormField label="Full Name" name="name">
              <UInput
                id="fullName"
                v-model="state.name"
                name="name"
                placeholder="Your full name"
                class="w-full"
                autocomplete="name"
                required
              />
            </UFormField>
          </div>

          <div class="space-y-2">
            <UFormField label="Email" name="email">
              <UInput
                id="email"
                v-model="state.email"
                name="email"
                type="email"
                placeholder="Your email address"
                class="w-full"
                autocomplete="email"
                required
              />
            </UFormField>
          </div>

          <div class="space-y-2">
            <UFormField label="Password" name="password">
              <UInput
                id="password"
                v-model="state.password"
                name="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Choose a strong password"
                size="lg"
                class="w-full"
                autocomplete="new-password"
                required
              >
                <template #trailing>
                  <UButton
                    color="neutral"
                    variant="link"
                    size="sm"
                    :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                    @click="showPassword = !showPassword"
                  />
                </template>
              </UInput>
            </UFormField>
            <div v-if="state.password" class="mt-2">
              <div class="flex items-center gap-2">
                <div
                  class="h-1 flex-grow rounded-full"
                  :class="[passwordStrength >= 1 ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700']"
                />
                <div
                  class="h-1 flex-grow rounded-full"
                  :class="[passwordStrength >= 2 ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700']"
                />
                <div
                  class="h-1 flex-grow rounded-full"
                  :class="[passwordStrength >= 3 ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700']"
                />
                <div
                  class="h-1 flex-grow rounded-full"
                  :class="[passwordStrength >= 4 ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700']"
                />
              </div>
              <p class="text-xs mt-1 text-gray-600 dark:text-gray-400">
                Password should be at least 8 characters with uppercase, lowercase, number and
                special character
              </p>
            </div>
          </div>

          <div class="space-y-2">
            <UFormField label="Confirm Password" name="confirmPassword">
              <UInput
                id="confirmPassword"
                v-model="state.confirmPassword"
                name="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="Confirm your password"
                size="lg"
                class="w-full"
                :ui="{ trailing: 'pe-1' }"
                autocomplete="new-password"
                required
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
            </UFormField>
          </div>
        </div>

        <UFormField name="agreeToTerms">
          <div class="flex items-center">
            <UCheckbox
              id="terms"
              v-model="state.agreeToTerms"
              name="agreeToTerms"
              required
              size="lg"
            />
            <label for="terms" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              I agree to the
              <ULink to="/legal/terms" class="font-medium text-primary-600"> terms </ULink>
              and
              <ULink to="/legal/privacy" class="font-medium text-primary-600">
                privacy policies
              </ULink>
              <span class="text-red-500">*</span>
            </label>
          </div>
        </UFormField>

        <div>
          <UButton
            type="submit"
            color="primary"
            block
            size="lg"
            :loading="isLoading"
            :disabled="isLoading"
            aria-label="Create account with email"
          >
            Create Account with Email
          </UButton>
        </div>

        <div class="text-center my-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?
            <ULink to="/auth/login" class="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </ULink>
          </p>
        </div>
      </UForm>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types'
import { registerSchema, type RegisterData } from '~/schemas/auth'
import LogoLink from '~/components/common/LogoLink.vue'

definePageMeta({
  layout: 'auth',
  middleware: 'guest-only',
})

const { register, signUpWithGoogle, isLoading } = useAuth()
const toast = useToast()

// Form state
const state = reactive<RegisterData>({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeToTerms: true,
})

const isGoogleLoading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// Password strength and validation
const passwordStrength = computed(() => getPasswordStrength(state.password))

// Submit handler (schema is enforced by UForm)
const onSubmit = async (_event: FormSubmitEvent<RegisterData>) => {
  try {
    const result = await register(state.name, state.email, state.password)

    if (result.error) {
      toast.add({
        title: 'Registration failed',
        description: result.error.message,
        color: 'error',
        icon: 'i-heroicons-exclamation-circle',
      })
      return
    }

    // Check if email verification is required
    if (result.requiresVerification) {
      toast.add({
        title: 'Registration successful!',
        description: 'Please check your email to verify your account.',
        icon: 'i-heroicons-check-circle',
        color: 'success',
      })

      await navigateTo({
        path: '/auth/verify-email',
        query: { email: result.email },
      })
    } else {
      // Direct login (fallback if verification is disabled)
      toast.add({
        title: 'Registration successful!',
        description: 'Welcome to QuickMeazure!',
        icon: 'i-heroicons-check-circle',
        color: 'success',
      })

      // Use onboarding system to determine next step
      const { goToNextStep } = useOnboarding()
      goToNextStep()
    }
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message,
      icon: 'i-heroicons-exclamation-circle',
      color: 'error',
    })
  }
}

// Handle Google registration
const _handleGoogleRegister = async () => {
  isGoogleLoading.value = true

  try {
    const { error } = await signUpWithGoogle()

    if (error) {
      toast.add({
        title: 'Google Sign-up Failed',
        description: error.message,
        color: 'error',
        icon: 'i-heroicons-exclamation-circle',
      })
    }
    // If successful, Better Auth will redirect to Google OAuth
  } catch (_error: any) {
    toast.add({
      title: 'Google Sign-up Failed',
      description: 'Something went wrong. Please try again.',
      color: 'error',
      icon: 'i-heroicons-exclamation-circle',
    })
  } finally {
    isGoogleLoading.value = false
  }
}
</script>
