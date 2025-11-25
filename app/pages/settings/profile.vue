<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <img src="/logo.png" alt="QuickMeazure Logo" class="h-8 w-auto md:hidden" />
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
          </div>
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
