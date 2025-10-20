<template>
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">{{ title }}</h1>
      <p v-if="description" class="mt-1 text-sm text-gray-500">{{ description }}</p>
    </div>
    <div class="flex items-center gap-3">
      <slot name="actions">
        <UButton
          v-if="primaryAction"
          :to="primaryAction.to"
          :disabled="primaryAction.disabled"
          :loading="primaryAction.loading"
          color="primary"
          size="lg"
          @click="primaryAction.onClick && primaryAction.onClick()"
        >
          {{ primaryAction.label }}
        </UButton>
      </slot>
    </div>
  </div>
</template>
<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: null },
  primaryAction: { type: Object, default: null },
})
</script>
