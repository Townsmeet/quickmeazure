<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
          <p class="text-gray-500 dark:text-gray-400">
            This is your public tailor business profile.
          </p>
        </div>
      </div>
    </div>
    <SettingsProfileForm />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'setup-required'],
  layout: 'dashboard',
})
</script>
