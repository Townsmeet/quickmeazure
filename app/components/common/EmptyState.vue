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
  <div class="empty-state">
    <div class="empty-state-content">
      <div class="empty-state-icon">
        <UIcon :name="icon" />
      </div>
      <h3 class="empty-state-title">
        {{ title }}
      </h3>
      <p class="empty-state-description">
        {{ description }}
      </p>
      <div v-if="$slots.actions || primaryAction || secondaryAction" class="empty-state-actions">
        <slot name="actions">
          <div class="flex items-center justify-center gap-3">
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
          </div>
        </slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.empty-state {
  width: 100%;
  background-color: white;
  border: 1px solid var(--gray-100);
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}

.empty-state-content {
  text-align: center;
  padding: 2rem 1rem;
}

@media (min-width: 640px) {
  .empty-state-content {
    padding: 3rem 1rem;
  }
}

.empty-state-icon {
  margin-left: auto;
  margin-right: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 3rem;
  width: 3rem;
  border-radius: 9999px;
  background-color: var(--gray-50);
  margin-bottom: 1rem;
  color: var(--gray-400);
  font-size: 1.5rem;
}

@media (min-width: 640px) {
  .empty-state-icon {
    height: 4rem;
    width: 4rem;
    font-size: 1.875rem;
  }
}

.empty-state-title {
  font-size: 1.125rem;
  line-height: 1.75rem;
  font-weight: 600;
  color: var(--gray-900);
  margin-bottom: 0.5rem;
}

.empty-state-description {
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: var(--gray-500);
  max-width: 28rem;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 1.5rem;
}

@media (min-width: 640px) {
  .empty-state-description {
    font-size: 1rem;
    line-height: 1.5rem;
  }
}

.empty-state-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .empty-state-actions {
    flex-direction: row;
    justify-content: center;
  }
}
</style>
