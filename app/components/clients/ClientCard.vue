<template>
  <UCard
    class="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-md hover:scale-[1.02] bg-white dark:bg-gray-800"
    @click="$emit('click', client)"
  >
    <!-- Card Header -->
    <template #header>
      <div class="flex items-start justify-between">
        <div class="flex items-center space-x-4">
          <!-- Avatar -->
          <div class="relative">
            <UAvatar
              :text="getInitials(client.name)"
              size="3xl"
              color="primary"
              class="shadow-lg"
            />
          </div>

          <!-- Client Info -->
          <div class="flex-1 min-w-0">
            <h3
              class="text-lg font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary-600 transition-colors"
            >
              {{ client.name }}
            </h3>
            <div class="flex items-center space-x-2 mt-1">
              <UBadge
v-if="(client.orderCount || 0) > 0"
color="info"
variant="soft"
size="xs">
                {{ client.orderCount }} {{ client.orderCount === 1 ? 'Order' : 'Orders' }}
              </UBadge>
            </div>
          </div>
        </div>

        <!-- Actions Menu -->
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
    </template>

    <!-- Card Content -->
    <div class="space-y-4">
      <!-- Contact Info -->
      <div class="space-y-3">
        <div v-if="client.email" class="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <UIcon name="i-heroicons-envelope" class="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" />
          <span class="truncate">{{ client.email }}</span>
        </div>
        <div v-if="client.phone" class="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <UIcon name="i-heroicons-phone" class="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" />
          <span>{{ client.phone }}</span>
        </div>
        <div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <UIcon name="i-heroicons-calendar" class="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" />
          <span>Added {{ dayjs(client.createdAt).format('MMM D, YYYY') }}</span>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="pt-4 border-t border-gray-100 dark:border-gray-700">
        <div class="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-4">
          <span>
            <span class="font-medium">Orders:</span>
            <span class="font-bold text-gray-900 dark:text-white ml-1">{{
              client.orderCount || 0
            }}</span>
          </span>
          <span>
            <span class="font-medium">Revenue:</span>
            <span class="font-bold text-green-600 ml-1"
              >₦{{ (client.totalRevenue || 0).toLocaleString() }}</span
            >
          </span>
        </div>
      </div>
    </div>

    <!-- Hover Overlay -->
    <div
      class="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-primary-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none"
    ></div>
  </UCard>
</template>

<script setup lang="ts">
import type { Client } from '~/types/client'
import dayjs from 'dayjs'

const props = defineProps<{
  client: Client
}>()

const emit = defineEmits<{
  (e: 'click' | 'view' | 'edit' | 'delete' | 'new-order', client: Client): void
}>()

const getInitials = (name: string | undefined) => {
  if (!name) return 'N/A'
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const actions = [
  [
    {
      label: 'View Details',
      icon: 'i-heroicons-eye',
      onSelect: () => emit('view', props.client),
    },
    {
      label: 'Edit',
      icon: 'i-heroicons-pencil',
      onSelect: () => emit('edit', props.client),
    },
    {
      label: 'New Order',
      icon: 'i-heroicons-plus',
      onSelect: () => emit('new-order', props.client),
    },
  ],
  [
    {
      label: 'Delete',
      icon: 'i-heroicons-trash',
      color: 'error' as const,
      onSelect: () => emit('delete', props.client),
    },
  ],
]
</script>
