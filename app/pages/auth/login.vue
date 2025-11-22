<template>
  <div
    class="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 space-y-6"
  >
    <LogoLink />
    <!-- Title and Subtitle - Outside Card -->
    <div class="text-center mb-6 w-full max-w-md">
      <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
        Sign in to your account
      </h2>
      <p class="mt-2 text-gray-600 dark:text-gray-300">to start managing your clients and orders</p>
    </div>

    <div
      class="w-full max-w-md space-y-6 p-4 sm:p-8 bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-700/50"
    >
      <!-- Google Sign In Button -->
      <!-- <div>
        <UButton
          block
          size="lg"
          variant="outline"
          class="flex items-center justify-center"
          :loading="isGoogleLoading"
          @click="handleGoogleLogin"
        >
          <UIcon name="i-simple-icons-google" class="mr-2 text-lg" />
          Sign in with Google
        </UButton>
      </div> -->

      <!-- Divider -->
      <!-- <div class="relative my-4">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300" />
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-white text-gray-500">or continue with email</span>
        </div>
      </div> -->

      <UForm
:schema="loginSchema"
:state="state"
class="space-y-6"
@submit="onSubmit">
        <div class="space-y-4 flex flex-col">
          <UFormField label="Email" name="email">
            <UInput
              v-model="state.email"
              type="email"
              placeholder="you@example.com"
              icon="i-heroicons-envelope"
              class="w-full"
              required
            />
          </UFormField>

          <UFormField label="Password" name="password">
            <UInput
              v-model="state.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              icon="i-heroicons-lock-closed"
              class="w-full"
              required
            >
              <template #trailing>
                <UButton
                  color="neutral"
                  variant="ghost"
                  :padded="false"
                  @click="showPassword = !showPassword"
                >
                  <UIcon
                    :name="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                    class="h-5 w-5 text-gray-500 hover:text-gray-700"
                  />
                </UButton>
              </template>
            </UInput>
          </UFormField>

          <div class="flex items-center justify-between">
            <UCheckbox v-model="state.remember" name="remember" label="Remember me" />
            <NuxtLink
              to="/auth/forgot-password"
              class="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              Forgot password?
            </NuxtLink>
          </div>
        </div>

        <UButton
          type="submit"
          block
          color="primary"
          size="lg"
          :loading="isLoading"
          :disabled="isLoading"
        >
          Sign in with Email
        </UButton>

        <div class="text-center my-4">
          <p class="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?
            <NuxtLink
              to="/auth/register"
              class="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign up
            </NuxtLink>
          </p>
        </div>
      </UForm>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types'
import { loginSchema, type LoginData } from '~/schemas/auth'

definePageMeta({
  layout: 'auth',
  middleware: 'guest-only',
})

const { login, isLoading } = useAuth()
// const isGoogleLoading = ref(false)
const toast = useToast()
const route = useRoute()

// Form state
const state = reactive<LoginData>({
  email: '',
  password: '',
  remember: false,
})

const showPassword = ref(false)

// Handle form submission (Nuxt UI v4 provides validated state through UForm)
const onSubmit = async (_event: FormSubmitEvent<LoginData>) => {
  try {
    const { error } = await login(state.email, state.password, state.remember)
    if (error) {
      toast.add({
        title: 'Login failed',
        description: error.message,
        icon: 'i-heroicons-exclamation-circle',
        color: 'error',
      })
      return
    }

    toast.add({
      title: 'Login successful',
      description: 'Welcome back!',
      icon: 'i-heroicons-check-circle',
      color: 'success',
    })

    // Handle redirect after successful login using onboarding system
    const redirectTo = route.query.redirect as string
    if (redirectTo) {
      await navigateTo(decodeURIComponent(redirectTo))
    } else {
      // Use onboarding system to determine where to redirect
      const { requiredOnboardingPath } = useAuth()
      const nextPath = requiredOnboardingPath.value || '/dashboard'
      await navigateTo(nextPath)
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

// Google login handler
// const handleGoogleLogin = async () => {
//   isGoogleLoading.value = true

//   try {
//     const { error } = await signInWithGoogle()

//     if (error) {
//       toast.add({
//         title: 'Google Sign-in Failed',
//         description: error.message,
//         color: 'error',
//         icon: 'i-heroicons-exclamation-circle',
//       })
//     }
//     // If successful, Better Auth will redirect to Google OAuth
//   } catch (error: any) {
//     toast.add({
//       title: 'Google Sign-in Failed',
//       description: 'Something went wrong. Please try again.',
//       color: 'error',
//       icon: 'i-heroicons-exclamation-circle',
//     })
//   } finally {
//     isGoogleLoading.value = false
//   }
// }
</script>
