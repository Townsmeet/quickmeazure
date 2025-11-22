<template>
  <section class="py-12 sm:py-16">
    <div class="flex flex-col-reverse md:flex-row items-center max-w-7xl mx-auto gap-12">
      <!-- TEXT + BUTTONS LEFT -->
      <div
        class="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left"
      >
        <h1 class="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Manage Your Tailoring Business <span class="text-primary-600">Efficiently</span>
        </h1>
        <p class="text-xl text-gray-600 dark:text-gray-300 mb-8">
          QuickMeazure helps you track clients, measurements, orders, and more — all in one place.
        </p>
        <div class="flex flex-row gap-4 justify-center md:justify-start w-full">
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
size="xl">Go to Dashboard</UButton>
          <UButton
to="#features"
color="neutral"
variant="outline"
size="xl">Learn More</UButton>
        </div>
      </div>
      <!-- IMAGE RIGHT -->
      <div class="w-full md:w-1/2 flex justify-center md:justify-end md:mb-0">
        <img src="/sewingmachine.png" alt="Sewing Machine" />
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
const { isAuthenticated } = useAuth()
const isLoggedIn = computed(() => isAuthenticated.value)
</script>
