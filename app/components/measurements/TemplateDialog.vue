<template>
  <UModal v-model:open="isOpen" :dismissible="false">
    <template #content>
      <div class="flex flex-col">
        <UCard
          class="h-full flex flex-col"
          :ui="{
            body: 'flex-1 overflow-y-auto',
            header: 'flex-shrink-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur',
            footer: 'flex-shrink-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur',
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
            <div class="mt-2 pb-3">
              <UStepper
                :model-value="currentStep - 1"
                :items="stepperItems"
                size="sm"
                :disabled="true"
              />
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
                  <URadioGroup v-model="form.gender" variant="card" :items="genderOptions" />
                </UFormField>
                <UFormField label="Measurement Unit" name="unit" required>
                  <URadioGroup v-model="form.unit" variant="card" :items="unitOptions" />
                </UFormField>
              </div>
            </div>

            <!-- Step 2: Add Fields -->
            <div v-else-if="currentStep === 2" class="space-y-4">
              <UTabs v-model="activeFieldTab" :items="fieldTabItems" class="w-full">
                <template #upper>
                  <div class="space-y-4">
                    <div class="flex gap-2">
                      <UInput
                        v-model="newFieldName"
                        placeholder="Field name (e.g., Chest)"
                        class="flex-1"
                        @keyup.enter="() => addField('upper')"
                      />
                      <UButton
                        icon="i-heroicons-plus"
                        type="button"
                        @click="() => addField('upper')"
                      />
                    </div>

                    <!-- Scrollable container -->
                    <div style="max-height: 320px; overflow-y: auto" class="pr-2">
                      <div v-if="upperBodyFields.length > 0" class="space-y-2">
                        <div ref="upperBodyListEl" class="flex flex-col gap-2">
                          <div
                            v-for="field in upperBodyFields"
                            :key="field.id"
                            class="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/40 dark:border-blue-400 cursor-move"
                          >
                            <UIcon
                              name="i-heroicons-bars-3"
                              class="drag-handle w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0"
                            />

                            <!-- Edit Mode -->
                            <div
                              v-if="editingFieldId === String(field.id)"
                              class="flex items-center gap-2 flex-1 min-w-0"
                            >
                              <UInput
                                v-model="editNameBuffer"
                                size="xs"
                                class="flex-1"
                                autofocus
                                @keyup.enter="saveEdit"
                                @keyup.esc="cancelEdit"
                                @click.stop
                              />
                              <UButton
                                variant="ghost"
                                color="success"
                                icon="i-heroicons-check"
                                size="xs"
                                @click.stop="saveEdit"
                              />
                              <UButton
                                variant="ghost"
                                color="neutral"
                                icon="i-heroicons-x-mark"
                                size="xs"
                                @click.stop="cancelEdit"
                              />
                            </div>

                            <!-- View Mode -->
                            <div
                              v-else
                              class="flex items-center gap-2 flex-1 min-w-0"
                              @dblclick="startEdit(field)"
                            >
                              <span
                                class="text-sm font-medium text-gray-900 dark:text-blue-100 truncate"
                                >{{ field.name }}</span
                              >
                            </div>

                            <div class="flex items-center gap-1 flex-shrink-0">
                              <UButton
                                variant="ghost"
                                color="primary"
                                icon="i-heroicons-pencil"
                                size="xs"
                                class="opacity-0 group-hover:opacity-100 transition-opacity"
                                :class="{ 'opacity-100': isMobile }"
                                @click.stop="startEdit(field)"
                              />
                              <UButton
                                variant="ghost"
                                :color="
                                  deleteConfirmationId === String(field.id) ? 'error' : 'neutral'
                                "
                                :icon="
                                  deleteConfirmationId === String(field.id)
                                    ? 'i-heroicons-check'
                                    : 'i-heroicons-trash'
                                "
                                size="xs"
                                @click.stop="confirmRemoveField(String(field.id))"
                              >
                                <span
                                  v-if="deleteConfirmationId === String(field.id)"
                                  class="ml-1 text-xs"
                                  >Sure?</span
                                >
                              </UButton>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div v-else class="text-center py-8 text-gray-500">
                        <UIcon name="i-heroicons-user" class="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p>No upper body fields added yet</p>
                        <p class="text-sm">Add measurements like chest, shoulders, etc.</p>
                      </div>
                    </div>
                  </div>
                </template>

                <template #lower>
                  <div class="space-y-4">
                    <div class="flex gap-2">
                      <UInput
                        v-model="newFieldName"
                        placeholder="Field name (e.g., Waist)"
                        class="flex-1"
                        @keyup.enter="() => addField('lower')"
                      />
                      <UButton
                        icon="i-heroicons-plus"
                        type="button"
                        @click="() => addField('lower')"
                      />
                    </div>

                    <!-- Scrollable container -->
                    <div style="max-height: 320px; overflow-y: auto" class="pr-2">
                      <div v-if="lowerBodyFields.length > 0" class="space-y-2">
                        <div ref="lowerBodyListEl" class="flex flex-col gap-2">
                          <div
                            v-for="field in lowerBodyFields"
                            :key="field.id"
                            class="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/40 dark:border-green-400 cursor-move"
                          >
                            <UIcon
                              name="i-heroicons-bars-3"
                              class="drag-handle w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0"
                            />

                            <!-- Edit Mode -->
                            <div
                              v-if="editingFieldId === String(field.id)"
                              class="flex items-center gap-2 flex-1 min-w-0"
                            >
                              <UInput
                                v-model="editNameBuffer"
                                size="xs"
                                class="flex-1"
                                autofocus
                                @keyup.enter="saveEdit"
                                @keyup.esc="cancelEdit"
                                @click.stop
                              />
                              <UButton
                                variant="ghost"
                                color="success"
                                icon="i-heroicons-check"
                                size="xs"
                                @click.stop="saveEdit"
                              />
                              <UButton
                                variant="ghost"
                                color="neutral"
                                icon="i-heroicons-x-mark"
                                size="xs"
                                @click.stop="cancelEdit"
                              />
                            </div>

                            <!-- View Mode -->
                            <div
                              v-else
                              class="flex items-center gap-2 flex-1 min-w-0"
                              @dblclick="startEdit(field)"
                            >
                              <span
                                class="text-sm font-medium text-gray-900 dark:text-green-100 truncate"
                                >{{ field.name }}</span
                              >
                            </div>

                            <div class="flex items-center gap-1 flex-shrink-0">
                              <UButton
                                variant="ghost"
                                color="primary"
                                icon="i-heroicons-pencil"
                                size="xs"
                                class="opacity-0 group-hover:opacity-100 transition-opacity"
                                :class="{ 'opacity-100': isMobile }"
                                @click.stop="startEdit(field)"
                              />
                              <UButton
                                variant="ghost"
                                :color="
                                  deleteConfirmationId === String(field.id) ? 'error' : 'neutral'
                                "
                                :icon="
                                  deleteConfirmationId === String(field.id)
                                    ? 'i-heroicons-check'
                                    : 'i-heroicons-trash'
                                "
                                size="xs"
                                @click.stop="confirmRemoveField(String(field.id))"
                              >
                                <span
                                  v-if="deleteConfirmationId === String(field.id)"
                                  class="ml-1 text-xs"
                                  >Sure?</span
                                >
                              </UButton>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div v-else class="text-center py-8 text-gray-500">
                        <UIcon
                          name="i-heroicons-arrow-down"
                          class="w-8 h-8 mx-auto mb-2 text-gray-300"
                        />
                        <p>No lower body fields added yet</p>
                        <p class="text-sm">Add measurements like waist, hips, etc.</p>
                      </div>
                    </div>
                  </div>
                </template>
              </UTabs>
            </div>
          </UForm>

          <template #footer>
            <div class="flex justify-between">
              <div>
                <UButton
                  v-if="currentStep > 1"
                  type="button"
                  variant="outline"
                  @click="previousStep"
                >
                  <UIcon name="i-heroicons-arrow-left" class="w-4 h-4 mr-1" /> Back
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
                  {{ isEdit ? 'Update' : 'Create' }}
                </UButton>
              </div>
            </div>
          </template>
        </UCard>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { MeasurementTemplate, MeasurementField } from '~/types'
import { ref, computed, watch, nextTick } from 'vue'
import Sortable from 'sortablejs'
import { useWindowSize } from '@vueuse/core'

const { width } = useWindowSize()
const isMobile = computed(() => width.value < 640) // sm breakpoint

// Simple ID generator
function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Local form field interface
interface FormField {
  id: string
  name: string
  category: string
  isRequired: boolean
  displayOrder: number
}

const props = defineProps<{
  open: boolean
  template?: MeasurementTemplate | null
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
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

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
})

const isEdit = computed(() => !!props.template)
const currentStep = ref(1)
const isSubmitting = ref(false)
const newFieldName = ref('')
const activeFieldTab = ref('upper')

// Refs for sortable containers
const upperBodyListEl = ref<HTMLElement | null>(null)
const lowerBodyListEl = ref<HTMLElement | null>(null)

const genderOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Unisex', value: 'unisex' },
]
const unitOptions = [
  { label: 'Centimeters', value: 'cm' },
  { label: 'Inches', value: 'in' },
  { label: 'Meters', value: 'm' },
]
const fieldTabItems = [
  { label: 'Upper Body', value: 'upper', slot: 'upper', icon: 'i-heroicons-user' },
  { label: 'Lower Body', value: 'lower', slot: 'lower', icon: 'i-heroicons-arrow-down' },
]

const stepperItems = [
  {
    title: 'Basic Info',
    description: 'Template name and settings',
    icon: 'i-heroicons-information-circle',
  },
  { title: 'Add Fields', description: 'Measurement fields', icon: 'i-heroicons-plus-circle' },
]

function blankForm() {
  return {
    name: '',
    description: '',
    gender: 'unisex',
    unit: 'in',
    fields: [] as FormField[],
  }
}

const form = ref(blankForm())

const upperBodyFields = computed(() => form.value.fields.filter(f => f.category === 'upper'))
const lowerBodyFields = computed(() => form.value.fields.filter(f => f.category === 'lower'))

// Inline editing and safe delete state
const editingFieldId = ref<string | null>(null)
const deleteConfirmationId = ref<string | null>(null)
const editNameBuffer = ref('')

function startEdit(field: MeasurementField) {
  editingFieldId.value = String(field.id)
  editNameBuffer.value = field.name
  deleteConfirmationId.value = null // Cancel any pending delete
}

function saveEdit() {
  if (!editingFieldId.value || !editNameBuffer.value.trim()) return

  const field = form.value.fields.find(f => String(f.id) === editingFieldId.value)
  if (field) {
    field.name = editNameBuffer.value.trim()
  }
  editingFieldId.value = null
  editNameBuffer.value = ''
}

function cancelEdit() {
  editingFieldId.value = null
  editNameBuffer.value = ''
}

function confirmRemoveField(id: string) {
  if (deleteConfirmationId.value === id) {
    // Second click - actually remove
    removeField(id)
    deleteConfirmationId.value = null
  } else {
    // First click - show confirmation
    deleteConfirmationId.value = id
    // Auto-reset after 3 seconds if not confirmed
    setTimeout(() => {
      if (deleteConfirmationId.value === id) {
        deleteConfirmationId.value = null
      }
    }, 3000)
  }
}

// Sortable instances
let upperSortable: Sortable | null = null
let lowerSortable: Sortable | null = null

// Initialize sortable when tab changes or fields are added
watch(
  [() => props.open, currentStep, activeFieldTab, () => form.value.fields.length],
  async () => {
    if (props.open && currentStep.value === 2) {
      await nextTick()

      // Destroy existing instances
      if (upperSortable) upperSortable.destroy()
      if (lowerSortable) lowerSortable.destroy()

      // Initialize upper body sortable
      if (upperBodyListEl.value && activeFieldTab.value === 'upper') {
        upperSortable = Sortable.create(upperBodyListEl.value, {
          animation: 150,
          handle: '.drag-handle',
          ghostClass: 'opacity-50',
          onEnd: evt => {
            if (evt.oldIndex !== undefined && evt.newIndex !== undefined) {
              const upperFields = form.value.fields.filter(f => f.category === 'upper')
              const [movedItem] = upperFields.splice(evt.oldIndex, 1)
              if (movedItem) {
                upperFields.splice(evt.newIndex, 0, movedItem)

                // Update displayOrder
                upperFields.forEach((field, index) => {
                  field.displayOrder = index
                })

                // Merge back with lower body fields
                const lowerFields = form.value.fields.filter(f => f.category === 'lower')
                form.value.fields = [...upperFields, ...lowerFields]
              }
            }
          },
        })
      }

      // Initialize lower body sortable
      if (lowerBodyListEl.value && activeFieldTab.value === 'lower') {
        lowerSortable = Sortable.create(lowerBodyListEl.value, {
          animation: 150,
          handle: '.drag-handle',
          ghostClass: 'opacity-50',
          onEnd: evt => {
            if (evt.oldIndex !== undefined && evt.newIndex !== undefined) {
              const lowerFields = form.value.fields.filter(f => f.category === 'lower')
              const [movedItem] = lowerFields.splice(evt.oldIndex, 1)
              if (movedItem) {
                lowerFields.splice(evt.newIndex, 0, movedItem)

                // Update displayOrder
                lowerFields.forEach((field, index) => {
                  field.displayOrder = index
                })

                // Merge back with upper body fields
                const upperFields = form.value.fields.filter(f => f.category === 'upper')
                form.value.fields = [...upperFields, ...lowerFields]
              }
            }
          },
        })
      }
    }
  },
  { immediate: true }
)

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

function addField(category: string) {
  if (!newFieldName.value.trim()) return
  form.value.fields.push({
    id: generateId(),
    name: newFieldName.value.trim(),
    category: category,
    isRequired: true,
    displayOrder: form.value.fields.length,
  })
  newFieldName.value = ''
}

function removeField(id: string) {
  const index = form.value.fields.findIndex(f => f.id === id)
  if (index !== -1) form.value.fields.splice(index, 1)
}

function updateFieldOrder(category: string) {
  // Update displayOrder for all fields in the category based on their current position
  form.value.fields = form.value.fields.map((field, index) => {
    if (field.category === category) {
      const categoryFields = form.value.fields.filter(f => f.category === category)
      const newOrder = categoryFields.findIndex(f => f.id === field.id)
      return { ...field, displayOrder: newOrder }
    }
    return field
  })
}

function close() {
  emit('update:open', false)
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
  newFieldName.value = ''
  activeFieldTab.value = 'upper'
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
      form.value.unit = tmpl.unit || 'in'
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

// Reset form when modal closes
watch(
  () => props.open,
  isOpen => {
    if (!isOpen && !props.template) {
      resetForm()
    }
  }
)
</script>
