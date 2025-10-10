<script setup lang="ts">
import type { PropType } from 'vue'

interface Action {
  label: string
  to?: string
  icon?: string
  onClick?: () => void
}

defineProps({
  icon: {
    type: String,
    default: 'i-heroicons-document-text',
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  primaryAction: {
    type: Object as PropType<Action>,
    default: null,
  },
  secondaryAction: {
    type: Object as PropType<Action>,
    default: null,
  },
})
</script>

<template>
  <UEmptyState :icon="icon" :title="title" :description="description">
    <template #actions>
      <slot name="actions">
        <UButton
          v-if="primaryAction"
          :to="primaryAction.to"
          :icon="primaryAction.icon"
          @click="primaryAction.onClick"
        >
          {{ primaryAction.label }}
        </UButton>
        <UButton
          v-if="secondaryAction"
          :to="secondaryAction.to"
          :icon="secondaryAction.icon"
          variant="outline"
          @click="secondaryAction.onClick"
        >
          {{ secondaryAction.label }}
        </UButton>
      </slot>
    </template>
  </UEmptyState>
</template>
