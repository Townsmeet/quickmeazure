<template>
  <UModal :open="isOpen" @update:open="value => !value && $emit('close')">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Delete Style</h3>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="$emit('close')"
            />
          </div>
        </template>

        <div class="space-y-4">
          <p class="text-gray-600">
            Are you sure you want to delete the style
            <span class="font-semibold text-gray-900">{{ style?.name }}</span
            >?
          </p>

          <div v-if="style?.imageUrl" class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div class="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              <img :src="style.imageUrl" :alt="style.name" class="w-full h-full object-cover" />
            </div>
            <div>
              <div class="text-sm font-medium text-gray-900">{{ style.name }}</div>
              <div class="text-xs text-gray-500">
                {{ style.description || 'No description' }}
              </div>
            </div>
          </div>

          <div class="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div class="flex items-start">
              <UIcon
                name="i-heroicons-exclamation-triangle"
                class="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0"
              />
              <div class="text-sm text-red-800">
                <p class="font-medium">This action cannot be undone.</p>
                <p class="mt-1">
                  This will permanently delete the style and remove it from any associated orders.
                </p>
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
color="neutral"
variant="ghost"
:disabled="isDeleting"
@click="$emit('close')">
              Cancel
            </UButton>
            <UButton color="error" :loading="isDeleting" @click="$emit('confirm', style)">
              Delete Style
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { Style } from '~/types/style'

interface Props {
  isOpen: boolean
  style: Style | null
  isDeleting?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'confirm', style: Style | null): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>
