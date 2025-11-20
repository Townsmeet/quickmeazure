<template>
  <div class="space-y-6">
    <!-- Order Header -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="text-xs uppercase tracking-wide text-gray-500 mb-1">Order Summary</p>
        <h2 class="text-2xl font-semibold text-gray-900">Order #{{ order.orderNumber }}</h2>
        <div class="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
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
      <div class="flex flex-col items-end gap-2">
        <UBadge
:color="getStatusColor(order.status)"
variant="subtle"
size="lg"
class="capitalize">
          {{ formatStatus(order.status) }}
        </UBadge>
        <UBadge
          v-if="order.paymentStatus"
          :color="getPaymentStatusColor(order.paymentStatus)"
          variant="soft"
          size="sm"
          class="capitalize"
        >
          {{ formatPaymentStatus(order.paymentStatus) }}
        </UBadge>
      </div>
    </div>

    <!-- Client & Style Information -->
    <div class="grid gap-4 md:grid-cols-2">
      <div class="bg-gray-50 rounded-lg p-4 space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-900">Client Information</h3>
          <UBadge color="neutral" variant="soft" size="xs">Client</UBadge>
        </div>
        <div class="space-y-2 text-sm">
          <div class="flex items-center text-gray-900 font-medium">
            <UIcon name="i-heroicons-user" class="w-4 h-4 text-gray-400 mr-2" />
            <span>{{ displayClientName }}</span>
          </div>
          <div v-if="order.client?.email" class="flex items-center text-gray-600">
            <UIcon name="i-heroicons-envelope" class="w-4 h-4 text-gray-400 mr-2" />
            <span>{{ order.client.email }}</span>
          </div>
          <div v-if="order.client?.phone" class="flex items-center text-gray-600">
            <UIcon name="i-heroicons-phone" class="w-4 h-4 text-gray-400 mr-2" />
            <span>{{ order.client.phone }}</span>
          </div>
        </div>
      </div>

      <div class="bg-gray-50 rounded-lg p-4 space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-900">Style Information</h3>
          <UBadge color="primary" variant="soft" size="xs">Style</UBadge>
        </div>
        <div class="space-y-2 text-sm">
          <div class="flex items-center text-gray-900 font-medium">
            <UIcon name="i-heroicons-swatch" class="w-4 h-4 text-gray-400 mr-2" />
            <span>{{ styleName }}</span>
          </div>
          <div v-if="order.styleId" class="flex items-center text-gray-600">
            <UIcon name="i-heroicons-tag" class="w-4 h-4 text-gray-400 mr-2" />
            <span>Style ID: {{ order.styleId }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Order & Payment Details -->
    <div class="grid gap-4 md:grid-cols-2">
      <div class="border border-gray-100 rounded-xl p-4 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-900">Order Details</h3>
        </div>
        <dl class="space-y-3 text-sm">
          <div class="flex justify-between">
            <dt class="text-gray-500">Order Number</dt>
            <dd class="font-medium text-gray-900">#{{ order.orderNumber }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-gray-500">Status</dt>
            <dd class="font-medium text-gray-900">{{ formatStatus(order.status) }}</dd>
          </div>
          <div v-if="order.dueDate" class="flex justify-between">
            <dt class="text-gray-500">Due Date</dt>
            <dd class="font-medium text-gray-900">{{ formatDate(order.dueDate) }}</dd>
          </div>
          <div v-if="order.updatedAt" class="flex justify-between">
            <dt class="text-gray-500">Last Updated</dt>
            <dd class="font-medium text-gray-900">{{ formatDate(order.updatedAt) }}</dd>
          </div>
        </dl>
      </div>

      <div class="border border-gray-100 rounded-xl p-4 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-900">Payment Details</h3>
        </div>
        <dl class="space-y-3 text-sm">
          <div class="flex justify-between">
            <dt class="text-gray-500">Payment Status</dt>
            <dd class="font-medium text-gray-900">
              {{ formatPaymentStatus(order.paymentStatus) }}
            </dd>
          </div>
          <div v-if="order.paymentMethod" class="flex justify-between">
            <dt class="text-gray-500">Payment Method</dt>
            <dd class="font-medium text-gray-900">
              {{ formatPaymentMethod(order.paymentMethod) }}
            </dd>
          </div>
          <div v-if="order.paymentReference" class="flex justify-between">
            <dt class="text-gray-500">Payment Reference</dt>
            <dd class="font-mono text-gray-900">{{ order.paymentReference }}</dd>
          </div>
        </dl>
      </div>
    </div>

    <!-- Financial Summary -->
    <div class="border border-gray-100 rounded-xl p-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold text-gray-900">Financial Summary</h3>
        <UBadge color="primary" variant="subtle" size="xs">Amounts</UBadge>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-1">
          <p class="text-xs uppercase tracking-wide text-gray-500">Total Amount</p>
          <p class="text-2xl font-semibold text-gray-900">
            {{ formatCurrency(order.totalAmount) }}
          </p>
        </div>
        <div class="space-y-1">
          <p class="text-xs uppercase tracking-wide text-gray-500">Final Amount</p>
          <p class="text-2xl font-semibold text-gray-900">
            {{ formatCurrency(order.finalAmount) }}
          </p>
        </div>
      </div>
      <div class="mt-6 grid gap-4 sm:grid-cols-3 text-sm">
        <div>
          <p class="text-gray-500">Tax</p>
          <p class="font-medium text-gray-900">{{ formatCurrency(order.taxAmount) }}</p>
        </div>
        <div>
          <p class="text-gray-500">Discount</p>
          <p class="font-medium text-gray-900">
            {{ order.discountAmount ? formatCurrency(order.discountAmount) : '₦0.00' }}
          </p>
        </div>
        <div>
          <p class="text-gray-500">Balance</p>
          <p class="font-medium text-gray-900">
            {{ formatCurrency((order.finalAmount || 0) - (order.totalAmount || 0)) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Order Items -->
    <div class="border border-gray-100 rounded-xl">
      <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-900">Order Items ({{ orderItems.length }})</h3>
        <UBadge color="neutral" variant="soft" size="xs">Items</UBadge>
      </div>
      <div v-if="orderItems.length" class="divide-y divide-gray-100">
        <div
          v-for="(item, index) in orderItems"
          :key="index"
          class="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <div>
            <p class="text-sm font-semibold text-gray-900">Item #{{ index + 1 }}</p>
            <p class="text-xs text-gray-500">Style ID: {{ item.styleId || 'N/A' }}</p>
            <p v-if="item.notes" class="text-xs text-gray-500 mt-1">Notes: {{ item.notes }}</p>
          </div>
          <div class="flex items-center gap-4 text-sm">
            <div class="text-gray-500">
              Qty:
              <span class="font-semibold text-gray-900">{{ item.quantity }}</span>
            </div>
            <div class="text-gray-500">
              Price:
              <span class="font-semibold text-gray-900">{{ formatCurrency(item.price) }}</span>
            </div>
            <div class="text-gray-500">
              Subtotal:
              <span class="font-semibold text-gray-900">{{
                formatCurrency(item.quantity * item.price)
              }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="px-4 py-6 text-center text-sm text-gray-500">
        No items have been added to this order yet.
      </div>
    </div>

    <!-- Measurements -->
    <div v-if="measurementEntries.length" class="border border-gray-100 rounded-xl p-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold text-gray-900">Measurements</h3>
        <UBadge color="neutral" variant="soft" size="xs">Body</UBadge>
      </div>
      <div class="grid gap-3 sm:grid-cols-2">
        <div
          v-for="(measurement, index) in measurementEntries"
          :key="`${measurement.label}-${index}`"
          class="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm"
        >
          <span class="text-gray-500">{{ measurement.label }}</span>
          <span class="font-medium text-gray-900">{{ measurement.value }}</span>
        </div>
      </div>
    </div>

    <!-- Notes -->
    <div v-if="order.notes" class="border border-gray-100 rounded-xl p-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold text-gray-900">Notes</h3>
        <UBadge color="neutral" variant="soft" size="xs">Internal</UBadge>
      </div>
      <p class="text-sm text-gray-700 whitespace-pre-line">{{ order.notes }}</p>
    </div>

    <!-- Addresses -->
    <div v-if="shippingEntries.length || billingEntries.length" class="grid gap-4 md:grid-cols-2">
      <div v-if="shippingEntries.length" class="border border-gray-100 rounded-xl p-4">
        <h3 class="text-sm font-semibold text-gray-900 mb-3">Shipping Address</h3>
        <dl class="space-y-2 text-sm">
          <div v-for="entry in shippingEntries" :key="entry.label" class="flex justify-between">
            <dt class="text-gray-500">{{ entry.label }}</dt>
            <dd class="font-medium text-gray-900 text-right">{{ entry.value }}</dd>
          </div>
        </dl>
      </div>
      <div v-if="billingEntries.length" class="border border-gray-100 rounded-xl p-4">
        <h3 class="text-sm font-semibold text-gray-900 mb-3">Billing Address</h3>
        <dl class="space-y-2 text-sm">
          <div v-for="entry in billingEntries" :key="entry.label" class="flex justify-between">
            <dt class="text-gray-500">{{ entry.label }}</dt>
            <dd class="font-medium text-gray-900 text-right">{{ entry.value }}</dd>
          </div>
        </dl>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Order } from '~/types/order'
import { computed } from 'vue'

interface Props {
  order: Order
}
const props = defineProps<Props>()

const orderItems = computed(() => props.order.items || [])

const displayClientName = computed(() => {
  const client = props.order.client
  if (client) {
    const firstName = client.firstName || client.clientName || 'N/A'
    const lastName = client.lastName
    return lastName ? `${firstName} ${lastName}` : firstName
  }
  return props.order.clientName || 'N/A'
})

const normalizedMeasurements = computed(() => {
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

const shippingEntries = computed(() => formatAddressEntries(props.order.shippingAddress))
const billingEntries = computed(() => formatAddressEntries(props.order.billingAddress))
const styleName = computed(() => props.order.style?.name || 'Custom Design')

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
