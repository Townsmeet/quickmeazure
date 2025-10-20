<template>
  <div class="max-w-4xl mx-auto pb-20 md:pb-6">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Add Client</h1>
        </div>
        <div class="flex gap-3">
          <UButton
variant="soft"
color="neutral"
size="lg"
@click="handleCancel"> Cancel </UButton>
          <UButton
            color="primary"
            size="lg"
            :disabled="!canSave"
            :loading="isSaving"
            @click="saveClient"
          >
            Save Client
          </UButton>
        </div>
      </div>
    </div>

    <form class="space-y-8" @submit.prevent="saveClient">
      <!-- Client Information Card -->
      <UCard>
        <template #header>
          <div class="flex items-center space-x-2">
            <UIcon name="i-heroicons-user" class="w-5 h-5 text-primary-500" />
            <h2 class="text-lg font-semibold">Client Information</h2>
          </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Full Name -->
          <div class="space-y-2">
            <label for="fullName" class="block text-sm font-medium text-gray-700">
              Full Name <span class="text-red-500">*</span>
            </label>
            <UInput
              id="fullName"
              v-model="client.name"
              placeholder="Enter client's full name"
              class="w-full"
              size="lg"
              icon="i-heroicons-user"
              :error="errors.name"
            />
            <p v-if="errors.name" class="text-sm text-red-600">{{ errors.name }}</p>
          </div>

          <!-- Gender -->
          <div class="space-y-2">
            <label for="gender" class="block text-sm font-medium text-gray-700">
              Gender <span class="text-red-500">*</span>
            </label>
            <USelect
              id="gender"
              v-model="client.gender"
              :items="genderOptions"
              placeholder="Select gender"
              class="w-full"
              size="lg"
              :error="errors.gender"
            />
            <p v-if="errors.gender" class="text-sm text-red-600">{{ errors.gender }}</p>
          </div>

          <!-- Phone Number -->
          <div class="space-y-2">
            <label for="phone" class="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <UInput
              id="phone"
              v-model="client.phone"
              placeholder="Enter phone number"
              class="w-full"
              size="lg"
              icon="i-heroicons-phone"
              type="tel"
            />
          </div>

          <!-- Email -->
          <div class="space-y-2">
            <label for="email" class="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <UInput
              id="email"
              v-model="client.email"
              placeholder="Enter email address"
              class="w-full"
              size="lg"
              icon="i-heroicons-envelope"
              type="email"
            />
          </div>
        </div>

        <!-- Address -->
        <div class="mt-6 space-y-2">
          <label for="address" class="block text-sm font-medium text-gray-700"> Address </label>
          <UTextarea
            id="address"
            v-model="client.address"
            placeholder="Enter client's address"
            class="w-full"
            :rows="3"
            size="lg"
          />
        </div>

        <!-- Client Notes -->
        <div class="mt-6 space-y-2">
          <label for="clientNotes" class="block text-sm font-medium text-gray-700">
            Client Notes
          </label>
          <UTextarea
            id="clientNotes"
            v-model="client.notes"
            placeholder="Any special notes about this client..."
            :rows="3"
            size="lg"
            class="w-full"
          />
        </div>
      </UCard>

      <!-- Measurements Card -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <UIcon name="i-heroicons-calculator" class="w-5 h-5 text-primary-500" />
              <h2 class="text-lg font-semibold">Measurements</h2>
            </div>
            <UBadge v-if="selectedTemplate" color="primary" variant="soft">
              {{ selectedTemplate.name }}
            </UBadge>
          </div>
        </template>

        <!-- Template Selection -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-3">
            <label class="block text-sm font-medium text-gray-700">
              Measurement Template <span class="text-red-500">*</span>
            </label>
            <UButton
variant="ghost"
size="sm"
icon="i-heroicons-plus"
to="/settings/templates">
              Create Template
            </UButton>
          </div>

          <USelect
            v-model="selectedTemplateId"
            :items="templateOptions"
            placeholder="Choose a measurement template"
            size="lg"
            class="w-full"
            :loading="templatesLoading"
            @update:model-value="onTemplateSelect"
          />

          <!-- Loading state -->
          <div v-if="templatesLoading" class="mt-2 flex items-center text-sm text-gray-500">
            <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-2 animate-spin" />
            Loading templates...
          </div>

          <!-- Empty state -->
          <div v-else-if="templateOptions.length === 0" class="mt-2 text-sm text-amber-600">
            <p>
              No templates available.
              <NuxtLink to="/settings/templates" class="text-primary-600 hover:underline">
                Create one first
              </NuxtLink>
              to continue.
            </p>
            <UButton
              size="sm"
              variant="soft"
              color="neutral"
              icon="i-heroicons-arrow-path"
              class="mt-2"
              @click="loadTemplates(true)"
            >
              Retry Loading
            </UButton>
          </div>
        </div>

        <!-- Measurement Fields with Tabs -->
        <div v-if="selectedTemplate && measurementFields.length > 0" class="space-y-6">
          <!-- Measurement Tabs -->
          <div class="border-b border-gray-200">
            <nav class="-mb-px flex space-x-8">
              <button
                v-for="tab in measurementTabs"
                :key="tab.key"
                :class="[
                  'flex items-center py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
                  activeMeasurementTab === tab.key
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                ]"
                @click="activeMeasurementTab = tab.key"
              >
                <UIcon :name="tab.icon" class="w-4 h-4 mr-2" />
                {{ tab.label }}
                <UBadge
:label="tab.count.toString()"
color="neutral"
variant="soft"
class="ml-2" />
              </button>
            </nav>
          </div>

          <!-- Active Tab Content -->
          <div class="min-h-[300px]">
            <!-- Unit Information -->
            <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div class="flex items-center text-sm text-blue-800">
                <UIcon name="i-heroicons-information-circle" class="w-4 h-4 mr-2" />
                All measurements are in <strong>{{ selectedTemplate.unit }}</strong>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div v-for="field in activeMeasurementFields" :key="field.id" class="space-y-2">
                <label :for="`field-${field.id}`" class="block text-sm font-medium text-gray-700">
                  {{ field.name }}
                  <span v-if="field.isRequired" class="text-red-500">*</span>
                </label>
                <UInput
                  :id="`field-${field.id}`"
                  v-model="measurements[String(field.id)]"
                  type="number"
                  step="0.25"
                  placeholder="0.0"
                  size="lg"
                />
              </div>
            </div>
          </div>

          <!-- Measurement Notes -->
          <div class="pt-6 border-t">
            <label for="measurementNotes" class="block text-sm font-medium text-gray-700 mb-2">
              Measurement Notes
            </label>
            <UTextarea
              id="measurementNotes"
              v-model="measurementNotes"
              placeholder="Any special notes about these measurements..."
              class="w-full"
              :rows="3"
              size="lg"
            />
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="!selectedTemplate" class="text-center py-12">
          <UIcon
            name="i-heroicons-clipboard-document-list"
            class="w-16 h-16 mx-auto text-gray-400 mb-4"
          />
          <h3 class="text-lg font-medium text-gray-900 mb-2">Select a Template</h3>
          <p class="text-gray-600 mb-4">
            Choose a measurement template to start capturing measurements
          </p>
        </div>

        <!-- No Fields State -->
        <div v-else-if="measurementFields.length === 0" class="text-center py-12">
          <UIcon
            name="i-heroicons-exclamation-triangle"
            class="w-16 h-16 mx-auto text-amber-400 mb-4"
          />
          <h3 class="text-lg font-medium text-gray-900 mb-2">Template has no fields</h3>
          <p class="text-gray-600 mb-4">
            This template doesn't have any measurement fields defined
          </p>
          <UButton variant="ghost" :to="`/measurement-templates/${selectedTemplateId}/edit`">
            Edit Template
          </UButton>
        </div>
      </UCard>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from 'vue'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'setup-required'],
})

// Set page metadata
useHead({
  title: 'Add Client',
})

// Initialize composables for API integration
const { templates, isLoading: templatesLoading, fetchTemplates } = useMeasurementTemplates()
const { isAuthenticated } = useAuth()
const { createClient } = useClients()

// Reactive state
const client = reactive({
  name: '',
  phone: '',
  email: '',
  address: '',
  gender: undefined as 'male' | 'female' | undefined,
  notes: '',
})

const measurements = reactive<Record<string | number, number | null>>({})
const measurementNotes = ref('')
const selectedTemplateId = ref<number | undefined>(undefined)
const isSaving = ref(false)
const activeMeasurementTab = ref('upper')
const hasLoadedTemplates = ref(false)
const errors = reactive({
  name: '',
  gender: '',
})

// Load templates on mount and when auth changes
onMounted(async () => {
  if (isAuthenticated.value && import.meta.client) {
    await loadTemplates()
  }
})

// Watch for auth changes to reload templates if needed
watch(
  () => isAuthenticated.value,
  async isAuth => {
    if (isAuth && !hasLoadedTemplates.value && import.meta.client) {
      console.log('User authenticated, fetching templates...')
      await loadTemplates()
    }
  },
  { immediate: false }
)

// Load templates function
async function loadTemplates(forceRefresh = false) {
  if (hasLoadedTemplates.value && !forceRefresh) return

  try {
    console.log('Fetching measurement templates...', forceRefresh ? '(forced refresh)' : '')
    if (import.meta.client && isAuthenticated.value) {
      await fetchTemplates()
      console.log('Templates fetched:', templates.value)
      hasLoadedTemplates.value = true
    } else {
      console.log('Skipping template fetch during SSR or when not authenticated')
    }
  } catch (error) {
    console.error('Failed to fetch measurement templates:', error)
    if (import.meta.client) {
      useToast().add({
        title: 'Error',
        description: 'Failed to load measurement templates',
        color: 'error',
      })
    }
  }
}

// Gender options
const genderOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
]

// Template options for select dropdown
const templateOptions = computed(() => {
  if (!templates.value || templates.value.length === 0) {
    return []
  }

  return templates.value
    .filter(template => !template.isArchived) // Only show active templates
    .map(template => ({
      label: `${template.name} (${template.gender.charAt(0).toUpperCase() + template.gender.slice(1)})`,
      value: template.id,
    }))
})

// Selected template
const selectedTemplate = computed(() => {
  return templates.value?.find(t => t.id === selectedTemplateId.value)
})

// All measurement fields from selected template
const measurementFields = computed(() => {
  return selectedTemplate.value?.fields || []
})

// Categorized fields
const upperBodyFields = computed(() => {
  return measurementFields.value
    .filter(field => {
      // Handle both string and object metadata
      let category = ''
      if (typeof field.metadata === 'string') {
        try {
          const parsed = JSON.parse(field.metadata) as any
          category = parsed?.category || ''
        } catch {
          category = ''
        }
      } else if (field.metadata && typeof field.metadata === 'object') {
        category = (field.metadata as any)?.category || ''
      }

      return (
        category.toLowerCase().includes('upper') ||
        ['bust', 'chest', 'shoulder', 'sleeve', 'neck', 'arm'].some(term =>
          field.name.toLowerCase().includes(term)
        )
      )
    })
    .sort((a, b) => a.displayOrder - b.displayOrder)
})

const lowerBodyFields = computed(() => {
  return measurementFields.value
    .filter(field => {
      // Handle both string and object metadata
      let category = ''
      if (typeof field.metadata === 'string') {
        try {
          const parsed = JSON.parse(field.metadata) as any
          category = parsed?.category || ''
        } catch {
          category = ''
        }
      } else if (field.metadata && typeof field.metadata === 'object') {
        category = (field.metadata as any)?.category || ''
      }

      const isUpper =
        category.toLowerCase().includes('upper') ||
        ['bust', 'chest', 'shoulder', 'sleeve', 'neck', 'arm'].some(term =>
          field.name.toLowerCase().includes(term)
        )
      // Include lower body fields and any other fields not categorized as upper
      return !isUpper
    })
    .sort((a, b) => a.displayOrder - b.displayOrder)
})

// Form validation
const isFormValid = computed(() => {
  return (
    client.name.trim() !== '' &&
    client.gender !== undefined &&
    selectedTemplateId.value !== undefined
  )
})

// Can save validation
const canSave = computed(() => {
  return (
    client.name.trim() !== '' &&
    client.gender !== undefined &&
    selectedTemplateId.value !== undefined
  )
})

// Active measurement fields based on selected tab
const activeMeasurementFields = computed(() => {
  switch (activeMeasurementTab.value) {
    case 'upper':
      return upperBodyFields.value
    case 'lower':
      return lowerBodyFields.value
    default:
      return upperBodyFields.value.length > 0 ? upperBodyFields.value : lowerBodyFields.value
  }
})

// Measurement tabs
const measurementTabs = computed(() => {
  const tabs: Array<{
    key: string
    label: string
    icon: string
    count: number
  }> = []

  if (upperBodyFields.value.length > 0) {
    tabs.push({
      key: 'upper',
      label: 'Upper Body',
      icon: 'i-heroicons-user-circle',
      count: upperBodyFields.value.length,
    })
  }

  if (lowerBodyFields.value.length > 0) {
    tabs.push({
      key: 'lower',
      label: 'Lower Body',
      icon: 'i-heroicons-rectangle-stack',
      count: lowerBodyFields.value.length,
    })
  }

  return tabs
})

// Navigation functions
const handleCancel = () => {
  navigateTo('/clients')
}

// Template selection handler with smart suggestions
const onTemplateSelect = (templateId: string | number) => {
  const numericId = typeof templateId === 'string' ? parseInt(templateId) : templateId
  selectedTemplateId.value = numericId

  // Clear existing measurements
  Object.keys(measurements).forEach(key => {
    delete measurements[key as any]
  })

  // Initialize measurement fields
  if (selectedTemplate.value) {
    selectedTemplate.value.fields.forEach(field => {
      measurements[String(field.id)] = null
    })
  }

  // Reset to first tab when template changes
  const firstTab = measurementTabs.value?.[0]
  if (firstTab) {
    activeMeasurementTab.value = firstTab.key
  }
}

// Process measurements for saving
const processMeasurements = () => {
  // Create a base object with notes and values
  const processedMeasurements = {
    notes: measurementNotes.value?.trim() || undefined,
    values: {} as Record<string, any>,
  }

  // Process all fields from the template
  const allFields = [...upperBodyFields.value, ...lowerBodyFields.value]

  // Store ALL fields from the template, even those without values
  allFields.forEach(field => {
    const fieldKey = String(field.id)
    const value = measurements[fieldKey]

    // Store field metadata and value (even if null)
    processedMeasurements.values[fieldKey] = {
      value:
        value !== null && value !== undefined && String(value).trim() !== ''
          ? parseFloat(String(value))
          : undefined,
      unit: selectedTemplate.value?.unit || 'in',
      name: field.name,
      fieldId: field.id,
      isRequired: field.isRequired || false,
      displayOrder: field.displayOrder || 0,
    }
  })

  // Store template information if selected
  if (selectedTemplateId.value && selectedTemplate.value) {
    processedMeasurements.values._template = {
      id: selectedTemplate.value.id,
      name: selectedTemplate.value.name,
      gender: selectedTemplate.value.gender,
      unit: selectedTemplate.value.unit,
      fields: allFields.map(f => f.id),
    }
  }

  console.log('Processed measurements for saving:', processedMeasurements)
  return processedMeasurements
}

// Validation
const validateForm = () => {
  errors.name = ''
  errors.gender = ''

  if (!client.name.trim()) {
    errors.name = 'Client name is required'
    return false
  }

  if (!client.gender || client.gender === undefined) {
    errors.gender = 'Gender is required'
    return false
  }

  return true
}

// Save client function
const saveClient = async () => {
  if (!validateForm()) {
    return
  }

  isSaving.value = true

  try {
    // Check if user is authenticated
    if (!isAuthenticated.value) {
      useToast().add({
        title: 'Authentication required',
        description: 'Please log in to add clients',
        color: 'warning',
      })
      await navigateTo('/auth/login')
      return
    }

    // Prepare measurements data
    const processedMeasurements = processMeasurements()

    // Prepare client data for API
    const clientData = {
      name: client.name.trim(),
      phone: client.phone?.trim() || undefined,
      email: client.email?.trim() || undefined,
      address: client.address?.trim() || undefined,
      gender: client.gender,
      notes: client.notes?.trim() || undefined,
      measurements: processedMeasurements,
    }

    console.log('Saving client data:', clientData)

    // Use the createClient composable
    const result = await createClient(clientData)

    if (result.success && result.data) {
      useToast().add({
        title: 'Success',
        description: 'Client added successfully',
        color: 'success',
      })

      // Navigate to the new client's detail page
      await navigateTo(`/clients/${result.data.id}`)
    } else {
      throw new Error(result.message || 'Failed to create client')
    }
  } catch (error: any) {
    console.error('Error saving client:', error)
    useToast().add({
      title: 'Error',
      description: error.message || 'Failed to add client',
      color: 'error',
    })
  } finally {
    isSaving.value = false
  }
}
</script>
