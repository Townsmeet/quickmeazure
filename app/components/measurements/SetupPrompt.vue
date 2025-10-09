<template>
  <UModal v-model="isOpen">
    <UCard>
      <template #header>
        <div class="flex items-center gap-3">
          <UIcon name="i-heroicons-ruler" class="w-6 h-6 text-primary-500" />
          <h3 class="text-lg font-semibold">Let's Get You Set Up</h3>
        </div>
      </template>

      <div class="space-y-4">
        <p class="text-gray-600">
          Before you start, let's set up your measurement templates. This will help you track client
          measurements more efficiently.
        </p>

        <div class="bg-blue-50 p-4 rounded-lg">
          <div class="flex">
            <div class="flex-shrink-0">
              <UIcon name="i-heroicons-light-bulb" class="h-5 w-5 text-blue-400" />
            </div>
            <div class="ml-3">
              <p class="text-sm text-blue-700">Setting up now will help you:</p>
              <ul class="mt-1 text-sm text-blue-600 list-disc pl-5 space-y-1">
                <li>Create reusable measurement templates</li>
                <li>Standardize measurements across clients</li>
                <li>Save time on future client onboarding</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-between">
          <UButton color="neutral" variant="ghost" @click="handleLater"> Remind Me Later </UButton>
          <UButton color="primary" :loading="isLoading" @click="handleSetup"> Set Up Now </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import { useLocalStorage } from '@vueuse/core'

// Emits
const emit = defineEmits<{
  (e: 'setup' | 'later'): void
}>()

// State
const isOpen = ref(true)
const isLoading = ref(false)

// User preferences - we'll use local storage for now
const userPrefs = useLocalStorage('user-preferences', {
  hasSeenSetupPrompt: false,
  setupCompleted: false,
})

const handleSetup = () => {
  isLoading.value = true
  emit('setup')
}

const handleLater = () => {
  isOpen.value = false
  // Update user preferences
  userPrefs.value.hasSeenSetupPrompt = true
  emit('later')
}

// Close the modal when navigating away
onBeforeUnmount(() => {
  isOpen.value = false
})
</script>
