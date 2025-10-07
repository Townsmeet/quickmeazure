<template>
  <UModal v-model="isOpen">
    <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">
            {{ editing ? 'Edit Template' : 'New Measurement Template' }}
          </h3>
          <UButton
color="neutral"
variant="ghost"
icon="i-heroicons-x-mark"
@click="close" />
        </div>
      </template>

      <UForm :state="form" class="space-y-6" @submit="onSubmit">
        <!-- Template Name -->
        <UFormField label="Template Name" name="name" required>
          <UInput v-model="form.name" placeholder="e.g., Standard Measurements, Custom Fit, etc." />
        </UFormField>

        <!-- Gender -->
        <UFormField label="Gender" name="gender" required>
          <USelect v-model="form.gender" :options="genderOptions" placeholder="Select gender" />
        </UFormField>

        <!-- Measurement Fields -->
        <UFormField label="Measurement Fields" name="fields" />

        <!-- Fields List -->
        <div class="border rounded-lg p-4 bg-gray-50">
          <div v-if="form.fields.length === 0" class="text-center py-8">
            <UIcon name="i-heroicons-ruler" class="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p class="text-sm text-gray-500">No fields added yet</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="(field, index) in form.fields"
              :key="field.key"
              class="flex items-start gap-3 p-3 border rounded-lg"
              :class="{ 'border-red-200 bg-red-50': fieldErrors[field.key] }"
            >
              <div class="flex-1 space-y-2">
                <UFormField
                  :label="`Field ${index + 1}`"
                  :name="`field-${index}-name`"
                  :error="fieldErrors[field.key]?.name"
                >
                  <UInput v-model="field.name" placeholder="e.g., Chest, Waist, Sleeve Length">
                    <template #trailing>
                      <UButton
                        v-if="!field.isDefault"
                        color="error"
                        variant="ghost"
                        icon="i-heroicons-trash"
                        size="xs"
                        @click="removeField(index)"
                      />
                    </template>
                  </UInput>
                </UFormField>

                <div class="grid grid-cols-2 gap-3">
                  <UFormField
                    label="Unit"
                    :name="`field-${index}-unit`"
                    :error="fieldErrors[field.key]?.unit"
                  >
                    <USelect
                      v-model="field.unit"
                      :options="unitOptions"
                      placeholder="Select unit"
                    />
                  </UFormField>

                  <UFormField label="Required" :name="`field-${index}-required`" class="pt-6">
                    <USwitch v-model="field.isRequired" />
                  </UFormField>
                </div>
              </div>

              <div class="flex flex-col gap-1 pt-6">
                <UButton
                  v-if="index > 0"
                  icon="i-heroicons-arrow-up"
                  size="lg"
                  color="neutral"
                  variant="ghost"
                  :ui="{ base: 'rounded-full' }"
                  @click="moveFieldUp(index)"
                />
                <UButton
                  v-if="index < form.fields.length - 1"
                  icon="i-heroicons-arrow-down"
                  size="lg"
                  color="neutral"
                  variant="ghost"
                  :ui="{ base: 'rounded-full' }"
                  @click="moveFieldDown(index)"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end gap-3 pt-4">
          <UButton
type="button"
color="neutral"
variant="ghost"
@click="close"> Cancel </UButton>
          <UButton
            type="submit"
            color="primary"
            :loading="isSubmitting"
            :disabled="form.fields.length === 0"
          >
            {{ editing ? 'Update' : 'Create' }} Template
          </UButton>
        </div>
      </UForm>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { MeasurementField, MeasurementTemplate } from '~/types/measurement'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  template: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved'): void
}>()

const { createTemplate, updateTemplate } = useMeasurementTemplates()
const toast = useToast()

const isOpen = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const editing = computed(() => !!props.template)
const isSubmitting = ref(false)

// Form state
const form = ref({
  name: '',
  gender: 'unisex' as 'male' | 'female' | 'unisex',
  fields: [] as Array<{
    key: string
    id?: number
    name: string
    unit: 'in' | 'cm'
    type: 'number' | 'text' | 'select'
    isRequired: boolean
    isDefault?: boolean
    order: number
  }>,
})

// Field errors
const fieldErrors = ref<Record<string, { name?: string; unit?: string }>>({})

// Options
const genderOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Unisex', value: 'unisex' },
]

const unitOptions = [
  { label: 'Inches (in)', value: 'in' },
  { label: 'Centimeters (cm)', value: 'cm' },
]

// Generate a unique key for each field
const generateKey = () => Math.random().toString(36).substring(2, 11)

// Add a new field (unused but kept for potential future use)
// const _addField = (field?: Partial<MeasurementField> & { key?: string }) => {
//   form.value.fields.push({
//     key: field?.key || generateKey(),
//     name: field?.name || '',
//     unit: (field?.unit as 'in' | 'cm') || 'cm',
//     type: field?.type || 'number',
//     isRequired: field?.required ?? true,
//     order: form.value.fields.length,
//     isDefault: field?.isDefault ?? false,
//     ...(field?.id && { id: field.id }),
//   })
// }

// Remove a field
const removeField = (index: number) => {
  form.value.fields.splice(index, 1)
}

// Move field up
const moveFieldUp = (index: number) => {
  if (index === 0) return

  const temp = form.value.fields[index]
  form.value.fields.splice(index, 1)
  form.value.fields.splice(index - 1, 0, temp)
}

// Move field down
const moveFieldDown = (index: number) => {
  if (index === form.value.fields.length - 1) return

  const temp = form.value.fields[index]
  form.value.fields.splice(index, 1)
  form.value.fields.splice(index + 1, 0, temp)
}

// Reset form
const resetForm = () => {
  form.value = {
    name: '',
    gender: 'unisex',
    fields: [],
  }
  fieldErrors.value = {}
}

// Load template data
const loadTemplateData = () => {
  if (!props.template) {
    resetForm()
    return
  }

  form.value = {
    name: props.template.name,
    gender: props.template.gender || 'unisex',
    fields: (props.template.fields || []).map((field: MeasurementField, index: number) => ({
      key: field.id || generateKey(),
      id: field.id,
      name: field.name,
      unit: field.unit || 'cm',
      type: field.type || 'number',
      required: field.required ?? true,
      order: field.order ?? index,
      isDefault: field.isDefault,
    })),
  }
}

// Validate form
const validate = () => {
  let isValid = true
  const errors: Record<string, { name?: string; unit?: string }> = {}
  const fieldNames = new Set<string>()

  form.value.fields.forEach((field, _index) => {
    const fieldKey = field.key
    const fieldErrors: { name?: string; unit?: string } = {}

    // Validate name
    if (!field.name.trim()) {
      fieldErrors.name = 'Field name is required'
      isValid = false
    } else if (fieldNames.has(field.name.toLowerCase())) {
      fieldErrors.name = 'Field name must be unique'
      isValid = false
    } else {
      fieldNames.add(field.name.toLowerCase())
    }

    // Validate unit
    if (!field.unit) {
      fieldErrors.unit = 'Unit is required'
      isValid = false
    }

    if (Object.keys(fieldErrors).length > 0) {
      errors[fieldKey] = fieldErrors
    }
  })

  fieldErrors.value = errors
  return isValid
}

// Submit form
const onSubmit = async () => {
  if (!validate()) {
    return
  }

  try {
    isSubmitting.value = true
    const templateData = {
      name: form.value.name,
      description: '',
      gender: form.value.gender,
      fields: form.value.fields.map((field, index) => ({
        ...(field.id && { id: field.id }),
        name: field.name.trim(),
        type: 'number', // Default to number type since it's not in the field object
        required: field.isRequired,
        unit: field.unit,
        order: index,
      })),
    }

    if (editing.value && props.template?.id) {
      try {
        const template = await $fetch(
          API_ENDPOINTS.MEASUREMENTS.TEMPLATE_BY_ID(props.template.id.toString()),
          {
            method: 'PATCH',
            body: templateData,
          }
        )

        await updateTemplate(Number(props.template.id), template as MeasurementTemplate)

        toast.add({
          title: 'Template updated',
          description: 'Your measurement template has been updated',
          icon: 'i-heroicons-check-circle',
          color: 'primary',
        })

        emit('saved')
        close()
      } catch (error) {
        throw new Error(
          (error as { data?: { message: string } })?.data?.message || 'Failed to update template'
        )
      }
    } else {
      try {
        const template = await $fetch<MeasurementTemplate>(API_ENDPOINTS.MEASUREMENTS.TEMPLATES, {
          method: 'POST',
          body: templateData,
        })

        await createTemplate({
          name: template.name,
          description: template.description,
          gender: template.gender || 'male',
          fields: template.fields.map(f => ({
            name: f.name,
            category: f.category || 'upperBody',
            order: f.order,
          })),
        })

        toast.add({
          title: 'Template created',
          description: 'Your new measurement template has been created',
          icon: 'i-heroicons-check-circle',
          color: 'primary',
        })

        emit('saved')
        close()
      } catch (error) {
        throw new Error(
          (error as { data?: { message: string } })?.data?.message || 'Failed to create template'
        )
      }
    }
  } catch (error: any) {
    console.error('Error saving template:', error)
    // Error handling is now done in the composable

    toast.add({
      title: 'Error saving template',
      description: error.message || 'An error occurred while saving the template',
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle',
    })
  } finally {
    isSubmitting.value = false
  }
}

// Close modal
const close = () => {
  isOpen.value = false
}

// Watch for template changes
watch(() => props.template, loadTemplateData, { immediate: true })

// Reset form when modal is closed
watch(isOpen, newVal => {
  if (!newVal) {
    resetForm()
  }
})
</script>
