<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-gray-50 space-y-6">
    <!-- Title and Subtitle - Outside Card -->
    <div class="text-center mb-6 w-full max-w-md">
      <h2 class="text-2xl md:text-3xl font-bold text-gray-900">Verification Failed</h2>
      <p class="mt-2 text-gray-600">The verification link is invalid or expired</p>
    </div>

    <div class="w-full max-w-md space-y-6 p-4 sm:p-8 bg-white rounded-xl shadow">
      <div class="text-center space-y-4">
        <div class="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <UIcon name="i-heroicons-x-circle" class="w-8 h-8 text-red-600" />
        </div>
        <div class="space-y-2">
          <h3 class="text-lg font-semibold text-gray-900">Verification Link Expired</h3>
          <p class="text-sm text-gray-600">
            The verification link you clicked is no longer valid. This can happen if the link is too
            old or has already been used.
          </p>
        </div>
        <div class="space-y-3">
          <UButton block color="primary" @click="requestNewVerification">
            Send New Verification Email
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
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

const requestNewVerification = () => {
  navigateTo('/auth/resend-verification')
}
</script>
