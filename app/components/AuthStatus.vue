<template>
  <div
    v-if="showDebug"
    class="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-xs z-50"
  >
    <h4 class="font-semibold mb-2">Auth Status</h4>
    <div class="space-y-1">
      <div class="flex justify-between">
        <span>Authenticated:</span>
        <UBadge :color="isAuthenticated ? 'success' : 'error'" size="xs">
          {{ isAuthenticated ? 'Yes' : 'No' }}
        </UBadge>
      </div>
      <div class="flex justify-between">
        <span>Setup Complete:</span>
        <UBadge :color="hasCompletedSetup ? 'success' : 'error'" size="xs">
          {{ hasCompletedSetup ? 'Yes' : 'No' }}
        </UBadge>
      </div>
      <div class="flex justify-between">
        <span>Can Access:</span>
        <UBadge :color="canAccessRoute ? 'success' : 'error'" size="xs">
          {{ canAccessRoute ? 'Yes' : 'No' }}
        </UBadge>
      </div>
      <div class="text-xs text-gray-500 mt-2">Route: {{ route.path }}</div>
      <div v-if="redirectPath" class="text-xs text-orange-600 mt-1">
        Should redirect to: {{ redirectPath }}
      </div>
    </div>
    <UButton
size="xs"
variant="ghost"
class="mt-2 w-full"
@click="showDebug = false">
      Hide
    </UButton>
  </div>

  <!-- Toggle button when hidden -->
  <UButton
    v-else
    size="xs"
    variant="outline"
    class="fixed bottom-4 right-4 z-50"
    @click="showDebug = true"
  >
    Auth Debug
  </UButton>
</template>

<script setup lang="ts">
const { user, isAuthenticated } = useAuth()
const { canAccessRoute, getRedirectPath } = useRouteProtection()
const route = useRoute()

const showDebug = ref(false)

const hasCompletedSetup = computed(() => user.value?.hasCompletedSetup !== false)
const redirectPath = computed(() => getRedirectPath())

// Only show in development
const isDev = process.env.NODE_ENV === 'development'

// Hide component in production
if (!isDev) {
  showDebug.value = false
}
</script>
