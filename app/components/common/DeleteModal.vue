<template>
  <UModal v-model="showDialog">
    <UCard class="max-w-md mx-auto">
      <template #header>
        <div class="flex items-center">
          <UIcon name="i-heroicons-exclamation-triangle" class="text-red-500 mr-2" />
          <h3 class="text-lg font-medium">{{ title }}</h3>
        </div>
      </template>
      <slot>
        <p v-if="message" v-html="message" />
        <p v-else-if="itemType && itemName" class="text-gray-700 dark:text-gray-300">
          Are you sure you want to delete <span class="font-semibold">{{ itemName }}</span
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
  </UModal>
</template>
<script setup>
const props = defineProps({
  modelValue: { type: Boolean, required: true },
  title: { type: String, default: 'Confirm Delete' },
  message: { type: String, default: '' },
  itemType: { type: String, default: '' },
  itemName: { type: String, default: '' },
  cancelText: { type: String, default: 'Cancel' },
  confirmText: { type: String, default: 'Delete' },
  loading: { type: Boolean, default: false },
})
const showDialog = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v),
})
const emit = defineEmits(['update:modelValue', 'confirm'])
</script>
