<template>
  <div class="space-y-6">
    <!-- Order Header -->
    <div class="flex items-start justify-between">
      <div>
        <h2 class="text-xl font-semibold text-gray-900">Order #{{ order.orderNumber }}</h2>
        <p class="text-sm text-gray-500 mt-1">Created {{ formatDate(order.createdAt) }}</p>
      </div>
      <UBadge
:color="getStatusColor(order.status)"
variant="subtle"
size="lg"
class="capitalize">
        {{ formatStatus(order.status) }}
      </UBadge>
    </div>

    <!-- Client Information -->
    <div class="bg-gray-50 rounded-lg p-4">
      <h3 class="text-sm font-medium text-gray-900 mb-3">Client Information</h3>
      <div class="space-y-2">
        <div class="flex items-center">
          <UIcon name="i-heroicons-user" class="w-4 h-4 text-gray-400 mr-2" />
          <span class="text-sm text-gray-900">
            {{ displayClientName }}
          </span>
        </div>
        <div v-if="order.client?.email" class="flex items-center">
          <UIcon name="i-heroicons-envelope" class="w-4 h-4 text-gray-400 mr-2" />
          <span class="text-sm text-gray-600">{{ order.client.email }}</span>
        </div>
        <div v-if="order.client?.phone" class="flex items-center">
          <UIcon name="i-heroicons-phone" class="w-4 h-4 text-gray-400 mr-2" />
          <span class="text-sm text-gray-600">{{ order.client.phone }}</span>
        </div>
      </div>
    </div>

    <!-- Order Details, Financials, Items, Notes, Measurements -->
    <!-- ... (keep existing detail layout, excluding action buttons) ... -->
  </div>
  <!-- If you want a close button, parent should use a slot, not this file -->
</template>

<script setup lang="ts">
import type { Order } from '~/types/order'
import { computed } from 'vue'

interface Props {
  order: Order
}
const props = defineProps<Props>()

const displayClientName = computed(() => {
  const client = props.order.client
  if (client) {
    const name = client.firstName || client.clientName || 'N/A'
    const lastName = client.lastName
    return lastName ? `${name} ${lastName}` : name
  }
  return props.order.clientName || 'N/A'
})

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
function formatStatus(status: string) {
  return status
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
function getStatusColor(status: string) {
  switch (status) {
    case 'completed':
    case 'delivered':
      return 'success'
    case 'processing':
    case 'shipped':
      return 'info'
    case 'pending':
      return 'warning'
    case 'cancelled':
    case 'refunded':
      return 'error'
    case 'draft':
      return 'neutral'
    default:
      return 'neutral'
  }
}
</script>
