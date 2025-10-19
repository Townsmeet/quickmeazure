<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <PageHeader
      title="Measurement Templates"
      :primary-action="{
        label: 'New Template',
        icon: 'i-heroicons-plus',
        onClick: openCreateDialog,
      }"
    />

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 mx-auto animate-spin" />
      <p class="mt-2 text-gray-500">Loading templates...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="templates.length === 0" class="text-center py-12">
      <UIcon name="i-heroicons-document-text" class="w-12 h-12 text-gray-300 mx-auto" />
      <h3 class="mt-2 text-lg font-medium text-gray-900">No templates yet</h3>
      <p class="mt-1 text-gray-500">Get started by creating your first measurement template.</p>
      <UButton color="primary" class="mt-4" @click="openCreateDialog"> Create Template </UButton>
    </div>

    <!-- Templates List -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <TemplateCard
        v-for="template in templates"
        :key="template.id"
        :template="template"
        @edit="openEditDialog"
        @delete="confirmDelete"
        @set-default="handleSetDefault"
        @archive="handleArchive"
        @unarchive="handleUnarchive"
      />
    </div>

    <!-- Create/Edit Modal -->
    <UModal v-model:open="dialogOpen" :dismissible="false">
      <template #content>
        <div class="flex flex-col">
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
                  {{ editingTemplate ? 'Edit Template' : 'Create Template' }}
                </h3>
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-heroicons-x-mark-20-solid"
                  @click="dialogOpen = false"
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

            <UForm :state="templateForm" class="py-4">
              <!-- Step 1: Basic info -->
              <div v-if="currentStep === 1" class="space-y-4">
                <UFormField label="Template Name" name="name" required>
                  <UInput
                    v-model="templateForm.name"
                    placeholder="e.g., Men's Formal Shirt"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="Description" name="description">
                  <UTextarea
                    v-model="templateForm.description"
                    placeholder="Brief description of this template..."
                    :rows="3"
                    class="w-full"
                  />
                </UFormField>
                <div class="grid grid-cols-2 gap-4">
                  <UFormField label="Gender" name="gender" required>
                    <URadioGroup
                      v-model="templateForm.gender"
                      variant="card"
                      :items="genderOptions"
                    />
                  </UFormField>
                  <UFormField label="Measurement Unit" name="unit" required>
                    <URadioGroup v-model="templateForm.unit" variant="card" :items="unitOptions" />
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
                          @keyup.enter="() => addTemplateField('upper')"
                        />
                        <UButton
                          icon="i-heroicons-plus"
                          type="button"
                          @click="() => addTemplateField('upper')"
                        />
                      </div>

                      <div v-if="upperBodyFields.length > 0" class="space-y-2">
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
                              @click="removeTemplateField(field.id)"
                            />
                          </div>
                        </div>
                      </div>

                      <div v-else class="text-center py-8 text-gray-500">
                        <UIcon name="i-heroicons-user" class="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p>No upper body fields added yet</p>
                        <p class="text-sm">Add measurements like chest, shoulders, etc.</p>
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
                          @keyup.enter="() => addTemplateField('lower')"
                        />
                        <UButton
                          icon="i-heroicons-plus"
                          type="button"
                          @click="() => addTemplateField('lower')"
                        />
                      </div>

                      <div v-if="lowerBodyFields.length > 0" class="space-y-2">
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
                              @click="removeTemplateField(field.id)"
                            />
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
                  <UButton
type="button"
variant="outline"
@click="dialogOpen = false"
                    >Cancel</UButton
                  >
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
                    :disabled="!isTemplateFormValid"
                    :loading="isSubmitting"
                    @click="submitTemplateForm"
                  >
                    {{ editingTemplate ? 'Update' : 'Create' }}
                  </UButton>
                </div>
              </div>
            </template>
          </UCard>
        </div>
      </template>
    </UModal>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="confirmDeleteOpen" :dismissible="false">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Delete Template</h3>
          </template>
          <p class="text-gray-600">
            Are you sure you want to delete this template? This action cannot be undone.
          </p>
          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton color="neutral" variant="outline" @click="confirmDeleteOpen = false">
                Cancel
              </UButton>
              <UButton color="error" :loading="isDeleting" @click="deleteTemplateHandler">
                Delete
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import TemplateCard from '~/components/measurements/TemplateCard.vue'
import PageHeader from '~/components/common/PageHeader.vue'
import type { MeasurementTemplate } from '~/types'
import { ref } from 'vue'
definePageMeta({ middleware: 'auth', layout: 'dashboard' })

// Composable for CRUD actions
const {
  templates,
  isLoading,
  error,
  createTemplate,
  updateTemplate,
  deleteTemplate: deleteTemplateApi,
  setDefaultTemplate,
  archiveTemplate,
  unarchiveTemplate,
  refreshTemplates,
} = useMeasurementTemplates()

// Toast notifications
const toast = useToast()

// State
const dialogOpen = ref(false)
const confirmDeleteOpen = ref(false)
const isDeleting = ref(false)
const editingTemplate = ref<MeasurementTemplate | null>(null)
const templateToDelete = ref<string | null>(null)
const isSubmitting = ref(false)

// Template form state
const currentStep = ref(1)
const newFieldName = ref('')
const activeFieldTab = ref('upper')

// Simple ID generator
function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

interface FormField {
  id: string
  name: string
  category: string
  isRequired: boolean
  displayOrder: number
}

function blankTemplateForm() {
  return {
    name: '',
    description: '',
    gender: 'unisex',
    unit: 'in',
    fields: [] as FormField[],
  }
}

const templateForm = ref(blankTemplateForm())

// Options
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

// Computed
const upperBodyFields = computed(() =>
  templateForm.value.fields.filter(f => f.category === 'upper')
)
const lowerBodyFields = computed(() =>
  templateForm.value.fields.filter(f => f.category === 'lower')
)
const canProceedToStep2 = computed(
  () => templateForm.value.name.trim() && templateForm.value.gender && templateForm.value.unit
)
const isTemplateFormValid = computed(
  () => canProceedToStep2.value && templateForm.value.fields.length > 0
)

function openCreateDialog() {
  editingTemplate.value = null
  currentStep.value = 1
  Object.assign(templateForm.value, blankTemplateForm())
  newFieldName.value = ''
  activeFieldTab.value = 'upper'
  dialogOpen.value = true
}

function openEditDialog(template: MeasurementTemplate) {
  editingTemplate.value = {
    ...template,
    fields: template.fields.map(field => ({ ...field })),
  } as MeasurementTemplate

  // Populate form
  currentStep.value = 1
  templateForm.value.name = template.name
  templateForm.value.description = template.description || ''
  templateForm.value.gender = template.gender || 'unisex'
  templateForm.value.unit = template.unit || 'cm'
  templateForm.value.fields = (template.fields || []).map((f, idx) => ({
    id: f.id?.toString() || generateId(),
    name: f.name,
    category: f.category || 'upper',
    isRequired: f.isRequired ?? true,
    displayOrder: f.displayOrder ?? idx,
  })) as FormField[]

  dialogOpen.value = true
}

// Template form methods
function nextStep() {
  if (canProceedToStep2.value) currentStep.value = 2
}

function previousStep() {
  if (currentStep.value > 1) currentStep.value = 1
}

function addTemplateField(category: string) {
  if (!newFieldName.value.trim()) return
  templateForm.value.fields.push({
    id: generateId(),
    name: newFieldName.value.trim(),
    category: category,
    isRequired: true,
    displayOrder: templateForm.value.fields.length,
  })
  newFieldName.value = ''
}

function removeTemplateField(id: string) {
  const index = templateForm.value.fields.findIndex(f => f.id === id)
  if (index !== -1) templateForm.value.fields.splice(index, 1)
}

async function submitTemplateForm() {
  if (!isTemplateFormValid.value) return
  isSubmitting.value = true

  const templateData = {
    name: templateForm.value.name,
    unit: templateForm.value.unit,
    ...(templateForm.value.description && { description: templateForm.value.description }),
    gender: templateForm.value.gender,
    fields: templateForm.value.fields.map((field, idx) => ({
      name: field.name,
      isRequired: field.isRequired,
      displayOrder: idx,
      category: field.category,
    })),
  }

  console.log('Submitting template data:', templateData)
  await handleTemplateSubmit(templateData)
  isSubmitting.value = false
}

function confirmDelete(id: string) {
  templateToDelete.value = id
  confirmDeleteOpen.value = true
}

async function deleteTemplateHandler() {
  if (!templateToDelete.value) return
  try {
    isDeleting.value = true
    const success = await deleteTemplateApi(Number(templateToDelete.value))
    if (success) {
      confirmDeleteOpen.value = false
      templateToDelete.value = null
      await refreshTemplates()
      toast.add({
        title: 'Template deleted',
        description: 'Template has been successfully deleted.',
        color: 'success',
      })
    } else {
      toast.add({
        title: 'Delete failed',
        description: 'Failed to delete template. Please try again.',
        color: 'error',
      })
    }
  } catch (e) {
    toast.add({
      title: 'Delete failed',
      description: 'An error occurred while deleting the template.',
      color: 'error',
    })
  } finally {
    isDeleting.value = false
  }
}

async function handleSetDefault(id: number) {
  try {
    const success = await setDefaultTemplate(id)
    if (success) {
      await refreshTemplates()
      toast.add({
        title: 'Default template set',
        description: 'Template has been set as your default template.',
        color: 'success',
      })
    } else {
      toast.add({
        title: 'Failed to set default',
        description: 'Could not set template as default. Please try again.',
        color: 'error',
      })
    }
  } catch (e) {
    console.error('Failed to set default template:', e)
    toast.add({
      title: 'Error setting default',
      description: 'An error occurred while setting the default template.',
      color: 'error',
    })
  }
}

async function handleArchive(id: number) {
  try {
    const success = await archiveTemplate(id)
    if (success) {
      await refreshTemplates()
      toast.add({
        title: 'Template archived',
        description: 'Template has been successfully archived.',
        color: 'success',
      })
    } else {
      toast.add({
        title: 'Archive failed',
        description: 'Could not archive template. Please try again.',
        color: 'error',
      })
    }
  } catch (e) {
    console.error('Failed to archive template:', e)
    toast.add({
      title: 'Error archiving template',
      description: 'An error occurred while archiving the template.',
      color: 'error',
    })
  }
}

async function handleUnarchive(id: number) {
  try {
    const success = await unarchiveTemplate(id)
    if (success) {
      await refreshTemplates()
      toast.add({
        title: 'Template unarchived',
        description: 'Template has been successfully unarchived.',
        color: 'success',
      })
    } else {
      toast.add({
        title: 'Unarchive failed',
        description: 'Could not unarchive template. Please try again.',
        color: 'error',
      })
    }
  } catch (e) {
    console.error('Failed to unarchive template:', e)
    toast.add({
      title: 'Error unarchiving template',
      description: 'An error occurred while unarchiving the template.',
      color: 'error',
    })
  }
}

interface CreateFieldData {
  name: string
  isRequired: boolean
  displayOrder: number
  category: string
}

async function handleTemplateSubmit(templateData: {
  name: string
  unit: string
  description?: string
  gender: string
  fields: CreateFieldData[]
}) {
  try {
    if (editingTemplate.value) {
      const response = await updateTemplate(Number(editingTemplate.value.id), {
        name: templateData.name,
        unit: templateData.unit,
        gender: templateData.gender as 'male' | 'female' | 'unisex',
        fields: templateData.fields,
        description: templateData.description,
      })
      if (response.success) {
        dialogOpen.value = false
        editingTemplate.value = null
        await refreshTemplates()
        toast.add({
          title: 'Template updated',
          description: 'Template has been successfully updated.',
          color: 'success',
        })
      } else {
        toast.add({
          title: 'Update failed',
          description: response.message || 'Failed to update template. Please try again.',
          color: 'error',
        })
      }
    } else {
      const response = await createTemplate({
        name: templateData.name,
        unit: templateData.unit,
        gender: templateData.gender as 'male' | 'female' | 'unisex',
        description: templateData.description,
        fields: templateData.fields,
      })
      if (response.success) {
        dialogOpen.value = false
        editingTemplate.value = null
        await refreshTemplates()
        toast.add({
          title: 'Template created',
          description: 'Template has been successfully created.',
          color: 'success',
        })
      } else {
        toast.add({
          title: 'Creation failed',
          description: response.message || 'Failed to create template. Please try again.',
          color: 'error',
        })
      }
    }
  } catch (e) {
    console.error('Template submit error:', e)
    toast.add({
      title: 'Error saving template',
      description: 'An error occurred while saving the template.',
      color: 'error',
    })
  }
}
</script>
