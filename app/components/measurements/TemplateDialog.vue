<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">
          {{ editingTemplate ? 'Edit Template' : 'Create Template' }}
        </h3>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-heroicons-x-mark-20-solid"
          @click="close"
        />
      </div>
    </template>

    <UForm :state="form" class="space-y-4" @submit="handleSubmit">
      <UFormField label="Template Name" name="name" required>
        <UInput v-model="form.name" placeholder="e.g., Men's Formal Shirt" class="w-full" />
      </UFormField>

      <UFormField label="Description" name="description">
        <UTextarea
          v-model="form.description"
          placeholder="Brief description of this template..."
          :rows="3"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Measurement Unit" name="unit" required>
        <USelect
v-model="form.unit"
:items="units"
placeholder="Select unit"
class="w-full" />
      </UFormField>

      <UFormField label="Measurement Fields" required>
        <div class="space-y-6">
          <!-- Add Field Input -->
          <div class="flex gap-2">
            <UInput
              v-model="newField.name"
              placeholder="Field name (e.g., Chest)"
              class="flex-1"
              @keyup.enter="addField"
            />
            <USelect
              v-model="newField.category"
              :items="fieldCategories"
              placeholder="Category"
              class="w-32"
            />
            <UButton icon="i-heroicons-plus" type="button" @click="addField" />
          </div>

          <!-- Upper Body Fields -->
          <div v-if="upperBodyFields.length > 0" class="space-y-2">
            <h4 class="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">
              Upper Body
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div
                v-for="field in upperBodyFields"
                :key="field.id"
                class="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-user" class="w-4 h-4 text-blue-600" />
                  <span class="text-sm font-medium">{{ field.name }}</span>
                </div>
                <UButton
                  variant="ghost"
                  color="error"
                  icon="i-heroicons-trash"
                  size="xs"
                  @click="removeField(field.id)"
                />
              </div>
            </div>
          </div>

          <!-- Lower Body Fields -->
          <div v-if="lowerBodyFields.length > 0" class="space-y-2">
            <h4 class="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">
              Lower Body
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div
                v-for="field in lowerBodyFields"
                :key="field.id"
                class="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-arrow-down" class="w-4 h-4 text-green-600" />
                  <span class="text-sm font-medium">{{ field.name }}</span>
                </div>
                <UButton
                  variant="ghost"
                  color="error"
                  icon="i-heroicons-trash"
                  size="xs"
                  @click="removeField(field.id)"
                />
              </div>
            </div>
          </div>

          <!-- No fields message -->
          <div v-if="form.fields.length === 0" class="text-center py-8 text-gray-500">
            <UIcon name="i-heroicons-document-text" class="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No measurement fields added yet</p>
          </div>
        </div>
      </UFormField>

      <div class="flex justify-end gap-2 pt-4">
        <UButton type="button" variant="outline" @click="close"> Cancel </UButton>
        <UButton type="submit" :disabled="!isFormValid" :loading="isSubmitting">
          {{ editingTemplate ? 'Update' : 'Create' }} Template
        </UButton>
      </div>
    </UForm>
  </UCard>
</template>

<script setup lang="ts">
import type { MeasurementTemplate } from '~/types/measurement'

const props = defineProps<{
  template?: MeasurementTemplate | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (
    e: 'submit',
    template: Omit<
      MeasurementTemplate,
      'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'isDefault' | 'userId'
    >
  ): void
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const categories = ['Shirts', 'Pants', 'Suits', 'Dresses', 'Traditional', 'Other']
const units = ['cm', 'in', 'm']
const fieldCategories = [
  { label: 'Upper Body', value: 'upper' },
  { label: 'Lower Body', value: 'lower' },
]

const newField = ref({
  name: '',
  category: 'upper',
})

const form = ref({
  name: '',
  description: '',
  category: '',
  unit: 'cm',
  fields: [] as Array<{ id: string; name: string; category: string }>,
})

const isSubmitting = ref(false)
const editingTemplate = computed(() => !!props.template)

const upperBodyFields = computed(() =>
  form.value.fields.filter(field => field.category === 'upper')
)

const lowerBodyFields = computed(() =>
  form.value.fields.filter(field => field.category === 'lower')
)

const isFormValid = computed(() => {
  return (
    form.value.name.trim() && form.value.category && form.value.unit && form.value.fields.length > 0
  )
})

const addField = () => {
  if (newField.value.name.trim()) {
    form.value.fields.push({
      id: Date.now().toString(),
      name: newField.value.name.trim(),
      category: newField.value.category,
    })
    newField.value.name = ''
  }
}

const removeField = (id: string) => {
  const index = form.value.fields.findIndex(field => field.id === id)
  if (index !== -1) {
    form.value.fields.splice(index, 1)
  }
}

const resetForm = () => {
  form.value = {
    name: '',
    description: '',
    category: '',
    unit: 'cm',
    fields: [],
  }
  newField.value = {
    name: '',
    category: 'upper',
  }
}

const close = () => {
  isOpen.value = false
  resetForm()
}

const handleSubmit = () => {
  if (!isFormValid.value) return

  isSubmitting.value = true
  emit('submit', { ...form.value })
  close()
  isSubmitting.value = false
}

// Initialize form when editing
watch(
  () => props.template,
  template => {
    if (template) {
      form.value = {
        name: template.name,
        description: template.description || '',
        category: template.category,
        unit: template.unit || 'cm',
        fields: [...template.fields],
      }
    } else {
      resetForm()
    }
  },
  { immediate: true }
)
</script>
