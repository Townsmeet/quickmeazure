<template>
  <USlideover
    :open="isOpen"
    title="Client Details"
    side="right"
    @update:open="value => !value && $emit('close')"
  >
    <template #body>
      <div v-if="client" class="space-y-6">
        <!-- Client Header -->
        <div class="flex items-center space-x-4 pb-6 border-b border-gray-200">
          <UAvatar
:text="getInitials(client.name)"
size="3xl"
color="primary"
class="shadow-lg" />
          <div>
            <h3 class="text-xl font-semibold text-gray-900">{{ client.name }}</h3>
            <div class="flex items-center space-x-2 mt-1">
              <UBadge v-if="(client.orderCount || 0) > 0" color="info" variant="soft">
                {{ client.orderCount }}
                {{ client.orderCount === 1 ? 'Order' : 'Orders' }}
              </UBadge>
            </div>
          </div>
        </div>

        <!-- Contact Information -->
        <div class="space-y-4">
          <h4 class="text-lg font-medium text-gray-900">Contact Information</h4>
          <div class="space-y-3">
            <div v-if="client.email" class="flex items-center text-sm">
              <UIcon name="i-heroicons-envelope" class="w-5 h-5 mr-3 text-gray-400" />
              <span class="text-gray-900">{{ client.email }}</span>
            </div>
            <div v-if="client.phone" class="flex items-center text-sm">
              <UIcon name="i-heroicons-phone" class="w-5 h-5 mr-3 text-gray-400" />
              <span class="text-gray-900">{{ client.phone }}</span>
            </div>
            <div v-if="client.gender" class="flex items-center text-sm">
              <UIcon name="i-heroicons-user" class="w-5 h-5 mr-3 text-gray-400" />
              <span class="text-gray-900 capitalize">{{ client.gender }}</span>
            </div>
            <div v-if="client.address" class="flex items-start text-sm">
              <UIcon
                name="i-heroicons-map-pin"
                class="w-5 h-5 mr-3 text-gray-400 mt-0.5 flex-shrink-0"
              />
              <span class="text-gray-900">{{ client.address }}</span>
            </div>
            <div class="flex items-center text-sm">
              <UIcon name="i-heroicons-calendar" class="w-5 h-5 mr-3 text-gray-400" />
              <span class="text-gray-900"
                >Added {{ dayjs(client.createdAt).format('MMMM D, YYYY') }}</span
              >
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div v-if="client.notes" class="space-y-4">
          <h4 class="text-lg font-medium text-gray-900">Notes</h4>
          <div class="p-4 bg-blue-50 rounded-lg">
            <p class="text-sm text-blue-900">{{ client.notes }}</p>
          </div>
        </div>

        <!-- Statistics -->
        <div class="space-y-4">
          <h4 class="text-lg font-medium text-gray-900">Statistics</h4>
          <div class="p-4 bg-gray-50 rounded-lg">
            <div class="text-sm text-gray-600 flex items-center gap-6">
              <span>
                <span class="font-medium">Orders:</span>
                <span class="font-bold text-gray-900 ml-1 text-lg">{{
                  client.orderCount || 0
                }}</span>
              </span>
              <span>
                <span class="font-medium">Revenue:</span>
                <span class="font-bold text-green-600 ml-1 text-lg"
                  >₦{{ (client.totalRevenue || 0).toLocaleString() }}</span
                >
              </span>
            </div>
          </div>
        </div>

        <!-- Measurements -->
        <div class="space-y-4">
          <h4 class="text-lg font-medium text-gray-900">
            Measurements
            <span
              v-if="client.measurement?.values?._template?.name"
              class="text-sm font-normal text-gray-600"
            >
              ({{ client.measurement.values._template.name
              }}{{
                client.measurement.values._template.unit
                  ? ' - ' + client.measurement.values._template.unit
                  : ''
              }})
            </span>
            <span v-else-if="client.measurement" class="text-sm font-normal text-gray-600">
              ({{ commonUnitDisplay }})
            </span>
          </h4>
          <div v-if="client.measurement && client.measurement.values">
            <div class="grid grid-cols-2 gap-4">
              <div
                v-for="[key, measurement] in Object.entries(client.measurement.values).filter(
                  ([k]) => k !== '_template'
                )"
                :key="key"
                class="p-3 bg-gray-50 rounded-lg"
              >
                <div class="text-sm font-medium text-gray-900 capitalize">
                  {{
                    typeof measurement === 'object' && measurement.name
                      ? measurement.name
                      : key.replace(/_/g, ' ')
                  }}
                </div>
                <div class="text-lg font-semibold text-primary-600">
                  {{ typeof measurement === 'object' ? measurement.value : measurement }}
                </div>
                <div
                  v-if="typeof measurement === 'object' && measurement.notes"
                  class="text-xs text-gray-500 mt-1"
                >
                  {{ measurement.notes }}
                </div>
              </div>
            </div>
            <div v-if="client.measurement.notes" class="mt-4 p-3 bg-blue-50 rounded-lg">
              <div class="text-sm font-medium text-blue-900">Notes</div>
              <div class="text-sm text-blue-700 mt-1">{{ client.measurement.notes }}</div>
            </div>
            <div class="text-xs text-gray-500 mt-2">
              Last updated:
              {{ dayjs(client.measurement.lastUpdated).format('MMMM D, YYYY [at] h:mm A') }}
            </div>
          </div>
          <div v-else class="text-sm text-gray-500">No measurements recorded yet.</div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end space-x-3">
        <UButton color="neutral" variant="outline" @click="$emit('close')"> Close </UButton>
        <UButton color="primary" @click="client && $emit('edit', client)"> Edit Client </UButton>
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import type { Client } from '~/types/client'
import dayjs from 'dayjs'

interface Props {
  isOpen: boolean
  client: Client | null
}

interface Emits {
  (e: 'close'): void
  (e: 'edit', client: Client): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

const commonUnitDisplay = computed(() => {
  if (!props.client?.measurement?.values) return 'in'
  const units = Object.values(props.client.measurement.values)
    .map((v: any) => (typeof v === 'object' && v.unit ? v.unit : 'in'))
    .filter(Boolean)
  // Get most common unit or fallback to first or 'in'
  if (units.length === 0) return 'in'
  const freq: Record<string, number> = {}
  for (const u of units) freq[u] = (freq[u] || 0) + 1
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1])
  return sorted[0]?.[0] || 'in'
})

const getInitials = (name: string | undefined) => {
  if (!name) return 'N/A'
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
</script>
