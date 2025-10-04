<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-gray-50 space-y-6">
    <!-- Title and Subtitle - Outside Card -->
    <div class="text-center mb-6 w-full max-w-md">
      <h2 class="text-2xl md:text-3xl font-bold text-gray-900">Sign in to your account</h2>
      <p class="mt-2 text-gray-600">to start managing your clients and orders</p>
    </div>

    <div class="w-full max-w-md space-y-6 p-4 sm:p-8 bg-white rounded-xl shadow">
      <!-- Google Sign In Button -->
      <div class="mt-8">
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
      </div>

      <!-- Divider -->
      <div class="relative my-4">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300" />
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-white text-gray-500">or continue with email</span>
        </div>
      </div>

      <ClientOnly>
        <form class="space-y-6" @submit.prevent="handleLogin">
          <div class="space-y-4 flex flex-col">
            <div class="space-y-2">
              <label for="email" class="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <UInput
                id="email"
                v-model="form.email"
                type="email"
                placeholder="Email address"
                required
                class="w-full"
                size="lg"
              />
            </div>

            <div class="space-y-2">
              <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
              <UInput
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Password"
                required
                class="w-full"
                size="lg"
              >
                <template #trailing>
                  <UButton color="neutral" variant="ghost" @click="showPassword = !showPassword">
                    <UIcon :name="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'" />
                  </UButton>
                </template>
              </UInput>
              <div class="flex justify-end mt-1">
                <NuxtLink
                  :to="AUTH.FORGOT_PASSWORD"
                  class="text-sm font-medium text-primary hover:text-primary"
                >
                  Forgot your password?
                </NuxtLink>
              </div>
            </div>
          </div>

          <UButton
            type="submit"
            block
            color="primary"
            size="lg"
            :loading="isFormLoading"
            :disabled="!form.email || !form.password"
            @click.prevent="handleLogin"
          >
            Sign in with Email
          </UButton>

          <div class="text-center my-4">
            <p class="mt-4 text-center text-sm text-gray-600">
              Don't have an account?
              <NuxtLink
                :to="AUTH.REGISTER"
                class="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign up
              </NuxtLink>
            </p>
          </div>
        </form>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import type { LoginCredentials } from '~/types/auth'
import { ROUTE_NAMES } from '~/constants/routes'
import { useAuthStore } from '~/store/modules/auth'

const toast = useToast()
const router = useRouter()
const authStore = useAuthStore()

const { AUTH, DASHBOARD } = ROUTE_NAMES

// Form state
const form = ref({
  email: '',
  password: '',
})

// UI state
const showPassword = ref(false)
const isFormLoading = ref(false)
const isGoogleLoading = ref(false)

// Form submission handler
async function handleLogin() {
  isFormLoading.value = true

  try {
    const loginCredentials: LoginCredentials = {
      email: form.value.email,
      password: form.value.password,
    }

    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: loginCredentials.email,
        password: loginCredentials.password,
      },
    })

    // Handle successful login
    const userData = response.user
    const authToken = response.token

    // Update auth state
    await authStore.setAuthState({
      user: userData,
      token: authToken,
    })

    // Redirect to dashboard or intended route
    const redirectTo = router.currentRoute.value.query.redirect as string
    await router.push(redirectTo || DASHBOARD.INDEX)
  } catch (error: any) {
    toast.add({
      title: 'Login Error',
      description: error.data.message,
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle',
    })
  } finally {
    isFormLoading.value = false
  }
}

async function handleGoogleLogin() {
  try {
    isGoogleLoading.value = true

    // Show notification that Google login is not currently available
    toast.add({
      title: 'Google Login',
      description: 'Google login is currently not available. Please use email and password.',
      color: 'warning',
      icon: 'i-heroicons-exclamation-triangle',
    })
  } catch (e) {
    console.error('Google login error:', e)
  } finally {
    isGoogleLoading.value = false
  }
}
</script>
