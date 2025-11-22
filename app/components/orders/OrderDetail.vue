<template>
  <USlideover
    :open="isOpen"
    :title="order ? `Order #${order.orderNumber}` : 'Order Details'"
    side="right"
    @update:open="value => !value && $emit('close')"
  >
    <template #body>
      <div v-if="order" class="space-y-8">
        <!-- Order Header -->
        <div class="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
                Order #{{ order.orderNumber }}
              </h2>
              <UBadge
                :color="getStatusColor(order.status)"
                variant="subtle"
                size="md"
                class="capitalize px-2.5 py-1"
              >
                {{ formatStatus(order.status) }}
              </UBadge>
            </div>
            <div class="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span class="flex items-center gap-1.5">
                <UIcon name="i-heroicons-calendar" class="w-4 h-4" />
                Created {{ formatDate(order.createdAt) }}
              </span>
              <span v-if="order.dueDate" class="flex items-center gap-1.5">
                <UIcon name="i-heroicons-clock" class="w-4 h-4" />
                Due {{ formatDate(order.dueDate) }}
              </span>
            </div>
          </div>

          <!-- Status Badge -->
          <div class="flex items-center gap-3">
            <UBadge
              v-if="order.paymentStatus"
              :color="getPaymentStatusColor(order.paymentStatus)"
              variant="soft"
              size="md"
              class="capitalize px-3 py-1.5"
            >
              <UIcon name="i-heroicons-credit-card" class="w-4 h-4 mr-1.5" />
              {{ formatPaymentStatus(order.paymentStatus) }}
            </UBadge>
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Left Column (Client, Style) -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Client & Style Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Client Card -->
              <div
                class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm"
              >
                <div class="flex items-center justify-between mb-4">
                  <h3
                    class="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2"
                  >
                    <UIcon name="i-heroicons-user" class="w-5 h-5 text-gray-400" />
                    Client Details
                  </h3>
                </div>
                <div class="space-y-3">
                  <div class="flex items-center gap-3">
                    <UAvatar :alt="displayClientName" size="md" />
                    <div>
                      <p class="font-medium text-gray-900 dark:text-white">
                        {{ displayClientName }}
                      </p>
                      <p class="text-sm text-gray-500 dark:text-gray-400">
                        Client ID: {{ order.clientId }}
                      </p>
                    </div>
                  </div>
                  <div class="pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2 text-sm">
                    <div
                      v-if="order.client?.email"
                      class="flex items-center text-gray-600 dark:text-gray-300"
                    >
                      <UIcon name="i-heroicons-envelope" class="w-4 h-4 text-gray-400 mr-2.5" />
                      {{ order.client.email }}
                    </div>
                    <div
                      v-if="order.client?.phone"
                      class="flex items-center text-gray-600 dark:text-gray-300"
                    >
                      <UIcon name="i-heroicons-phone" class="w-4 h-4 text-gray-400 mr-2.5" />
                      {{ order.client.phone }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Style Card (Conditional) -->
              <div
                v-if="order.style || order.styleId"
                class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm"
              >
                <div class="flex items-center justify-between mb-4">
                  <h3
                    class="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2"
                  >
                    <UIcon name="i-heroicons-swatch" class="w-5 h-5 text-gray-400" />
                    Style Details
                  </h3>
                </div>
                <div class="space-y-3">
                  <div class="flex gap-4">
                    <div
                      class="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0"
                    >
                      <img
                        v-if="order.style?.imageUrl"
                        :src="order.style.imageUrl"
                        class="w-full h-full object-cover"
                      />
                      <UIcon v-else name="i-heroicons-photo" class="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <p class="font-medium text-gray-900 dark:text-white">{{ styleName }}</p>
                      <p
                        v-if="order.styleId"
                        class="text-sm text-gray-500 dark:text-gray-400 mt-0.5"
                      >
                        Style ID: {{ order.styleId }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Measurements -->
            <div
              v-if="measurementEntries.length"
              class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
            >
              <h3
                class="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"
              >
                <UIcon name="i-heroicons-scissors" class="w-5 h-5 text-gray-400" />
                Measurements
              </h3>
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                <div
                  v-for="(measurement, index) in measurementEntries"
                  :key="index"
                  class="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg"
                >
                  <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    {{ measurement.label }}
                  </p>
                  <p class="font-semibold text-gray-900 dark:text-white">{{ measurement.value }}</p>
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div
              v-if="order.notes"
              class="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/30 p-5"
            >
              <h3
                class="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-2 flex items-center gap-2"
              >
                <UIcon name="i-heroicons-document-text" class="w-4 h-4" />
                Notes
              </h3>
              <p
                class="text-sm text-amber-800 dark:text-amber-300 whitespace-pre-line leading-relaxed"
              >
                {{ order.notes }}
              </p>
            </div>
          </div>

          <!-- Right Column (Financials) -->
          <div class="space-y-6">
            <!-- Payment Summary -->
            <div
              class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
            >
              <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-5">
                Payment Summary
              </h3>

              <div class="space-y-3 mb-6">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600 dark:text-gray-400">Total Amount</span>
                  <span class="font-bold text-gray-900 dark:text-white">{{
                    formatCurrency(order.totalAmount)
                  }}</span>
                </div>
                <div v-if="order.paymentMethod" class="flex justify-between text-sm">
                  <span class="text-gray-600 dark:text-gray-400">Payment Method</span>
                  <span class="font-medium text-gray-900 dark:text-white">{{
                    formatPaymentMethod(order.paymentMethod)
                  }}</span>
                </div>
                <div v-if="order.paymentReference" class="flex justify-between text-sm">
                  <span class="text-gray-600 dark:text-gray-400">Reference</span>
                  <span
                    class="font-mono text-xs bg-gray-100 dark:bg-gray-900 px-1.5 py-0.5 rounded"
                    >{{ order.paymentReference }}</span
                  >
                </div>
              </div>

              <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3">
                <div class="flex justify-between text-sm items-center">
                  <span class="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                    <UIcon name="i-heroicons-banknotes" class="w-4 h-4" />
                    Advance Paid
                  </span>
                  <span class="font-semibold text-green-600">{{
                    formatCurrency(order.depositAmount)
                  }}</span>
                </div>
                <div
                  class="flex justify-between text-sm items-center pt-2 border-t border-gray-200 dark:border-gray-700"
                >
                  <span class="font-medium text-gray-900 dark:text-white">Balance Due</span>
                  <span class="font-bold text-red-500">{{
                    formatCurrency((order.totalAmount || 0) - (order.depositAmount || 0))
                  }}</span>
                </div>
              </div>
            </div>

            <!-- Addresses -->
            <div v-if="shippingEntries.length || billingEntries.length" class="space-y-4">
              <div
                v-if="shippingEntries.length"
                class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm"
              >
                <h3
                  class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"
                >
                  <UIcon name="i-heroicons-truck" class="w-4 h-4 text-gray-400" />
                  Shipping Address
                </h3>
                <div class="text-sm space-y-1 text-gray-600 dark:text-gray-300">
                  <div
                    v-for="entry in shippingEntries"
                    :key="entry.label"
                    class="flex justify-between"
                  >
                    <span class="text-gray-500">{{ entry.label }}:</span>
                    <span class="font-medium text-right">{{ entry.value }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end space-x-3">
        <UButton color="neutral" variant="outline" @click="$emit('close')"> Close </UButton>
        <UButton v-if="order" color="primary" @click="$emit('edit', order)"> Edit Order </UButton>
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import type { Order } from '~/types/order'
import { computed } from 'vue'

interface Props {
  isOpen: boolean
  order: Order | null
}
const props = defineProps<Props>()

const _emit = defineEmits<{
  (e: 'close'): void
  (e: 'edit', order: Order): void
}>()

const displayClientName = computed(() => {
  if (!props.order) return 'N/A'
  const client = props.order.client
  if (client) {
    const firstName = client.firstName || 'N/A'
    const lastName = client.lastName
    return lastName ? `${firstName} ${lastName}` : firstName
  }
  return props.order.clientName || 'N/A'
})

const normalizedMeasurements = computed(() => {
  if (!props.order) return []
  const raw = props.order.measurements
  if (!raw) return []

  let measurementData: Record<string, any> | null = null

  if (typeof raw === 'string') {
    try {
      measurementData = JSON.parse(raw)
    } catch {
      measurementData = null
    }
  } else {
    measurementData = raw
  }

  if (!measurementData || typeof measurementData !== 'object') return []

  return Object.entries(measurementData)
    .filter(([key]) => key !== '_template')
    .map(([key, value]) => ({
      label: formatLabel(key),
      value: resolveMeasurementValue(value),
    }))
})

const measurementEntries = computed(() => normalizedMeasurements.value)

const shippingEntries = computed(() =>
  props.order ? formatAddressEntries(props.order.shippingAddress) : []
)
const billingEntries = computed(() =>
  props.order ? formatAddressEntries(props.order.billingAddress) : []
)
const styleName = computed(() => props.order?.style?.name || 'Custom Design')

function formatDate(dateString?: string) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatStatus(status: string) {
  return status
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function formatPaymentStatus(status?: string) {
  if (!status) return 'Not set'
  return formatStatus(status)
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed':
    case 'delivered':
      return 'success'
    case 'processing':
    case 'in_progress':
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

function getPaymentStatusColor(status: string) {
  switch (status) {
    case 'paid':
      return 'success'
    case 'partially_paid':
      return 'warning'
    case 'pending':
      return 'info'
    case 'unpaid':
      return 'error'
    case 'refunded':
      return 'neutral'
    default:
      return 'neutral'
  }
}

function formatCurrency(value?: number | null) {
  if (typeof value !== 'number') return '₦0.00'
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(value)
}

function formatPaymentMethod(method?: string) {
  if (!method) return 'Not specified'
  return method
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function resolveMeasurementValue(value: any) {
  if (value == null) return '—'
  if (typeof value === 'object' && 'value' in value) {
    return value.value ?? '—'
  }
  return value
}

function formatLabel(label: string) {
  return label
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, char => char.toUpperCase())
}

function formatAddressEntries(address?: Record<string, any> | null) {
  if (!address || typeof address !== 'object') return []
  return Object.entries(address)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(([key, value]) => ({
      label: formatLabel(key),
      value: String(value),
    }))
}
</script>
