<template>
  <USlideover
    :open="isOpen"
    title="Add Client"
    side="right"
    @update:open="value => !value && handleClose()"
  >
    <template #body>
      <div class="space-y-6 min-h-0">
        <!-- Client Information -->
        <div class="space-y-4">
          <h4 class="text-lg font-medium text-gray-900 dark:text-white">Client Information</h4>

          <UFormField label="Full Name" name="name" required>
            <UInput v-model="formData.name" placeholder="Enter full name" class="w-full" />
          </UFormField>

          <UFormField label="Gender" name="gender" required>
            <URadioGroup
              v-model="formData.gender"
              :items="genderOptions"
              orientation="horizontal"
            />
          </UFormField>

          <UFormField label="Phone" name="phone" required>
            <UInput v-model="formData.phone" placeholder="Enter phone number" class="w-full" />
          </UFormField>
        </div>

        <!-- Measurements -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h4 class="text-lg font-medium text-gray-900 dark:text-white">Measurements</h4>
          </div>

          <!-- Template Selection -->
          <UFormField label="Measurement Template" name="template" required>
            <USelectMenu
              v-model="selectedTemplateOption"
              :items="templateOptions"
              placeholder="Select a measurement template"
              class="w-full"
              @update:model-value="onTemplateChange"
            />
          </UFormField>

          <!-- Measurement Fields -->
          <div
            v-if="selectedTemplate"
            :key="selectedTemplate.id"
            class="space-y-4 flex-shrink-0"
            data-measurement-fields
          >
            <div class="text-sm text-gray-600 mb-4">
              Template: {{ selectedTemplate.name }} ({{ selectedTemplate.unit }})
            </div>

            <div class="grid grid-cols-2 gap-4">
              <UFormField
                v-for="field in sortedFields"
                :key="field.id"
                :label="field.name"
                :name="`measurement.${field.id}`"
                :required="field.isRequired"
              >
                <UInput
                  v-model="measurementValues[String(field.id)]"
                  type="number"
                  step="0.1"
                  :placeholder="`Enter ${field.name.toLowerCase()}`"
                  class="w-full"
                />
              </UFormField>
            </div>

            <!-- Measurement Notes -->
            <UFormField label="Measurement Notes" name="measurementNotes">
              <UTextarea
                v-model="measurementNotes"
                placeholder="Add any notes about these measurements"
                :rows="3"
                class="w-full"
              />
            </UFormField>
          </div>

          <div
            v-else-if="templates.length === 0"
            class="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg"
          >
            <UIcon name="i-heroicons-ruler" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-500 mb-4">No measurement templates available</p>
            <p class="text-sm text-gray-400">
              Create a measurement template first to add measurements
            </p>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end space-x-3">
        <UButton
color="neutral"
variant="outline"
:disabled="isSubmitting"
@click="handleClose">
          Cancel
        </UButton>
        <UButton color="primary" :loading="isSubmitting" @click="handleSubmit">
          Add Client
        </UButton>
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import type { MeasurementTemplate } from '~/types'

interface Props {
  isOpen: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'success', client: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Form state
const formData = ref({
  name: '',
  gender: '',
  phone: '',
})

const isSubmitting = ref(false)

// Gender options
const genderOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
]

// Measurement state
const { templates, fetchTemplates } = useMeasurementTemplates()
const selectedTemplateOption = ref<any>(null)
const selectedTemplate = ref<MeasurementTemplate | null>(null)
const measurementValues = ref<Record<string, number>>({})
const measurementNotes = ref('')

// Computed properties
const templateOptions = computed(() =>
  templates.value
    .filter(template => !template.isArchived)
    .map(template => ({
      label: `${template.name} (${template.gender})`,
      value: template.id,
      ...template, // Include the full template object
    }))
)

const sortedFields = computed(() => {
  if (!selectedTemplate.value?.fields) return []
  return [...selectedTemplate.value.fields].sort((a, b) => a.displayOrder - b.displayOrder)
})

// Load templates when component mounts
onMounted(async () => {
  await fetchTemplates()
})

// Template selection handler
const onTemplateChange = async (templateOption: any) => {
  if (!templateOption) {
    selectedTemplate.value = null
    measurementValues.value = {}
    return
  }

  // Set the selected template from the option
  selectedTemplate.value = templateOption

  // Initialize measurement values
  measurementValues.value = {}
  if (templateOption.fields) {
    templateOption.fields.forEach((field: any) => {
      measurementValues.value[String(field.id)] = 0
    })
  }

  // Wait for DOM update and ensure proper scrolling
  await nextTick()

  // Scroll to the measurement fields section smoothly
  const measurementSection = document.querySelector('[data-measurement-fields]')
  if (measurementSection) {
    measurementSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
}

// Close handler
const handleClose = () => {
  emit('close')
}

// Reset form when slideover closes
watch(
  () => props.isOpen,
  isOpen => {
    if (!isOpen) {
      formData.value = {
        name: '',
        gender: '',
        phone: '',
      }
      selectedTemplateOption.value = null
      selectedTemplate.value = null
      measurementValues.value = {}
      measurementNotes.value = ''
    }
  }
)

const handleSubmit = async () => {
  // Basic validation
  if (!formData.value.name.trim() || !formData.value.gender || !formData.value.phone.trim()) {
    useToast().add({
      title: 'Validation Error',
      description: 'Please fill in all required fields.',
      color: 'error',
    })
    return
  }

  // Validate measurements if template is selected
  if (selectedTemplate.value) {
    const requiredFields = selectedTemplate.value.fields.filter(field => field.isRequired)
    const missingFields = requiredFields.filter(field => {
      const fieldValue = measurementValues.value?.[String(field.id)]
      return !fieldValue || fieldValue <= 0
    })

    if (missingFields.length > 0) {
      useToast().add({
        title: 'Validation Error',
        description: `Please fill in all required measurement fields: ${missingFields.map(f => f.name).join(', ')}`,
        color: 'error',
      })
      return
    }
  }

  try {
    isSubmitting.value = true

    // Use the clients composable to create the client
    const { createClient } = useClients()

    // Prepare measurement data
    let measurements = undefined
    if (
      selectedTemplate.value &&
      measurementValues.value &&
      Object.keys(measurementValues.value).length > 0
    ) {
      const measurementData: Record<string, any> = {}

      // Add measurement values with proper structure
      Object.entries(measurementValues.value || {}).forEach(([fieldId, value]) => {
        const field = selectedTemplate.value?.fields.find(
          f => f.id.toString() === fieldId.toString()
        )
        if (field && value > 0) {
          measurementData[fieldId] = {
            value: value,
            unit: selectedTemplate.value?.unit || 'in',
            name: field.name,
            fieldId: parseInt(fieldId.toString()),
            isRequired: field.isRequired,
            displayOrder: field.displayOrder,
          }
        }
      })

      // Add template information
      measurementData._template = {
        id: selectedTemplate.value.id,
        name: selectedTemplate.value.name,
        gender: selectedTemplate.value.gender,
        unit: selectedTemplate.value.unit,
        fields: selectedTemplate.value.fields.map(f => f.id),
      }

      measurements = {
        values: measurementData,
        notes: measurementNotes.value || undefined,
      }
    }

    const result = await createClient({
      name: formData.value.name.trim(),
      gender: formData.value.gender,
      phone: formData.value.phone.trim(),
      measurements,
    })

    if (result.success && result.data) {
      useToast().add({
        title: 'Client added',
        description: 'The client has been successfully added.',
        color: 'success',
      })

      // Emit success with the created client
      emit('success', result.data)
    } else {
      throw new Error(result.message || 'Failed to create client')
    }
  } catch (error) {
    console.error('Failed to create client:', error)
    useToast().add({
      title: 'Error',
      description: 'Failed to add client. Please try again.',
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>
