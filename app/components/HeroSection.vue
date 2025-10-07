<template>
  <section class="py-12 sm:py-16 text-center">
    <h1 class="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
      Manage Your Tailoring Business <span class="text-primary-600">Efficiently</span>
    </h1>
    <p class="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
      QuickMeazure helps you track clients, measurements, orders, and more - all in one place.
    </p>
    <div class="flex flex-row gap-4 justify-center">
      <UButton
v-if="!isLoggedIn"
to="/auth/register"
color="primary"
size="xl">
        Get Started Free
      </UButton>
      <UButton
v-else
to="/dashboard"
color="primary"
size="xl"> Go to Dashboard </UButton>
      <UButton
to="#features"
color="neutral"
variant="outline"
size="xl"> Learn More </UButton>
    </div>
    <NuxtImg
      src="/dashboard.png"
      placeholder
      preload
      alt="Example Dashboard"
      class="w-full h-auto mt-8"
    />
  </section>
</template>

<script setup>
import { computed } from 'vue'
const { isAuthenticated } = useAuth()
const isLoggedIn = computed(() => isAuthenticated.value)
</script>
