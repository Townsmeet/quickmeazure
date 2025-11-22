<template>
  <div
    class="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer"
    @click="$emit('click', order)"
  >
    <!-- Status Bar -->
    <div
      class="h-1 w-full"
      :class="{
        'bg-green-500': order.status === 'completed',
        'bg-blue-500': order.status === 'in_progress',
        'bg-yellow-500': order.status === 'pending',
        'bg-red-500': order.status === 'cancelled',
        'bg-gray-500': !['completed', 'in_progress', 'pending', 'cancelled'].includes(order.status),
      }"
    />

    <div class="p-5">
      <!-- Header -->
      <div class="flex justify-between items-start mb-4">
        <div class="flex flex-col pr-8">
          <span class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            #{{ order.orderNumber }}
          </span>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {{ order.clientName || 'No Client' }}
          </h3>
        </div>
      </div>

      <!-- Details Grid -->
      <div class="grid grid-cols-2 gap-4 mb-4">
        <!-- Amount -->
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Amount</p>
          <p class="font-semibold text-gray-900 dark:text-white">
            ₦{{ order.totalAmount?.toLocaleString() }}
          </p>
        </div>
        <!-- Due Date -->
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Due Date</p>
          <p
            class="font-medium"
            :class="{
              'text-red-500': isOverdue,
              'text-gray-900 dark:text-white': !isOverdue,
            }"
          >
            {{ order.dueDate ? dayjs(order.dueDate).format('MMM D, YYYY') : 'No date' }}
          </p>
        </div>
      </div>

      <!-- Footer / Progress -->
      <div class="flex items-center mt-2 gap-3 justify-between">
        <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <UIcon name="i-heroicons-calendar" class="w-4 h-4" />
          <span>{{ dayjs.unix(Number(order.createdAt)).format('MMM D') }}</span>
        </div>

        <UBadge
:color="getStatusColor(order.status)"
variant="subtle"
size="xs"
class="capitalize">
          {{ formatStatus(order.status) }}
        </UBadge>

        <!-- Action Menu (Always Visible) -->
        <div class="absolute top-4 right-2 z-10">
          <UDropdownMenu :items="actions" :popper="{ placement: 'bottom-end' }">
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-heroicons-ellipsis-horizontal"
              size="xs"
              @click.stop
            />
          </UDropdownMenu>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Order, OrderStatus } from '~/types/order'
import dayjs from 'dayjs'

const props = defineProps<{
  order: Order
}>()

const emit = defineEmits<{
  (e: 'click' | 'view' | 'edit' | 'delete', order: Order): void
}>()

const isOverdue = computed(() => {
  return (
    props.order.dueDate &&
    dayjs(props.order.dueDate).isBefore(dayjs(), 'day') &&
    props.order.status !== 'completed'
  )
})

const formatStatus = (status: OrderStatus) => {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case 'completed':
      return 'success'
    case 'processing':
      return 'info'
    case 'pending':
      return 'warning'
    case 'cancelled':
      return 'error'
    case 'draft':
      return 'neutral'
    default:
      return 'neutral'
  }
}

const actions = [
  [
    {
      label: 'View Details',
      icon: 'i-heroicons-eye',
      onSelect: () => emit('view', props.order),
    },
    {
      label: 'Edit',
      icon: 'i-heroicons-pencil',
      onSelect: () => emit('edit', props.order),
    },
    {
      label: 'Delete',
      icon: 'i-heroicons-trash',
      color: 'error' as const,
      onSelect: () => emit('delete', props.order),
    },
  ],
]
</script>
