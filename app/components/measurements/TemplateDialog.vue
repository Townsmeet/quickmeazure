<template>
  <UModal v-model="isOpen">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">
            {{ editingTemplate ? 'Edit Template' : 'Create Template' }}
          </h3>
          <UButton
color="gray"
variant="ghost"
icon="i-heroicons-x-mark-20-solid"
@click="close" />
        </div>
      </template>

      <UForm :state="form" class="space-y-4" @submit="handleSubmit">
        <UFormGroup label="Template Name" name="name" required>
          <UInput v-model="form.name" placeholder="e.g., Men's Formal Shirt" />
        </UFormGroup>

        <UFormGroup label="Description" name="description">
          <UTextarea
            v-model="form.description"
            placeholder="Brief description of this template..."
            :rows="3"
          />
        </UFormGroup>

        <UFormGroup label="Category" name="category" required>
          <USelect v-model="form.category" :options="categories" placeholder="Select category" />
        </UFormGroup>

        <UFormGroup label="Measurement Fields" required>
          <div class="space-y-3">
            <div class="flex gap-2">
              <UInput
                v-model="newField.name"
                placeholder="Field name (e.g., Chest)"
                class="flex-1"
                @keyup.enter="addField"
              />
              <USelect v-model="newField.unit" :options="units" class="w-24" />
              <UButton icon="i-heroicons-plus" type="button" @click="addField" />
            </div>

            <div v-if="form.fields.length > 0" class="space-y-2">
              <div
                v-for="(field, index) in form.fields"
                :key="field.id"
                class="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <span class="text-sm"> {{ field.name }} ({{ field.unit }}) </span>
                <UButton
                  variant="ghost"
                  color="red"
                  icon="i-heroicons-trash"
                  size="xs"
                  @click="removeField(index)"
                />
              </div>
            </div>
          </div>
        </UFormGroup>

        <UButtonGroup class="flex justify-end gap-2 pt-4">
          <UButton type="button" variant="outline" @click="close"> Cancel </UButton>
          <UButton type="submit" :disabled="!isFormValid" :loading="isSubmitting">
            {{ editingTemplate ? 'Update' : 'Create' }} Template
          </UButton>
        </UButtonGroup>
      </UForm>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import type { MeasurementTemplate } from '~/types/measurement'

const props = defineProps<{
  modelValue: boolean
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

const newField = ref({
  name: '',
  unit: 'cm',
})

const form = ref({
  name: '',
  description: '',
  category: '',
  fields: [] as Array<{ id: string; name: string; unit: string }>,
})

const isSubmitting = ref(false)
const editingTemplate = computed(() => !!props.template)

const isFormValid = computed(() => {
  return form.value.name.trim() && form.value.category && form.value.fields.length > 0
})

const addField = () => {
  if (newField.value.name.trim()) {
    form.value.fields.push({
      id: Date.now().toString(),
      name: newField.value.name.trim(),
      unit: newField.value.unit,
    })
    newField.value.name = ''
  }
}

const removeField = (index: number) => {
  form.value.fields.splice(index, 1)
}

const resetForm = () => {
  form.value = {
    name: '',
    description: '',
    category: '',
    fields: [],
  }
  newField.value = {
    name: '',
    unit: 'cm',
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
        fields: [...template.fields],
      }
    } else {
      resetForm()
    }
  },
  { immediate: true }
)
</script>
