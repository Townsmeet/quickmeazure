<template>
  <div class="sentry-test-container p-4 border rounded-lg bg-gray-50 my-4">
    <h3 class="text-lg font-medium mb-2">Sentry Integration Test</h3>
    <p class="text-sm text-gray-600 mb-4">
      Click the button below to trigger a test error that will be captured by Sentry.
    </p>
    <UButton color="red" @click="triggerTestError"> Throw Test Error </UButton>
  </div>
</template>

<script setup>
import { captureException } from '@sentry/nuxt'

const triggerTestError = () => {
  try {
    // Deliberately throw an error for testing
    throw new Error('This is a test error from QuickMeazure')
  } catch (error) {
    // Capture the error with Sentry
    captureException(error)
    // Also show an alert to the user
    alert('Test error triggered and sent to Sentry!')
  }
}
</script>
