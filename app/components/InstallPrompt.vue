<template>
  <Teleport to="body">
    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform translate-y-full opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform translate-y-full opacity-0"
    >
      <div
        v-if="$pwaInstall.isPromptVisible"
        class="fixed bottom-20 md:bottom-6 left-0 right-0 z-50 px-4 mx-auto"
      >
        <div
          class="max-w-md mx-auto bg-gradient-to-r from-primary-50 to-white rounded-xl shadow-xl border border-primary-100 p-5 flex flex-col sm:flex-row items-center sm:justify-between gap-4"
        >
          <!-- Icon and text section -->
          <div class="flex items-center space-x-4 w-full sm:w-auto sm:text-left">
            <div class="flex items-center justify-center bg-primary-100 p-3 rounded-full">
              <UIcon name="i-heroicons-scissors" class="text-primary-600 text-2xl" />
            </div>
            <div>
              <p class="font-bold text-gray-800 text-lg">Install QuickMeazure</p>
              <p class="text-sm text-gray-600 mt-1">Get quick access on your device</p>
            </div>
          </div>

          <!-- Buttons section -->
          <div class="flex space-x-3 w-full sm:w-auto justify-center sm:justify-end">
            <UButton
              color="neutral"
              variant="outline"
              size="md"
              class="px-4"
              @click="$pwaInstall.dismissPrompt"
            >
              Later
            </UButton>
            <UButton
              color="primary"
              size="md"
              class="px-5 font-medium"
              @click="$pwaInstall.showInstallPrompt"
            >
              <UIcon name="i-heroicons-arrow-down-tray" class="mr-1" />
              Install
            </UButton>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
// Using the pwaInstall plugin for state management
</script>
