<template>
  <div class="w-full max-w-md mx-auto mb-8">
    <!-- Progress Bar -->
    <div class="relative">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-gray-700">Setup Progress</span>
        <span class="text-sm text-gray-500">{{ progress }}%</span>
      </div>

      <div class="w-full bg-gray-200 rounded-full h-2">
        <div
          class="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-in-out"
          :style="{ width: `${progress}%` }"
        />
      </div>
    </div>

    <!-- Steps Indicator -->
    <div class="flex justify-between mt-4">
      <div
        v-for="(step, index) in onboardingSteps"
        :key="step.key"
        class="flex flex-col items-center"
      >
        <!-- Step Circle -->
        <div
          class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200"
          :class="getStepClasses(step, index)"
        >
          <UIcon v-if="isStepCompleted(step)" name="i-heroicons-check" class="w-4 h-4" />
          <span v-else>{{ index + 1 }}</span>
        </div>

        <!-- Step Label -->
        <span
          class="text-xs mt-1 text-center max-w-16 transition-colors duration-200"
          :class="isStepActive(step) ? 'text-primary-600 font-medium' : 'text-gray-500'"
        >
          {{ step.label }}
        </span>
      </div>
    </div>

    <!-- Current Step Description -->
    <div v-if="currentStep" class="mt-4 text-center">
      <p class="text-sm text-gray-600">
        {{ currentStep.description }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onboardingSteps } from '~/utils/onboarding'

const { currentOnboardingStep, onboardingProgress } = useAuth()

const progress = computed(() => onboardingProgress.value)

const currentStep = computed(() => {
  return onboardingSteps.find(step => step.key === currentOnboardingStep.value)
})

const isStepCompleted = (step: any) => {
  const currentIndex = onboardingSteps.findIndex(s => s.key === currentOnboardingStep.value)
  const stepIndex = onboardingSteps.findIndex(s => s.key === step.key)
  return stepIndex < currentIndex || currentOnboardingStep.value === 'complete'
}

const isStepActive = (step: any) => {
  return step.key === currentOnboardingStep.value
}

const getStepClasses = (step: any, index: number) => {
  if (isStepCompleted(step)) {
    return 'bg-green-500 text-white'
  } else if (isStepActive(step)) {
    return 'bg-primary-600 text-white'
  } else {
    return 'bg-gray-200 text-gray-500'
  }
}
</script>
