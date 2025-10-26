<template>
  <UModal :open="isOpen" @update:open="value => !value && $emit('close')">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Delete Client</h3>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="$emit('close')"
            />
          </div>
        </template>

        <p class="mb-6 text-gray-600">
          Are you sure you want to delete
          <span class="font-semibold text-gray-900">{{ client?.name }}</span
          >? This action cannot be undone and will remove all associated measurements and orders.
        </p>

        <div class="flex justify-end gap-3">
          <UButton
color="neutral"
variant="ghost"
:disabled="isDeleting"
@click="$emit('close')">
            Cancel
          </UButton>
          <UButton color="error" :loading="isDeleting" @click="$emit('confirm', client)">
            Delete Client
          </UButton>
        </div>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { Client } from '~/types/client'

interface Props {
  isOpen: boolean
  client: Client | null
  isDeleting?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'confirm', client: Client | null): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>
