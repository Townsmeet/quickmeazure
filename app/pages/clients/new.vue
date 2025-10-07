<template>
  <div class="max-w-5xl mx-auto space-y-6 py-6">
    <!-- Page Header -->
    <PageHeader
      title="Add Client"
      :primary-action="{
        label: 'Save',
        onClick: saveClient,
        disabled: !isFormValid,
      }"
    />

    <ClientOnly>
      <UCard class="bg-white shadow border-0">
        <form class="space-y-8" @submit.prevent="saveClient">
          <!-- Client Detail Section -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label
for="clientName"
class="block text-sm font-medium text-gray-700"
                >Full Name <span class="text-red-500">*</span></label
              >
              <UInput
                id="clientName"
                v-model="client.name"
                name="clientName"
                placeholder="Client name"
                class="w-full"
                icon="i-heroicons-user"
                size="lg"
                autocomplete="name"
              />
            </div>

            <div class="space-y-2">
              <label
for="clientPhone"
class="block text-sm font-medium text-gray-700"
                >Phone Number</label
              >
              <UInput
                id="clientPhone"
                v-model="client.phone"
                name="clientPhone"
                placeholder="Phone number"
                class="w-full"
                icon="i-heroicons-phone"
                size="lg"
                type="tel"
                autocomplete="tel"
              />
            </div>
          </div>

          <!-- Measurements Section -->
          <div class="space-y-4">
            <h2 class="text-lg font-medium text-gray-900 border-b pb-2">Measurements</h2>

            <!-- Template Selection Section -->
            <div class="space-y-4">
              <div class="max-w-md">
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <label for="template-select" class="block text-sm font-medium text-gray-700">
                      Select a measurement template
                    </label>
                    <UButton
                      v-if="templatesLoading"
                      variant="ghost"
                      color="gray"
                      size="xs"
                      :loading="true"
                      class="ml-2"
                    >
                      Loading...
                    </UButton>
                  </div>

                  <USelect
                    id="template-select"
                    v-model="selectedTemplateId"
                    name="template-select"
                    :items="templateOptions"
                    placeholder="Choose a measurement template"
                    class="w-full"
                    size="lg"
                    :loading="templatesLoading"
                    @update:model-value="selectTemplate"
                  />

                  <!-- Empty state message -->
                  <div v-if="!templatesLoading && !hasTemplates" class="mt-2 text-sm text-gray-500">
                    <p>
                      No measurement templates found.
                      <NuxtLink
to="/measurement-templates"
class="text-primary-600 hover:underline"
                        >Create a template</NuxtLink
                      >
                      first.
                    </p>
                  </div>

                  <!-- Retry button if templates failed to load -->
                  <div v-if="!templatesLoading && !hasTemplates" class="mt-2">
                    <UButton
                      size="sm"
                      variant="soft"
                      color="gray"
                      icon="i-heroicons-arrow-path"
                      @click="loadTemplates(true)"
                    >
                      Retry
                    </UButton>
                  </div>
                </div>
              </div>
            </div>

            <!-- Template-based Measurements -->
            <div v-if="selectedTemplateId && hasFields">
              <!-- Upper Body Measurements -->
              <div v-if="upperBodyFields.length > 0" class="space-y-4">
                <h3 class="text-md font-medium text-gray-700 flex items-center">
                  <UIcon name="i-heroicons-user-circle" class="w-4 h-4 mr-2 text-primary-500" />
                  Upper Body
                </h3>
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div v-for="field in upperBodyFields" :key="field.id" class="space-y-2">
                    <label
                      :for="field.name.toLowerCase()"
                      class="block text-sm font-medium text-gray-700"
                    >
                      {{ field.name }}
                      <span v-if="field.isRequired" class="text-red-500">*</span>
                    </label>
                    <div class="flex">
                      <UInput
                        :id="field.name.toLowerCase()"
                        v-model="measurements[field.name.toLowerCase()]"
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        class="w-full rounded-r-none focus:ring-primary-500"
                        size="lg"
                      />
                      <span
                        class="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-primary-50 text-primary-700 text-sm font-medium rounded-r-md"
                      >
                        {{ field.unit || 'in' }}
                      </span>
                    </div>
                    <p v-if="field.description" class="text-xs text-gray-500 mt-1">
                      {{ field.description }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Lower Body Measurements -->
              <div v-if="lowerBodyFields.length > 0" class="space-y-4 mt-8">
                <h3 class="text-md font-medium text-gray-700 flex items-center">
                  <UIcon name="i-heroicons-rectangle-stack" class="w-4 h-4 mr-2 text-primary-500" />
                  Lower Body
                </h3>
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div v-for="field in lowerBodyFields" :key="field.id" class="space-y-2">
                    <label
                      :for="field.name.toLowerCase()"
                      class="block text-sm font-medium text-gray-700"
                    >
                      {{ field.name }}
                      <span v-if="field.isRequired" class="text-red-500">*</span>
                    </label>
                    <div class="flex">
                      <UInput
                        :id="field.name.toLowerCase()"
                        v-model="measurements[field.name.toLowerCase()]"
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        class="w-full rounded-r-none focus:ring-primary-500"
                        size="lg"
                      />
                      <span
                        class="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-primary-50 text-primary-700 text-sm font-medium rounded-r-md"
                      >
                        {{ field.unit || 'in' }}
                      </span>
                    </div>
                    <p v-if="field.description" class="text-xs text-gray-500 mt-1">
                      {{ field.description }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Other Measurements -->
              <div v-if="otherFields.length > 0" class="space-y-4 mt-8">
                <h3 class="text-md font-medium text-gray-700 flex items-center">
                  <UIcon name="i-heroicons-variable" class="w-4 h-4 mr-2 text-primary-500" />
                  Other Measurements
                </h3>
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div v-for="field in otherFields" :key="field.id" class="space-y-2">
                    <label
                      :for="field.name.toLowerCase()"
                      class="block text-sm font-medium text-gray-700"
                    >
                      {{ field.name }}
                      <span v-if="field.isRequired" class="text-red-500">*</span>
                    </label>
                    <div class="flex">
                      <UInput
                        :id="field.name.toLowerCase()"
                        v-model="measurements[field.name.toLowerCase()]"
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        class="w-full rounded-r-none focus:ring-primary-500"
                        size="lg"
                      />
                      <span
                        class="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-primary-50 text-primary-700 text-sm font-medium rounded-r-md"
                      >
                        {{ field.unit || 'in' }}
                      </span>
                    </div>
                    <p v-if="field.description" class="text-xs text-gray-500 mt-1">
                      {{ field.description }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- No template selected message -->
            <div v-else-if="selectedTemplateId === null" class="py-6 text-center text-gray-500">
              <UIcon name="i-heroicons-document-text" class="w-12 h-12 mx-auto text-gray-400" />
              <p class="mt-2 text-sm">Please select a measurement template to continue</p>
            </div>

            <!-- Template has no fields message -->
            <div
              v-else-if="selectedTemplateId && !hasFields"
              class="py-6 text-center text-gray-500"
            >
              <UIcon
                name="i-heroicons-exclamation-circle"
                class="w-12 h-12 mx-auto text-amber-400"
              />
              <p class="mt-2 text-sm">The selected template has no measurement fields defined</p>
              <p class="text-xs mt-1">
                <NuxtLink
                  :to="`/measurement-templates/${selectedTemplateId}/edit`"
                  class="text-primary-600 hover:underline"
                >
                  Edit template
                </NuxtLink>
              </p>
            </div>

            <!-- Notes Section -->
            <div class="space-y-4 mt-8">
              <h3 class="text-md font-medium text-gray-700 flex items-center">
                <UIcon name="i-heroicons-pencil-square" class="w-4 h-4 mr-2 text-primary-500" />
                Notes
              </h3>
              <div class="space-y-2">
                <label
for="measurement-notes"
class="block text-sm font-medium text-gray-700"
                  >Measurement Notes</label
                >
                <UTextarea
                  id="measurement-notes"
                  v-model="measurements.notes"
                  name="measurement-notes"
                  placeholder="Add any special instructions or notes about these measurements"
                  :rows="4"
                  class="w-full focus:ring-primary-500"
                  size="lg"
                />
              </div>
            </div>
          </div>
        </form>
      </UCard>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// Composable
const routes = useAppRoutes()
const router = useRouter()

// Constants
const CLIENTS_PATH = routes.ROUTE_PATHS[routes.ROUTE_NAMES.DASHBOARD.CLIENTS.INDEX] as string

// Set page metadata
useHead({
  title: 'Add New Client',
})

// Initialize composables
const { user, isAuthenticated } = useAuth()
const { templates, isLoading: templatesLoading, fetchTemplates } = useMeasurementTemplates()
const { createClient } = useClients()

const hasLoadedTemplates = ref(false)

// Watch for auth changes to reload templates if needed
watch(
  () => isAuthenticated.value,
  async isAuth => {
    if (isAuth && !hasLoadedTemplates.value) {
      console.log('User authenticated, fetching templates...')
      await loadTemplates()
    }
  },
  { immediate: true }
)

// Load templates function
async function loadTemplates(forceRefresh = false) {
  if (hasLoadedTemplates.value && !forceRefresh) return

  try {
    console.log('Fetching measurement templates...', forceRefresh ? '(forced refresh)' : '')
    // Use a client-only wrapper to avoid SSR issues
    if (import.meta.client) {
      await fetchTemplates()
      console.log('Templates fetched:', templates.value)
      hasLoadedTemplates.value = true
    } else {
      console.log('Skipping template fetch during SSR')
    }
  } catch (error) {
    console.error('Failed to fetch measurement templates:', error)
    // Show error toast only on client side
    if (import.meta.client) {
      useToast().add({
        title: 'Error',
        description: 'Failed to load measurement templates',
        color: 'red',
      })
    }
  }
}

// Selected template
const selectedTemplateId = ref(null)

// Computed property for template options in the select dropdown
const templateOptions = computed(() => {
  console.log('Computing template options, templates count:', templates.value?.length || 0)
  if (!templates.value || templates.value.length === 0) {
    return []
  }

  return templates.value.map(template => ({
    label: `${template.name} (${template.gender.charAt(0).toUpperCase() + template.gender.slice(1)})`,
    value: template.id,
  }))
})

// Flag to show loading or empty state
const hasTemplates = computed(() => templateOptions.value.length > 0)

// Computed property for selected template name
const _selectedTemplateName = computed(() => {
  const template = templates.value.find(t => t.id === selectedTemplateId.value)
  return template ? template.name : ''
})

// Client data
const client = ref({
  name: '',
  phone: '',
  notes: '',
})

// Measurement data
const measurements = ref({
  notes: '',
})

// Measurement fields by category
const upperBodyFields = ref([])
const lowerBodyFields = ref([])
const otherFields = ref([])

// Flag to indicate if fields are available
const hasFields = computed(() => {
  return (
    upperBodyFields.value.length > 0 ||
    lowerBodyFields.value.length > 0 ||
    otherFields.value.length > 0
  )
})

const isSaving = ref(false)

// Add computed property for form validation
const isFormValid = computed(() => {
  return client.value.name && client.value.name.trim() !== ''
})

// Function to select a template
const selectTemplate = async templateId => {
  console.log('Selecting template with ID:', templateId)
  selectedTemplateId.value = templateId

  // Find the selected template
  const template = templates.value.find(t => t.id === templateId)
  console.log('Found template:', template)

  if (!template) {
    console.error('Template not found for ID:', templateId)
    useToast().add({
      title: 'Error',
      description: 'Template not found',
      color: 'red',
    })
    return
  }

  // Reset measurements object to only contain notes
  const notes = measurements.value.notes
  measurements.value = { notes }

  try {
    // Check if template has fields
    if (!template.fields || template.fields.length === 0) {
      console.warn('Template has no fields:', template.name)
      upperBodyFields.value = []
      lowerBodyFields.value = []
      otherFields.value = []
      return
    }

    console.log('Template fields:', template.fields)

    // Categorize fields from the template
    const upperBody = []
    const lowerBody = []
    const other = []

    template.fields.forEach(field => {
      // Extract category from metadata if available
      const category = field.metadata?.category || ''
      const fieldData = {
        id: field.id,
        name: field.name,
        unit: field.unit || 'in',
        description: field.description || '',
        isRequired: field.isRequired,
        displayOrder: field.displayOrder,
        category: category,
      }

      // Categorize based on metadata or field name
      if (
        category.toLowerCase().includes('upper') ||
        ['bust', 'chest', 'shoulder', 'sleeve', 'neck', 'arm'].some(term =>
          field.name.toLowerCase().includes(term)
        )
      ) {
        upperBody.push(fieldData)
      } else if (
        category.toLowerCase().includes('lower') ||
        ['waist', 'hip', 'inseam', 'thigh', 'leg'].some(term =>
          field.name.toLowerCase().includes(term)
        )
      ) {
        lowerBody.push(fieldData)
      } else {
        other.push(fieldData)
      }
    })

    // Sort fields by display order
    const sortByOrder = (a, b) => a.displayOrder - b.displayOrder
    upperBody.sort(sortByOrder)
    lowerBody.sort(sortByOrder)
    other.sort(sortByOrder)

    // Set the fields by category
    upperBodyFields.value = upperBody
    lowerBodyFields.value = lowerBody
    otherFields.value = other

    console.log('Set upperBodyFields:', upperBodyFields.value)
    console.log('Set lowerBodyFields:', lowerBodyFields.value)
    console.log('Set otherFields:', otherFields.value)

    // Initialize measurement values for each field
    const allFields = [...upperBody, ...lowerBody, ...other]
    allFields.forEach(field => {
      const fieldName = field.name.toLowerCase().replace(/\s+/g, '_')
      measurements.value[fieldName] = null
      console.log('Added field to measurements:', fieldName)
    })

    console.log('Updated measurements:', measurements.value)

    useToast().add({
      title: 'Template Selected',
      description: `Using ${template.name} template`,
      color: 'green',
    })
  } catch (error) {
    console.error('Error setting up template fields:', error)
    useToast().add({
      title: 'Error',
      description: 'Failed to set up measurement fields',
      color: 'red',
    })
    upperBodyFields.value = []
    lowerBodyFields.value = []
    otherFields.value = []
  }
}

// Process measurements for saving
const processMeasurements = () => {
  // Create a base object with notes and values
  const processedMeasurements = {
    // Keep the notes field as is
    notes: measurements.value.notes || null,
    // Initialize values field to store all measurements
    values: {},
  }

  // Process all fields from the template
  const allFields = [...upperBodyFields.value, ...lowerBodyFields.value, ...otherFields.value]

  // Store ALL fields from the template, even those without values
  allFields.forEach(field => {
    // Convert field name to the format used in measurements object (lowercase with underscores)
    const fieldName = field.name.toLowerCase().replace(/\s+/g, '_')
    const value = measurements.value[fieldName]

    // Store field metadata and value (even if null)
    processedMeasurements.values[fieldName] = {
      value: value !== null && value !== '' ? parseFloat(value) : null,
      unit: field.unit || 'in',
      name: field.name,
      fieldId: field.id,
      category: field.category || null,
      isRequired: field.isRequired || false,
      displayOrder: field.displayOrder || 0,
    }
  })

  // Store template information in the values if selected
  if (selectedTemplateId.value) {
    const template = templates.value.find(t => t.id === selectedTemplateId.value)
    if (template) {
      processedMeasurements.values._template = {
        id: template.id,
        name: template.name,
        gender: template.gender,
        fields: allFields.map(f => f.id), // Store references to all fields in the template
      }
    }
  }

  // Log the processed measurements
  console.log('Processed measurements for saving:', processedMeasurements)

  return processedMeasurements
}

// Validate client data
const validateClient = () => {
  const errors = []

  if (!client.value.name || client.value.name.trim() === '') {
    errors.push('Please enter the client name')
  }

  if (errors.length > 0) {
    useToast().add({
      title: 'Missing information',
      description: errors.join(', '),
      color: 'red',
    })
    return false
  }

  return true
}

// Save client to API
const saveClientToApi = async () => {
  try {
    // Check if user is authenticated
    if (!isAuthenticated.value) {
      useToast().add({
        title: 'Authentication required',
        description: 'Please log in to add clients',
        color: 'orange',
      })
      navigateTo('/auth/login')
      return null
    }

    const processedMeasurements = processMeasurements()

    // Use the createClient composable
    const result = await createClient({
      ...client.value,
      measurements: processedMeasurements,
    })

    if (result.success && result.data) {
      useToast().add({
        title: 'Success',
        description: 'Client added successfully',
        color: 'green',
      })

      return result.data
    } else {
      throw new Error(result.message || 'Failed to create client')
    }
  } catch (error) {
    console.error('Error saving client:', error)

    useToast().add({
      title: 'Error',
      description: error.message || 'Failed to add client',
      color: 'red',
    })

    return null
  }
}

// Save client function
const saveClient = async () => {
  if (!validateClient()) return

  isSaving.value = true

  try {
    const newClient = await saveClientToApi()

    if (newClient) {
      // Redirect to clients list on success
      await router.push(`${CLIENTS_PATH}/${newClient.id}`)
    }
  } finally {
    isSaving.value = false
  }
}
</script>
