<template>
  <div class="min-h-screen bg-gray-50 space-y-6">
    <div class="max-w-4xl mx-auto">
      <div class="text-center mb-6 sm:mb-8">
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Set Up Your Measurement Templates
        </h1>
        <p class="text-sm sm:text-base text-gray-600">
          Create customized templates for male and female clients
        </p>
        <div
          class="mt-4 p-4 bg-primary-50 rounded-lg border border-primary-100 text-sm text-gray-700 max-w-2xl mx-auto shadow-sm"
        >
          <div class="flex items-start">
            <UIcon
              name="i-heroicons-information-circle"
              class="text-primary-500 w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
            />
            <div class="text-left">
              <p class="font-medium mb-1">How to use this page:</p>
              <ul class="list-disc pl-5 space-y-1 text-gray-600">
                <li>Create separate templates for male and female clients</li>
                <li>Customize field names to match your measurement terminology</li>
                <li>Add or remove fields based on what you need to track</li>
                <li>Save your templates when you're done</li>
                <li>You can create more templates later in your account settings</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
        <!-- Tab Navigation -->
        <div class="border-b border-gray-200 bg-gray-50/80">
          <nav class="flex -mb-px overflow-x-auto" aria-label="Tabs">
            <div class="flex w-full px-4 sm:px-6">
              <button
                v-for="tab in tabs"
                :id="`${tab.id}-tab`"
                :key="tab.id"
                :class="[
                  'whitespace-nowrap py-3 sm:py-4 px-2 sm:px-6 border-b-2 font-medium text-xs sm:text-sm flex items-center justify-center flex-1 transition-all duration-200',
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 bg-white shadow-sm'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                ]"
                role="tab"
                :aria-selected="activeTab === tab.id"
                :aria-controls="`${tab.id}-panel`"
                @click="switchTab(tab.id as 'male' | 'female')"
              >
                <UIcon
                  :name="tab.icon"
                  class="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2"
                  aria-hidden="true"
                />
                <span>{{ tab.name }}</span>
                <span class="sr-only">Template</span>
                <span
                  v-if="activeTab === tab.id"
                  class="ml-1 sm:ml-2 bg-primary-100 text-primary-700 text-xs px-1 sm:px-2 py-0.5 rounded-full hidden sm:inline-block"
                  >Active</span
                >
                <span
                  v-if="hasUnsavedChanges(tab.id as 'male' | 'female')"
                  class="ml-1 sm:ml-2 bg-amber-100 text-amber-700 text-xs px-1 sm:px-2 py-0.5 rounded-full"
                  >Unsaved</span
                >
              </button>
            </div>
          </nav>
        </div>

        <div class="p-4 sm:p-6 lg:p-8">
          <!-- Loading State - Only show briefly during initial load -->
          <div v-if="loading" class="space-y-6">
            <div class="text-center py-12">
              <div class="animate-pulse space-y-6 max-w-md mx-auto">
                <div class="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
                <div class="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
                <div class="flex justify-center">
                  <div
                    class="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"
                  />
                </div>
                <p class="text-sm text-gray-500">Loading your templates...</p>
              </div>
            </div>
          </div>

          <!-- We're removing the separate saving state and will show loading in the button instead -->

          <!-- Main Content -->
          <div v-else-if="!loading" class="space-y-6">
            <div class="bg-white p-4 sm:p-5 rounded-lg border border-gray-200 shadow-sm">
              <div class="flex items-center justify-between mb-2">
                <label
for="template-name"
class="block text-sm font-medium text-gray-700"
                  >Template Name</label
                >
                <span class="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                  {{ activeTab === 'male' ? 'Male' : 'Female' }} Template
                </span>
              </div>
              <UInput
                id="template-name"
                v-model="templates[activeTab].name"
                type="text"
                class="w-full"
                :placeholder="`Standard ${activeTab === 'male' ? 'Male' : 'Female'} Measurements`"
                :state="
                  formErrors[`${activeTab}-name`] ||
                  (attemptedSave && !templates[activeTab].name.trim())
                    ? 'error'
                    : undefined
                "
                required
                @blur="validateTemplateName(activeTab)"
              >
                <template #leading>
                  <UIcon name="i-heroicons-document-text" class="text-gray-400" />
                </template>
                <template #trailing>
                  <UIcon
                    v-if="templates[activeTab].name"
                    name="i-heroicons-check-circle"
                    class="text-green-500"
                  />
                </template>
              </UInput>
              <p v-if="formErrors[`${activeTab}-name`]" class="mt-1 text-xs text-red-500">
                {{ formErrors[`${activeTab}-name`] }}
              </p>
              <p
                v-else-if="attemptedSave && !templates[activeTab].name.trim()"
                class="mt-1 text-xs text-red-500"
              >
                Template name is required
              </p>
              <p v-else class="mt-1 text-xs text-gray-500">
                <span class="text-red-500">*</span> This name is required and will be used to
                identify this measurement template
              </p>
            </div>

            <div class="space-y-5">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 class="text-base font-medium text-gray-900">Measurement Fields</h3>
                  <p class="text-xs text-gray-500 mt-1">
                    Customize fields for {{ activeTab === 'male' ? 'male' : 'female' }} measurements
                  </p>
                </div>
                <div class="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <button
                    type="button"
                    class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-primary-700 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500 transition-colors"
                    :disabled="templates[activeTab].upperBody.length >= maxFieldsPerSection"
                    :class="{
                      'opacity-50 cursor-not-allowed':
                        templates[activeTab].upperBody.length >= maxFieldsPerSection,
                    }"
                    @click="addField(activeTab, 'upperBody')"
                  >
                    <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5 mr-1.5" />
                    <span>Add Upper Body</span>
                    <span
                      v-if="templates[activeTab].upperBody.length >= maxFieldsPerSection"
                      class="ml-1 text-xs"
                      >(Max)</span
                    >
                  </button>
                  <button
                    type="button"
                    class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-primary-700 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500 transition-colors"
                    :disabled="templates[activeTab].lowerBody.length >= maxFieldsPerSection"
                    :class="{
                      'opacity-50 cursor-not-allowed':
                        templates[activeTab].lowerBody.length >= maxFieldsPerSection,
                    }"
                    @click="addField(activeTab, 'lowerBody')"
                  >
                    <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5 mr-1.5" />
                    <span>Add Lower Body</span>
                    <span
                      v-if="templates[activeTab].lowerBody.length >= maxFieldsPerSection"
                      class="ml-1 text-xs"
                      >(Max)</span
                    >
                  </button>
                </div>
              </div>

              <div class="bg-gray-50/50 rounded-lg p-4 sm:p-5 border border-gray-200 shadow-sm">
                <div
                  class="flex items-start p-3 bg-primary-50/70 rounded-md border border-primary-100 mb-5"
                >
                  <UIcon
                    name="i-heroicons-information-circle"
                    class="text-primary-500 w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
                  />
                  <p class="text-sm text-gray-700">
                    Customize the measurement fields below for your
                    <span class="font-medium">{{ activeTab === 'male' ? 'male' : 'female' }}</span>
                    clients. You can rename, add, or remove fields as needed.
                  </p>
                </div>
                <div class="space-y-6">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                    <!-- Upper Body Fields -->
                    <div class="space-y-3">
                      <div class="flex items-center justify-between border-b border-gray-200 pb-2">
                        <div class="flex items-center">
                          <UIcon
                            name="i-heroicons-square-3-stack-3d"
                            class="w-4 h-4 text-primary-500 mr-1.5"
                          />
                          <h4 class="text-sm font-medium text-gray-700">Upper Body Measurements</h4>
                        </div>
                        <span
                          v-if="templates[activeTab]?.upperBody?.length"
                          class="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5"
                        >
                          {{ templates[activeTab].upperBody.length }}
                          {{ templates[activeTab].upperBody.length === 1 ? 'field' : 'fields' }}
                        </span>
                      </div>
                      <template v-if="templates[activeTab]?.upperBody?.length">
                        <div
                          v-for="(field, index) in templates[activeTab].upperBody"
                          :key="'upper-' + index"
                          class="flex items-center gap-2 group bg-white rounded-md p-3 hover:bg-gray-50 transition-colors border border-gray-100 shadow-sm"
                          :class="{
                            'border-red-200 bg-red-50':
                              !field.name.trim() && (attemptedSave || field.name === ''),
                          }"
                        >
                          <div class="flex-1">
                            <UInput
                              v-model="field.name"
                              type="text"
                              class="w-full"
                              :placeholder="`Upper body ${index + 1}`"
                              :state="
                                !field.name.trim() &&
                                (formErrors[`${activeTab}-fieldnames`] ||
                                  attemptedSave ||
                                  field.name === '')
                                  ? 'error'
                                  : undefined
                              "
                              :ui="{ base: 'relative peer w-full' }"
                              required
                              @blur="validateField(field)"
                            />
                            <p
                              v-if="!field.name.trim() && attemptedSave"
                              class="text-xs text-red-500 mt-1"
                            >
                              Field name is required
                            </p>
                          </div>
                          <div class="flex items-center">
                            <span
                              class="text-xs font-medium bg-gray-100 text-gray-500 rounded-full w-5 h-5 flex items-center justify-center mr-2"
                              >{{ index + 1 }}</span
                            >
                            <button
                              type="button"
                              class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="Remove field"
                              @click="removeField(activeTab, 'upperBody', index)"
                            >
                              <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <button
                          type="button"
                          class="mt-3 w-full py-2.5 px-3 border border-dashed border-gray-300 rounded-md text-sm text-gray-500 hover:border-primary-300 hover:bg-primary-50/50 hover:text-primary-600 transition-colors flex items-center justify-center group"
                          @click="addField(activeTab, 'upperBody')"
                        >
                          <UIcon name="i-heroicons-plus-circle" class="w-4 h-4 mr-1.5" />
                          <span>Add another upper body measurement</span>
                        </button>
                      </template>
                      <div
                        v-else
                        class="text-center py-8 text-sm text-gray-400 bg-white/50 rounded-lg border-2 border-dashed border-gray-200 hover:border-primary-100 hover:bg-primary-50/30 hover:text-primary-600 transition-colors cursor-pointer"
                        @click="addField(activeTab, 'upperBody')"
                      >
                        <UIcon
                          name="i-heroicons-plus-circle"
                          class="w-6 h-6 mx-auto mb-2 text-gray-300"
                        />
                        <p>Click to add upper body measurements</p>
                      </div>
                    </div>

                    <!-- Lower Body Fields -->
                    <div class="space-y-3">
                      <div class="flex items-center justify-between border-b border-gray-200 pb-2">
                        <div class="flex items-center">
                          <UIcon
                            name="i-heroicons-square-3-stack-3d"
                            class="w-4 h-4 text-primary-500 mr-1.5"
                          />
                          <h4 class="text-sm font-medium text-gray-700">Lower Body Measurements</h4>
                        </div>
                        <span
                          v-if="templates[activeTab]?.lowerBody?.length"
                          class="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5"
                        >
                          {{ templates[activeTab].lowerBody.length }}
                          {{ templates[activeTab].lowerBody.length === 1 ? 'field' : 'fields' }}
                        </span>
                      </div>
                      <template v-if="templates[activeTab]?.lowerBody?.length">
                        <div
                          v-for="(field, index) in templates[activeTab].lowerBody"
                          :key="'lower-' + index"
                          class="flex items-center gap-2 group bg-white rounded-md p-3 hover:bg-gray-50 transition-colors border border-gray-100 shadow-sm"
                          :class="{
                            'border-red-200 bg-red-50':
                              !field.name.trim() && (attemptedSave || field.name === ''),
                          }"
                        >
                          <div class="flex-1">
                            <UInput
                              v-model="field.name"
                              type="text"
                              class="w-full"
                              :placeholder="`Lower body ${index + 1}`"
                              :state="
                                !field.name.trim() &&
                                (formErrors[`${activeTab}-fieldnames`] ||
                                  attemptedSave ||
                                  field.name === '')
                                  ? 'error'
                                  : undefined
                              "
                              :ui="{ base: 'relative peer w-full' }"
                              required
                              @blur="validateField(field)"
                            />
                            <p
                              v-if="!field.name.trim() && attemptedSave"
                              class="text-xs text-red-500 mt-1"
                            >
                              Field name is required
                            </p>
                          </div>
                          <div class="flex items-center">
                            <span
                              class="text-xs font-medium bg-gray-100 text-gray-500 rounded-full w-5 h-5 flex items-center justify-center mr-2"
                              >{{ index + 1 }}</span
                            >
                            <button
                              type="button"
                              class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="Remove field"
                              @click="removeField(activeTab, 'lowerBody', index)"
                            >
                              <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <button
                          type="button"
                          class="mt-3 w-full py-2.5 px-3 border border-dashed border-gray-300 rounded-md text-sm text-gray-500 hover:border-primary-300 hover:bg-primary-50/50 hover:text-primary-600 transition-colors flex items-center justify-center group"
                          @click="addField(activeTab, 'lowerBody')"
                        >
                          <UIcon name="i-heroicons-plus-circle" class="w-4 h-4 mr-1.5" />
                          <span>Add another lower body measurement</span>
                        </button>
                      </template>
                      <div
                        v-else
                        class="text-center py-8 text-sm text-gray-400 bg-white/50 rounded-lg border-2 border-dashed border-gray-200 hover:border-primary-100 hover:bg-primary-50/30 hover:text-primary-600 transition-colors cursor-pointer"
                        @click="addField(activeTab, 'lowerBody')"
                      >
                        <UIcon
                          name="i-heroicons-plus-circle"
                          class="w-6 h-6 mx-auto mb-2 text-gray-300"
                        />
                        <p>Click to add lower body measurements</p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Navigation and Save Buttons -->
                <div
                  class="flex flex-col sm:flex-row justify-between items-center pt-6 mt-4 border-t border-gray-200 gap-5"
                >
                  <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto order-2 sm:order-1">
                    <UButton
                      :to="ROUTE_NAMES.AUTH.CONFIRM"
                      variant="outline"
                      color="neutral"
                      class="w-full sm:w-auto"
                      :ui="{
                        base: 'rounded-lg',
                      }"
                    >
                      <UIcon name="i-heroicons-arrow-left" class="w-4 h-4 mr-2" />
                      Back to Plan
                    </UButton>
                  </div>
                  <div class="w-full sm:w-auto order-1 sm:order-2">
                    <UButton
                      type="button"
                      variant="solid"
                      color="primary"
                      class="w-full sm:w-auto px-4 py-2.5 sm:px-5 sm:py-2.5"
                      :disabled="isSaving || !isTemplatesValid"
                      :ui="{
                        base: 'rounded-lg',
                      }"
                      @click="saveTemplates"
                    >
                      <div class="flex items-center justify-center">
                        <div
                          v-if="isSaving"
                          class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                        />
                        <span>{{ isSaving ? 'Saving...' : 'Save Templates and Continue' }}</span>
                      </div>
                    </UButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore, useMeasurementTemplateStore } from '../../store'
import type { MeasurementTemplate, MeasurementField } from '../../types/measurement'
import { ROUTE_NAMES } from '../../constants/routes'
import { API_ENDPOINTS } from '../../constants/api'

useHead({
  title: 'Setup Measurements',
})

// Mark component as client-only
const isClient = ref(false)
onMounted(() => {
  isClient.value = true
})

// Use imported types from ~/types/measurement
// Remove local interface definitions to avoid conflicts

// Initialize stores
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const toast = useToast()
const measurementTemplateStore = useMeasurementTemplateStore()

// Initialize loading state and templates
const loading = ref(true)
const currentTemplate = ref<MeasurementTemplate | null>(null)

// Track if user has attempted to save
const attemptedSave = ref(false)

// Initialize reactive data for templates
const activeTab = ref<'male' | 'female'>('male')
const formErrors = ref<Record<string, string>>({})
const maxFieldsPerSection = ref(10)
const isSaving = ref(false)
const isProcessing = ref(false)
const originalTemplates = ref<Record<string, any>>({})

// Define tabs
const tabs = ref([
  {
    id: 'male',
    name: 'Male Template',
    icon: 'i-heroicons-user',
  },
  {
    id: 'female',
    name: 'Female Template',
    icon: 'i-heroicons-user',
  },
])

// Generate a unique ID
const generateId = () => {
  return Math.random().toString(36).substr(2, 9)
}

// Define template field interface for internal use
interface TemplateField {
  id: string
  name: string
  required: boolean
}

interface TemplateData {
  name: string
  upperBody: TemplateField[]
  lowerBody: TemplateField[]
}

// Initialize templates structure
const templates = ref<Record<'male' | 'female', TemplateData>>({
  male: {
    name: 'Standard Male Measurements',
    upperBody: [
      { id: generateId(), name: 'Chest', required: true },
      { id: generateId(), name: 'Waist', required: true },
      { id: generateId(), name: 'Shoulders', required: false },
    ],
    lowerBody: [
      { id: generateId(), name: 'Hips', required: true },
      { id: generateId(), name: 'Inseam', required: true },
    ],
  },
  female: {
    name: 'Standard Female Measurements',
    upperBody: [
      { id: generateId(), name: 'Bust', required: true },
      { id: generateId(), name: 'Waist', required: true },
      { id: generateId(), name: 'Shoulders', required: false },
    ],
    lowerBody: [
      { id: generateId(), name: 'Hips', required: true },
      { id: generateId(), name: 'Inseam', required: true },
    ],
  },
})

// Computed property for template validation
const isTemplatesValid = computed(() => {
  return (
    templates.value.male.name.trim() &&
    templates.value.female.name.trim() &&
    templates.value.male.upperBody.every(field => field.name.trim()) &&
    templates.value.male.lowerBody.every(field => field.name.trim()) &&
    templates.value.female.upperBody.every(field => field.name.trim()) &&
    templates.value.female.lowerBody.every(field => field.name.trim())
  )
})

// Validate field on blur
function validateField(field: TemplateField): boolean {
  return !!field.name.trim()
}

// Switch between tabs
function switchTab(tabId: 'male' | 'female'): void {
  activeTab.value = tabId
}

// Check if there are unsaved changes
function hasUnsavedChanges(tabId: 'male' | 'female'): boolean {
  if (!originalTemplates.value[tabId]) return false
  return JSON.stringify(templates.value[tabId]) !== JSON.stringify(originalTemplates.value[tabId])
}

// Add a new field to a category
function addField(tabId: 'male' | 'female', category: 'upperBody' | 'lowerBody'): void {
  const newField: TemplateField = {
    id: generateId(),
    name: '',
    required: false,
  }
  templates.value[tabId][category].push(newField)
}

// Remove a field from a category
function removeField(
  tabId: 'male' | 'female',
  category: 'upperBody' | 'lowerBody',
  index: number
): void {
  if (confirm('Are you sure you want to remove this field?')) {
    templates.value[tabId][category].splice(index, 1)
  }
}

// Validate template name
function validateTemplateName(tabId: 'male' | 'female'): void {
  if (!templates.value[tabId].name.trim()) {
    formErrors.value[`${tabId}-name`] = 'Template name is required'
  } else {
    const errorKey = `${tabId}-name`
    const { [errorKey]: _, ...rest } = formErrors.value
    formErrors.value = rest
  }
}

// Get default template structure
const getDefaultTemplate = (gender: 'male' | 'female'): MeasurementTemplate => {
  const defaultFields: MeasurementField[] = [
    {
      id: generateId(),
      name: 'Chest',
      type: 'number',
      required: true,
      unit: 'in',
      order: 0,
      category: 'upperBody',
    },
    {
      id: generateId(),
      name: 'Waist',
      type: 'number',
      required: true,
      unit: 'in',
      order: 1,
      category: 'upperBody',
    },
    {
      id: generateId(),
      name: 'Hips',
      type: 'number',
      required: true,
      unit: 'in',
      order: 2,
      category: 'lowerBody',
    },
  ]

  return {
    id: 0, // Will be set by the server
    userId: user.value?.id || 0,
    name: `Standard ${gender.charAt(0).toUpperCase() + gender.slice(1)} Measurements`,
    description: `Standard measurement template for ${gender} clients`,
    fields: defaultFields,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

// On component mount, initialize template
onMounted(async () => {
  try {
    loading.value = true

    // Load templates from store
    await measurementTemplateStore.setTemplates([]) // This would normally be an API call

    // If no templates exist, create a default one
    if (measurementTemplateStore.templates.length === 0) {
      currentTemplate.value = getDefaultTemplate('male')
    } else {
      currentTemplate.value = measurementTemplateStore.templates[0]
    }
  } catch (error) {
    console.error('Error loading templates:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to load measurement templates. Please refresh the page to try again.',
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle',
    })
  } finally {
    loading.value = false
  }
})

const measurementTemplatesStore = useMeasurementTemplateStore()

// Save templates and complete setup
async function saveTemplates() {
  // Set attempted save flag to trigger validation UI
  attemptedSave.value = true

  // Clear previous errors
  formErrors.value = {}

  // Validate templates
  if (!isTemplatesValid.value) {
    // Show error message
    toast.add({
      title: 'Validation Error',
      description: 'Please fill in all required fields before saving.',
      color: 'error',
    })
    return
  }

  try {
    // Set processing state
    isSaving.value = true
    isProcessing.value = true

    // Prepare male template data
    const maleTemplateData = {
      name: templates.value.male.name,
      gender: 'male',
      fields: [
        ...templates.value.male.upperBody.map((field, index) => ({
          name: field.name,
          category: 'upperBody',
          order: index,
        })),
        ...templates.value.male.lowerBody.map((field, index) => ({
          name: field.name,
          category: 'lowerBody',
          order: index,
        })),
      ],
      setupProcess: true, // Flag to indicate this is part of the setup process
    }

    // Prepare female template data
    const femaleTemplateData = {
      name: templates.value.female.name,
      gender: 'female',
      fields: [
        ...templates.value.female.upperBody.map((field, index) => ({
          name: field.name,
          category: 'upperBody',
          order: index,
        })),
        ...templates.value.female.lowerBody.map((field, index) => ({
          name: field.name,
          category: 'lowerBody',
          order: index,
        })),
      ],
      setupProcess: true, // Flag to indicate this is part of the setup process
    }

    // Save both templates using direct $fetch calls
    const [maleResponse, femaleResponse] = await Promise.all([
      $fetch(API_ENDPOINTS.MEASUREMENTS.TEMPLATES, {
        method: 'POST',
        body: maleTemplateData,
      }),
      $fetch(API_ENDPOINTS.MEASUREMENTS.TEMPLATES, {
        method: 'POST',
        body: femaleTemplateData,
      }),
    ])

    console.log('Templates saved:', { maleResponse, femaleResponse })

    // Save original templates to track changes
    originalTemplates.value = {
      male: JSON.parse(JSON.stringify(templates.value.male)),
      female: JSON.parse(JSON.stringify(templates.value.female)),
    } as Record<string, TemplateData>

    // Refresh templates from the API
    const { data } = await useAsyncData('measurement-templates', () =>
      $fetch<{ success: boolean; data: MeasurementTemplate[] }>(
        API_ENDPOINTS.MEASUREMENTS.TEMPLATES,
        { method: 'GET' }
      )
    )

    // Update the store with fetched templates
    if (data.value && data.value.data) {
      measurementTemplatesStore.setTemplates(data.value.data)
    }

    // Show success message
    toast.add({
      title: 'Success',
      description: 'Your measurement templates have been saved successfully.',
      color: 'primary',
    })

    // Navigate to dashboard using direct window.location approach
    console.log('Attempting to navigate to dashboard...')
    console.log('User status:', user.value)
    console.log('Has completed setup:', user.value?.hasCompletedSetup)

    // Force a small delay to ensure state updates are processed
    await new Promise(resolve => setTimeout(resolve, 500))

    // Use the centralized route for navigation
    await navigateTo(ROUTE_NAMES.DASHBOARD.INDEX, { replace: true })
  } catch (error: any) {
    console.error('Error saving templates:', error)

    // Show error message with details if available
    const errorMessage = error.data?.message || error.message || 'Failed to save templates'
    toast.add({
      title: 'Error',
      description: errorMessage,
      color: 'error',
    })
  } finally {
    isSaving.value = false
    isProcessing.value = false
  }
}

// Set page metadata
useHead({
  title: 'Setup Measurements',
})
</script>
