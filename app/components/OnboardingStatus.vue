<template>
  <div v-if="!isComplete" class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
    <div class="flex items-start">
      <UIcon
        name="i-heroicons-information-circle"
        class="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0"
      />
      <div class="flex-1">
        <h3 class="text-sm font-medium text-blue-800 mb-1">Complete Your Setup</h3>
        <p class="text-sm text-blue-700 mb-3">
          {{ statusMessage }}
        </p>

        <!-- Action Button -->
        <UButton
          v-if="requiredPath && showActionButton"
          size="sm"
          color="info"
          @click="handleNextStep"
        >
          {{ getActionButtonText() }}
        </UButton>
      </div>

      <!-- Dismiss Button -->
      <UButton
        v-if="dismissible"
        variant="ghost"
        color="info"
        size="sm"
        :padded="false"
        @click="dismiss"
      >
        <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  dismissible?: boolean
  showActionButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  dismissible: false,
  showActionButton: true,
})

const { statusMessage, requiredPath, isComplete, currentStep, goToNextStep } = useOnboarding()

const isDismissed = ref(false)

const dismiss = () => {
  isDismissed.value = true
}

const handleNextStep = async () => {
  await goToNextStep()
}

const getActionButtonText = () => {
  switch (currentStep.value) {
    case 'verification':
      return 'Verify Email'
    case 'subscription':
      return 'Choose Plan'
    case 'setup':
      return 'Complete Setup'
    default:
      return 'Continue'
  }
}
</script>
