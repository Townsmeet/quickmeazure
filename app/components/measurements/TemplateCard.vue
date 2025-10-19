<template>
  <UCard class="group hover:shadow-lg transition-all duration-300">
    <template #header>
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <h3 class="text-lg font-semibold text-gray-900 truncate">
              {{ template.name }}
            </h3>
            <UBadge
v-if="template.isDefault"
color="primary"
variant="subtle"
size="xs">
              Default
            </UBadge>
            <UBadge
v-if="template.isArchived"
color="warning"
variant="subtle"
size="xs">
              Archived
            </UBadge>
          </div>
          <p class="mt-1 text-sm text-gray-500 line-clamp-2">
            {{ template.description }}
          </p>
        </div>
        <UBadge color="neutral" variant="subtle">
          {{ template.gender }}
        </UBadge>
      </div>
    </template>

    <div class="space-y-4">
      <div class="flex items-center gap-4 text-sm text-gray-500">
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-list-bullet" class="w-4 h-4" />
          <span>{{ template.fields.length }} measurements</span>
        </div>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-adjustments-horizontal" class="w-4 h-4" />
          <span>{{ template.unit }}</span>
        </div>
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
      <div class="flex gap-2 flex-wrap">
        <UButton
          variant="outline"
          size="sm"
          icon="i-heroicons-pencil"
          @click="emit('edit', template)"
        >
          Edit
        </UButton>
        <UButton
          v-if="!template.isDefault"
          variant="outline"
          color="info"
          size="sm"
          icon="i-heroicons-star"
          @click="emit('set-default', Number(template.id))"
        >
          Set Default
        </UButton>
        <UButton
          v-if="!template.isArchived"
          variant="outline"
          size="sm"
          color="warning"
          icon="i-heroicons-archive-box"
          @click="emit('archive', Number(template.id))"
        >
          Archive
        </UButton>
        <UButton
          v-else
          variant="outline"
          size="sm"
          color="success"
          icon="i-heroicons-archive-box-arrow-down"
          @click="emit('unarchive', Number(template.id))"
        >
          Unarchive
        </UButton>
        <UButton
          variant="outline"
          size="sm"
          color="error"
          icon="i-heroicons-trash"
          @click="emit('delete', String(template.id))"
        />
      </div>
    </template>
  </UCard>
</template>

<script setup lang="ts">
import type { MeasurementTemplate } from '~/types'

defineProps<{
  template: MeasurementTemplate
}>()

const emit = defineEmits(['edit', 'delete', 'set-default', 'archive', 'unarchive'])
</script>
