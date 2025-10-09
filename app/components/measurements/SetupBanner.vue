<template>
  <div v-if="showBanner" class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded">
    <div class="flex">
      <div class="flex-shrink-0">
        <UIcon name="i-heroicons-information-circle" class="h-5 w-5 text-blue-400" />
      </div>
      <div class="ml-3">
        <p class="text-sm text-blue-700">
          Complete your setup to get the most out of QuickMeazure.
          <button
            class="font-medium text-blue-700 hover:text-blue-600 underline"
            :disabled="isLoading"
            @click="handleSetup"
          >
            Set up now
          </button>
          or
          <button
            class="font-medium text-blue-700 hover:text-blue-600"
            :disabled="isLoading"
            @click="handleDismiss"
          >
            dismiss
          </button>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'

const emit = defineEmits<{
  (e: 'setup'): void
}>()

// State
const showBanner = ref(true)
const isLoading = ref(false)
const userPrefs = useLocalStorage('user-preferences', {
  hasSeenSetupPrompt: false,
  setupCompleted: false,
  hasDismissedBanner: false,
})

const handleSetup = () => {
  isLoading.value = true
  emit('setup')
}

const handleDismiss = () => {
  showBanner.value = false
  // Update user preferences
  userPrefs.value.hasDismissedBanner = true
}
</script>
