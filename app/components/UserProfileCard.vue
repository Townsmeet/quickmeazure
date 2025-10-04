<template>
  <UCard class="bg-white shadow border-0">
    <div class="flex flex-col items-center">
      <!-- User Avatar with Initials -->
      <div
        class="w-20 h-20 rounded-full bg-primary-500 flex items-center justify-center text-white text-2xl font-bold mb-4"
      >
        {{ userStore.initials || 'U' }}
      </div>

      <!-- User Name and Email -->
      <h3 class="text-xl font-semibold">{{ userStore.displayName }}</h3>
      <p class="text-gray-500 mb-4">{{ userStore.profile?.email }}</p>

      <!-- Subscription Status Badge -->
      <UBadge :color="subscriptionColor" class="mb-4">
        {{ subscriptionLabel }}
      </UBadge>

      <!-- Subscription Details -->
      <div v-if="userStore.isSubscriptionActive" class="w-full">
        <h4 class="font-medium text-gray-700 mb-2">Your Plan Features</h4>
        <ul class="space-y-1">
          <li
            v-for="feature in userStore.subscriptionDetails.features"
            :key="feature"
            class="flex items-center text-sm"
          >
            <UIcon name="i-heroicons-check-circle" class="text-green-500 mr-2" />
            {{ feature }}
          </li>
        </ul>

        <div class="mt-4 pt-4 border-t border-gray-100">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm text-gray-600">Client Limit</span>
            <span class="font-medium">{{ userStore.subscriptionDetails.clientLimit }}</span>
          </div>

          <div
            v-if="userStore.subscriptionDetails.expiryDate"
            class="flex justify-between items-center"
          >
            <span class="text-sm text-gray-600">Expires</span>
            <span class="font-medium">{{
              formatDate(userStore.subscriptionDetails.expiryDate)
            }}</span>
          </div>
        </div>
      </div>

      <!-- Upgrade CTA for Free Users -->
      <div v-else class="w-full mt-4">
        <p class="text-sm text-gray-600 mb-4">
          Upgrade to access premium features and increase your client limit.
        </p>
        <UButton
block
color="primary"
to="/subscription/plans"
class="mt-2"> Upgrade Now </UButton>
      </div>
    </div>
  </UCard>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '~/store'

// Get user store
const userStore = useUserStore()

// Computed properties for subscription display
const subscriptionLabel = computed(() => {
  const { status, plan } = userStore.subscriptionDetails

  switch (status) {
    case 'active':
      return `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`
    case 'trial':
      return 'Trial Plan'
    case 'expired':
      return 'Expired Subscription'
    default:
      return 'Free Plan'
  }
})

const subscriptionColor = computed(() => {
  const { status } = userStore.subscriptionDetails

  switch (status) {
    case 'active':
      return 'green'
    case 'trial':
      return 'blue'
    case 'expired':
      return 'red'
    default:
      return 'gray'
  }
})

// Format date helper
function formatDate(dateString) {
  if (!dateString) return 'N/A'

  const date = new Date(dateString)
  const format = userStore.preferences.dateFormat || 'MM/DD/YYYY'

  // Simple date formatting (in real app, use a library like date-fns)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const year = date.getFullYear()

  if (format === 'MM/DD/YYYY') {
    return `${month}/${day}/${year}`
  } else if (format === 'DD/MM/YYYY') {
    return `${day}/${month}/${year}`
  } else {
    return `${year}-${month}-${day}`
  }
}
</script>
