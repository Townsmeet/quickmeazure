<template>
  <UCard class="bg-white shadow border-0">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium">User Preferences</h3>
        <UButton
          v-if="hasChanges"
          size="sm"
          color="primary"
          :loading="isSaving"
          @click="savePreferences"
        >
          Save Changes
        </UButton>
      </div>
    </template>

    <div class="space-y-6">
      <!-- Theme Preference -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2"> Theme </label>
        <URadioGroup v-model="preferences.theme" class="flex space-x-4">
          <URadio value="light" label="Light" />
          <URadio value="dark" label="Dark" />
          <URadio value="system" label="System Default" />
        </URadioGroup>
      </div>

      <!-- Measurement Units -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2"> Measurement Units </label>
        <URadioGroup v-model="preferences.measurementUnit" class="flex space-x-4">
          <URadio value="imperial" label="Imperial (in)" />
          <URadio value="metric" label="Metric (cm)" />
        </URadioGroup>
      </div>

      <!-- Date Format -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2"> Date Format </label>
        <USelect
          v-model="preferences.dateFormat"
          :options="[
            { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
            { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
            { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
          ]"
        />
      </div>

      <!-- Notification Preferences -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2"> Notifications </label>
        <div class="space-y-2">
          <UCheckbox v-model="preferences.notifications.email" label="Email Notifications" />
          <UCheckbox v-model="preferences.notifications.browser" label="Browser Notifications" />
          <UCheckbox v-model="preferences.notifications.mobile" label="Mobile Notifications" />
        </div>
      </div>

      <!-- Dashboard Layout -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2"> Dashboard Layout </label>
        <USelect
          v-model="preferences.dashboardLayout"
          :options="[
            { label: 'Default', value: 'default' },
            { label: 'Compact', value: 'compact' },
            { label: 'Expanded', value: 'expanded' },
          ]"
        />
      </div>
    </div>
  </UCard>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '~/store'

// Get user store
const userStore = useUserStore()

// Create a local copy of preferences to track changes
const preferences = ref({
  theme: 'system',
  measurementUnit: 'imperial',
  dateFormat: 'MM/DD/YYYY',
  notifications: {
    email: true,
    browser: true,
    mobile: true,
  },
  dashboardLayout: 'default',
})

// Initialize with current preferences
onMounted(() => {
  preferences.value = { ...userStore.preferences }
})

// Track saving state
const isSaving = ref(false)

// Detect if user has made changes
const hasChanges = computed(() => {
  // Compare current preferences with store preferences
  return JSON.stringify(preferences.value) !== JSON.stringify(userStore.preferences)
})

// Save preferences to store
async function savePreferences() {
  isSaving.value = true

  try {
    // Update preferences in the store
    userStore.updatePreferences(preferences.value)

    // Show success notification
    useToast().add({
      title: 'Preferences Saved',
      description: 'Your preferences have been updated successfully',
      color: 'green',
      timeout: 3000,
    })
  } catch (error) {
    console.error('Failed to save preferences:', error)

    // Show error notification
    useToast().add({
      title: 'Error',
      description: 'Failed to save preferences',
      color: 'red',
      timeout: 5000,
    })
  } finally {
    isSaving.value = false
  }
}
</script>
