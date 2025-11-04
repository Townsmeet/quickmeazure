<template>
  <UApp :toaster="{ position: 'top-right' }">
    <!-- Removed ClientOnly wrapper to fix navigation double-click issue -->
    <NuxtLayout>
      <template #default>
        <!-- Removed :route prop which was causing reactivity issues -->
        <NuxtPage />
      </template>
    </NuxtLayout>

    <!-- Loading indicator moved outside the main navigation flow -->
    <ClientOnly>
      <template #fallback>
        <div class="fixed inset-0 flex justify-center items-center bg-white bg-opacity-80 z-50">
          <UIcon name="i-heroicons-arrow-path" class="animate-spin text-5xl text-primary-500" />
        </div>
      </template>
    </ClientOnly>

    <!-- PWA Install Prompt - Only show in production -->
    <ClientOnly>
      <InstallPrompt v-if="!isDev" />
    </ClientOnly>
    <Analytics />
  </UApp>
</template>

<script setup>
import InstallPrompt from '~/components/InstallPrompt.vue'
import { Analytics } from '@vercel/analytics/nuxt'

// Check if we're in development mode
const isDev = import.meta.dev
</script>
