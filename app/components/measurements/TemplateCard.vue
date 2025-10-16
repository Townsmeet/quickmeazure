<template>
  <UCard class="group hover:shadow-lg transition-all duration-300">
    <template #header>
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1 min-w-0">
          <h3 class="text-lg font-semibold text-gray-900 truncate">
            {{ template.name }}
          </h3>
          <p class="mt-1 text-sm text-gray-500 line-clamp-2">
            {{ template.description }}
          </p>
        </div>
        <UBadge color="neutral" variant="subtle">
          {{ template.category }}
        </UBadge>
      </div>
    </template>

    <div class="space-y-4">
      <div class="flex items-center gap-2 text-sm text-gray-500">
        <UIcon name="i-heroicons-ruler" class="w-4 h-4" />
        <span>{{ template.fields.length }} measurements</span>
      </div>

      <div class="flex flex-wrap gap-1.5">
        <UBadge
          v-for="field in template.fields.slice(0, 4)"
          :key="field.id"
          variant="subtle"
          color="neutral"
          class="text-xs"
        >
          {{ field.name }}
        </UBadge>
        <UBadge
v-if="template.fields.length > 4"
variant="subtle"
color="neutral"
class="text-xs">
          +{{ template.fields.length - 4 }} more
        </UBadge>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-2">
        <UButton
          variant="outline"
          size="sm"
          icon="i-heroicons-pencil"
          @click="$emit('edit', template)"
        >
          Edit
        </UButton>
        <UButton
          variant="outline"
          size="sm"
          color="error"
          icon="i-heroicons-trash"
          @click="$emit('delete', template.id)"
        />
      </div>
    </template>
  </UCard>
</template>

<script setup lang="ts">
import type { MeasurementTemplate } from '~/types/measurement'

defineProps<{
  template: MeasurementTemplate
}>()

defineEmits<{
  (e: 'edit', template: MeasurementTemplate): void
  (e: 'delete', id: string): void
}>()
</script>
