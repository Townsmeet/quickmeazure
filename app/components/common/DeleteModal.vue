<template>
  <div v-if="modelValue" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <UCard class="w-full max-w-md mx-auto">
      <template #header>
        <div class="flex items-center">
          <UIcon name="i-heroicons-exclamation-triangle" class="text-red-500 mr-2" />
          <h3 class="text-lg font-medium">
            {{ title }}
          </h3>
        </div>
      </template>

      <!-- Use slot content if provided, otherwise fall back to message prop or generate from item props -->
      <slot>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <p v-if="message" v-html="message" />
        <p v-else-if="itemType && itemName" class="text-gray-700 dark:text-gray-300">
          Are you sure you want to delete
          <span class="font-semibold">{{ itemName }}</span
          >? This action cannot be undone.
        </p>
      </slot>

      <template #footer>
        <div class="flex justify-end space-x-4">
          <UButton color="neutral" variant="outline" @click="$emit('update:modelValue', false)">
            {{ cancelText }}
          </UButton>
          <UButton color="error" :loading="loading" @click="$emit('confirm')">
            {{ confirmText }}
          </UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: 'Confirm Delete',
  },
  message: {
    type: String,
    default: '',
  },
  itemType: {
    type: String,
    default: '',
  },
  itemName: {
    type: String,
    default: '',
  },
  cancelText: {
    type: String,
    default: 'Cancel',
  },
  confirmText: {
    type: String,
    default: 'Delete',
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['update:modelValue', 'confirm'])
</script>
