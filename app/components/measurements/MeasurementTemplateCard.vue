<template>
  <UCard
    :ui="{
      root: 'h-full flex flex-col',
      body: 'flex-1',
      footer: 'pt-4 mt-auto',
    }"
    class="group hover:shadow-lg transition-shadow duration-200"
  >
    <!-- Header -->
    <div class="flex justify-between items-start mb-3">
      <div>
        <h3 class="font-medium text-gray-900 flex items-center gap-2">
          {{ template.name }}
          <UBadge v-if="template.isDefault" size="xs" color="primary"> Default </UBadge>
          <UBadge v-else-if="template.archived" size="xs" color="neutral"> Archived </UBadge>
        </h3>
        <p class="text-sm text-gray-500">
          {{ formatGender(template.gender) }} • {{ template.fields?.length || 0 }} fields
        </p>
      </div>

      <UDropdown :items="dropdownItems" :popper="{ placement: 'bottom-end' }">
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-heroicons-ellipsis-vertical"
          size="xs"
          :ui="{ base: 'rounded-full' }"
        />
      </UDropdown>
    </div>

    <!-- Fields Preview -->
    <div class="space-y-2 mb-4">
      <div
        v-for="field in visibleFields"
        :key="field.id || field.name"
        class="flex items-center justify-between text-sm py-1 px-2 bg-gray-50 rounded"
      >
        <span class="text-gray-700">{{ field.name }}</span>
        <span class="text-gray-500 text-xs">{{ field.unit }}</span>
      </div>

      <div v-if="hasMoreFields" class="text-xs text-gray-400 text-center pt-1">
        +{{ template.fields.length - 3 }} more
      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <div class="flex justify-between items-center text-sm">
        <span class="text-gray-500">
          Updated {{ formatDate(template.updatedAt || template.createdAt) }}
        </span>

        <div
          class="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <UButton
            v-if="!template.archived"
            icon="i-heroicons-pencil"
            size="xs"
            color="neutral"
            variant="ghost"
            @click="$emit('edit', template)"
          />

          <UButton
            v-if="!template.archived"
            icon="i-heroicons-archive-box"
            size="xs"
            color="neutral"
            variant="ghost"
            @click="$emit('archive', template.id)"
          />

          <UButton
            v-if="template.archived"
            icon="i-heroicons-arrow-uturn-left"
            size="xs"
            color="neutral"
            variant="ghost"
            @click="$emit('unarchive', template.id)"
          />

          <UButton
            v-if="!template.isDefault"
            icon="i-heroicons-trash"
            size="xs"
            color="error"
            variant="ghost"
            @click="$emit('delete', template.id)"
          />
        </div>
      </div>
    </template>
  </UCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MeasurementTemplate } from '~/types/measurement'

interface Props {
  template: MeasurementTemplate
}

const props = defineProps<Props>()

type EmitEvents = {
  (e: 'edit', template: MeasurementTemplate): void
  (e: 'archive' | 'unarchive' | 'delete', id: number): void
}

const emit = defineEmits<EmitEvents>()

const visibleFields = computed(() => {
  return props.template.fields?.slice(0, 3) || []
})

const hasMoreFields = computed(() => {
  return (props.template.fields?.length || 0) > 3
})

const dropdownItems = computed(() => {
  const items: Array<
    Array<{
      label: string
      icon: string
      click: () => void
    }>
  > = []

  if (!props.template.archived) {
    items.push([
      {
        label: 'Edit',
        icon: 'i-heroicons-pencil',
        click: () => emit('edit', props.template),
      },
      {
        label: 'Archive',
        icon: 'i-heroicons-archive-box',
        click: () => emit('archive', props.template.id),
      },
    ])
  } else {
    items.push([
      {
        label: 'Restore',
        icon: 'i-heroicons-arrow-uturn-left',
        click: () => emit('unarchive', props.template.id),
      },
    ])
  }

  if (!props.template.isDefault) {
    items[0].push({
      label: 'Delete',
      icon: 'i-heroicons-trash',
      click: () => emit('delete', props.template.id),
    })
  }

  return items
})

const formatGender = (gender?: string) => {
  if (!gender) return 'Unspecified'
  return gender.charAt(0).toUpperCase() + gender.slice(1)
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Unknown date'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch (_error) {
    return 'Invalid date'
  }
}
</script>
