<template>
  <UModal :open="isOpen" title="Delete Order" @update:open="onClose">
    <template #body>
      <p class="text-sm text-gray-500">
        Are you sure you want to delete order
        <span class="font-medium">#{{ order?.orderNumber }}</span
        >? This action cannot be undone.
      </p>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
color="neutral"
variant="outline"
:disabled="isDeleting"
@click="onClose"
          >Cancel</UButton
        >
        <UButton color="error" :loading="isDeleting" @click="onConfirm">Delete</UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { Order } from '~/types/order'

interface Props {
  isOpen: boolean
  order: Order | null
  isDeleting?: boolean
}

const _props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close' | 'confirm'): void
}>()
function onClose() {
  emit('close')
}
function onConfirm() {
  emit('confirm')
}
</script>
