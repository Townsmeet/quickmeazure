<template>
  <UModal
    :model-value="true"
    :mask-closable="false"
    :esc-closable="false"
    :ui="{ overlay: '', close: 'hidden' }"
  >
    <UCard>
      <template #header>
        <div class="flex items-center gap-3">
          <UIcon name="i-heroicons-cog-6-tooth" class="w-6 h-6 text-primary-500" />
          <h3 class="text-lg font-semibold">Complete Your Setup</h3>
        </div>
      </template>

      <div class="space-y-4">
        <p class="text-gray-600">
          Set up your measurement templates to start managing clients efficiently.
        </p>

        <div class="bg-primary-50 p-4 rounded-lg">
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-check-circle" class="h-5 w-5 text-primary-500" />
            <div>
              <p class="text-sm font-medium text-primary-900">Quick Setup</p>
              <p class="text-sm text-primary-700">Takes less than 2 minutes</p>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <UButton color="primary" :loading="isLoading" @click="handleSetup"> Set Up Now </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const isLoading = ref(false)

const handleSetup = async () => {
  isLoading.value = true
  await navigateTo('/settings/setup-measurements')
  isLoading.value = false
}
</script>
