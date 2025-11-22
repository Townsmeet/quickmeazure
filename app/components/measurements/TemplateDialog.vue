<template>
  <div class="h-[85vh] max-h-[85vh] flex flex-col">
    <UCard
      class="h-full flex flex-col"
      :ui="{
        body: 'flex-1 overflow-y-auto',
        header: 'sticky top-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur',
        footer: 'sticky bottom-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur',
      }"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">
            {{ isEdit ? 'Edit Template' : 'Create Template' }}
          </h3>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-heroicons-x-mark-20-solid"
            @click="close"
          />
        </div>
        <div class="mt-4 py-2 border-b border-gray-200">
          <div class="flex items-center space-x-4">
            <!-- Step 1 -->
            <div class="flex items-center">
              <div
                :class="[
                  'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
                  currentStep >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600',
                ]"
              >
                1
              </div>
              <span class="ml-2 text-sm font-medium text-gray-900">Basic Info</span>
            </div>
            <div :class="['w-16 h-0.5', currentStep > 1 ? 'bg-primary-600' : 'bg-gray-200']"></div>
            <!-- Step 2 -->
            <div class="flex items-center">
              <div
                :class="[
                  'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
                  currentStep >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600',
                ]"
              >
                2
              </div>
              <span class="ml-2 text-sm font-medium text-gray-900">Add Fields</span>
            </div>
          </div>
        </div>
      </template>
      <UForm :state="form" class="py-4">
        <!-- Step 1: Basic info -->
        <div v-if="currentStep === 1" class="space-y-4">
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
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Gender" name="gender" required>
              <USelect
                v-model="form.gender"
                :items="genders"
                placeholder="Select gender"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Measurement Unit" name="unit" required>
              <USelect
                v-model="form.unit"
                :items="units"
                placeholder="Select unit"
                class="w-full"
              />
            </UFormField>
          </div>
        </div>
        <!-- Step 2: Add Fields -->
        <div v-else-if="currentStep === 2" class="space-y-6">
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
          <div v-if="upperBodyFields.length > 0" class="space-y-2">
            <h4
              class="text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2"
            >
              Upper Body ({{ form.unit }})
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div
                v-for="field in upperBodyFields"
                :key="field.id"
                class="flex items-center justify-between p-3 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg"
              >
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-user" class="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span class="text-sm font-medium text-gray-900 dark:text-white">{{
                    field.name
                  }}</span>
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
          <div v-if="lowerBodyFields.length > 0" class="space-y-2">
            <h4
              class="text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2"
            >
              Lower Body ({{ form.unit }})
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div
                v-for="field in lowerBodyFields"
                :key="field.id"
                class="flex items-center justify-between p-3 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg"
              >
                <div class="flex items-center gap-2">
                  <UIcon
                    name="i-heroicons-arrow-down"
                    class="w-4 h-4 text-green-600 dark:text-green-400"
                  />
                  <span class="text-sm font-medium text-gray-900 dark:text-white">{{
                    field.name
                  }}</span>
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
          <div
            v-if="form.fields.length === 0"
            class="text-center py-8 text-gray-500 dark:text-gray-400"
          >
            <UIcon name="i-heroicons-document-text" class="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No measurement fields added yet</p>
            <p class="text-sm">
              All fields will use <strong>{{ form.unit }}</strong> as the unit
            </p>
          </div>
        </div>
      </UForm>
      <template #footer>
        <div class="flex justify-between">
          <div>
            <UButton
v-if="currentStep > 1"
type="button"
variant="outline"
@click="previousStep">
              <UIcon name="i-heroicons-arrow-left" class="w-4 h-4 mr-1" /> Previous
            </UButton>
          </div>
          <div class="flex gap-2">
            <UButton type="button" variant="outline" @click="close">Cancel</UButton>
            <UButton
              v-if="currentStep < 2"
              type="button"
              :disabled="!canProceedToStep2"
              @click="nextStep"
            >
              Next
              <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 ml-1" />
            </UButton>
            <UButton
              v-else
              type="button"
              :disabled="!isFormValid"
              :loading="isSubmitting"
              @click="submitForm"
            >
              {{ isEdit ? 'Update' : 'Create' }} Template
            </UButton>
          </div>
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { MeasurementTemplate, MeasurementField } from '~/types'
import { ref, computed, watch } from 'vue'

// Simple ID generator to replace nanoid
function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Local form field interface with string ID for consistency
interface FormField {
  id: string
  name: string
  category: string
  isRequired: boolean
  displayOrder: number
}

const props = defineProps<{
  template?: MeasurementTemplate | null
}>()
const emit = defineEmits<{
  (e: 'close'): void
  (
    e: 'submit',
    template: {
      name: string
      unit: string
      description?: string
      gender: string
      fields: MeasurementField[]
    }
  ): void
}>()

const isEdit = computed(() => !!props.template)
const currentStep = ref(1)
const isSubmitting = ref(false)

const genders = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Unisex', value: 'unisex' },
]
const units = [
  { label: 'Centimeters', value: 'cm' },
  { label: 'Inches', value: 'in' },
  { label: 'Meters', value: 'm' },
]
const fieldCategories = [
  { label: 'Upper Body', value: 'upper' },
  { label: 'Lower Body', value: 'lower' },
]

const newField = ref({ name: '', category: 'upper' })

function blankForm() {
  return {
    name: '',
    description: '',
    gender: 'unisex',
    unit: 'cm',
    fields: [] as FormField[],
  }
}

const form = ref(blankForm())

const upperBodyFields = computed(() => form.value.fields.filter(f => f.category === 'upper'))
const lowerBodyFields = computed(() => form.value.fields.filter(f => f.category === 'lower'))

const canProceedToStep2 = computed(
  () => form.value.name.trim() && form.value.gender && form.value.unit
)
const isFormValid = computed(() => canProceedToStep2.value && form.value.fields.length > 0)

function nextStep() {
  if (canProceedToStep2.value) currentStep.value = 2
}
function previousStep() {
  if (currentStep.value > 1) currentStep.value = 1
}

function addField() {
  if (!newField.value.name.trim()) return
  form.value.fields.push({
    id: generateId(),
    name: newField.value.name.trim(),
    category: newField.value.category,
    isRequired: true,
    displayOrder: form.value.fields.length,
  })
  newField.value.name = ''
}
function removeField(id: string) {
  const index = form.value.fields.findIndex(f => f.id === id)
  if (index !== -1) form.value.fields.splice(index, 1)
}
function close() {
  emit('close')
}
function submitForm() {
  if (!isFormValid.value) return
  isSubmitting.value = true
  emit('submit', {
    name: form.value.name,
    unit: form.value.unit,
    description: form.value.description,
    gender: form.value.gender,
    fields: form.value.fields.map(
      (field, idx) =>
        ({
          id: field.id,
          name: field.name,
          isRequired: field.isRequired,
          displayOrder: idx,
          category: field.category,
        }) as MeasurementField
    ),
  })
  isSubmitting.value = false
}
function resetForm() {
  currentStep.value = 1
  Object.assign(form.value, blankForm())
  newField.value.name = ''
}
// Handle prop updates for edit vs create
watch(
  () => props.template,
  tmpl => {
    if (tmpl) {
      currentStep.value = 1
      form.value.name = tmpl.name
      form.value.description = tmpl.description || ''
      form.value.gender = tmpl.gender || 'unisex'
      form.value.unit = tmpl.unit || 'cm'
      form.value.fields = (tmpl.fields || []).map((f, idx) => ({
        id: f.id?.toString() || generateId(),
        name: f.name,
        category: f.category || 'upper',
        isRequired: f.isRequired ?? true,
        displayOrder: f.displayOrder ?? idx,
      })) as FormField[]
    } else {
      resetForm()
    }
  },
  { immediate: true }
)
</script>
