<template>
  <div class="max-w-5xl mx-auto space-y-6 py-6">
    <!-- Page Header -->
    <PageHeader
      title="Edit Client"
      :primary-action="{
        label: 'Save',
        onClick: updateClient,
        disabled: !isFormValid,
      }"
    />

    <div v-if="isLoading" class="flex justify-center py-12">
      <USkeleton class="h-32 w-full" />
    </div>

    <UCard v-else-if="client" class="bg-white shadow border-0">
      <form class="space-y-8" @submit.prevent="updateClient">
        <!-- Client Detail Section -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <label for="clientName" class="block text-sm font-medium text-gray-700">
              Full Name <span class="text-red-500">*</span>
            </label>
            <UInput
              id="clientName"
              v-model="form.name"
              placeholder="Client name"
              class="w-full"
              icon="i-heroicons-user"
              size="lg"
              autocomplete="name"
              required
            />
          </div>

          <div class="space-y-2">
            <label for="clientPhone" class="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <UInput
              id="clientPhone"
              v-model="form.phone"
              placeholder="Phone number"
              class="w-full"
              icon="i-heroicons-phone"
              size="lg"
              type="tel"
              autocomplete="tel"
            />
          </div>

          <div class="space-y-2">
            <label for="clientEmail" class="block text-sm font-medium text-gray-700"> Email </label>
            <UInput
              id="clientEmail"
              v-model="form.email"
              placeholder="Email address"
              class="w-full"
              icon="i-heroicons-envelope"
              size="lg"
              type="email"
              autocomplete="email"
            />
          </div>

          <div class="space-y-2">
            <label for="clientAddress" class="block text-sm font-medium text-gray-700">
              Address
            </label>
            <UInput
              id="clientAddress"
              v-model="form.address"
              placeholder="Physical address"
              class="w-full"
              icon="i-heroicons-home"
              size="lg"
              autocomplete="address-line1"
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
                  :items="templateOptions"
                  placeholder="Choose a measurement template"
                  class="w-full"
                  size="lg"
                  :loading="templatesLoading"
                  @update:model-value="selectTemplate"
                />
              </div>
            </div>
          </div>

          <div v-if="selectedTemplateId && hasFields">
            <!-- Upper Body Measurements -->
            <div v-if="upperBodyFields.length > 0" class="space-y-4">
              <h3 class="text-md font-medium text-gray-700 flex items-center">
                <UIcon name="i-heroicons-user-circle" class="w-4 h-4 mr-2 text-primary-500" />
                Upper Body Measurements
              </h3>
              <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div v-for="field in upperBodyFields" :key="field.id" class="space-y-2">
                  <label
                    :for="`edit-${field.name.toLowerCase().replace(/\s+/g, '_')}`"
                    class="block text-sm font-medium text-gray-700"
                  >
                    {{ field.name }}
                    <span v-if="field.isRequired" class="text-red-500">*</span>
                  </label>
                  <div class="flex">
                    <UInput
                      :id="`edit-${field.name.toLowerCase().replace(/\s+/g, '_')}`"
                      v-model="measurements[field.name.toLowerCase().replace(/\s+/g, '_')]"
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
                </div>
              </div>
            </div>

            <!-- Lower Body Measurements -->
            <div v-if="lowerBodyFields.length > 0" class="space-y-4 mt-8">
              <h3 class="text-md font-medium text-gray-700 flex items-center">
                <UIcon name="i-heroicons-rectangle-stack" class="w-4 h-4 mr-2 text-primary-500" />
                Lower Body Measurements
              </h3>
              <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div v-for="field in lowerBodyFields" :key="field.id" class="space-y-2">
                  <label
                    :for="`edit-${field.name.toLowerCase().replace(/\s+/g, '_')}`"
                    class="block text-sm font-medium text-gray-700"
                  >
                    {{ field.name }}
                    <span v-if="field.isRequired" class="text-red-500">*</span>
                  </label>
                  <div class="flex">
                    <UInput
                      :id="`edit-${field.name.toLowerCase().replace(/\s+/g, '_')}`"
                      v-model="measurements[field.name.toLowerCase().replace(/\s+/g, '_')]"
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
                    :for="`edit-${field.name.toLowerCase().replace(/\s+/g, '_')}`"
                    class="block text-sm font-medium text-gray-700"
                  >
                    {{ field.name }}
                    <span v-if="field.isRequired" class="text-red-500">*</span>
                  </label>
                  <div class="flex">
                    <UInput
                      :id="`edit-${field.name.toLowerCase().replace(/\s+/g, '_')}`"
                      v-model="measurements[field.name.toLowerCase().replace(/\s+/g, '_')]"
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
                </div>
              </div>
            </div>
          </div>

          <!-- No template selected message -->
          <div v-else-if="selectedTemplateId === null" class="py-6 text-center text-gray-500">
            <UIcon name="i-heroicons-document-text" class="w-12 h-12 mx-auto text-gray-400" />
            <h3 class="mt-2 text-sm font-medium text-gray-900">No measurement template selected</h3>
            <p class="mt-1 text-sm text-gray-500">
              Select a template to see measurement fields, or
              <NuxtLink
to="/templates/new"
class="text-primary-600 hover:underline"
                >create a template</NuxtLink
              >
              first.
            </p>
          </div>

          <!-- Measurement Notes -->
          <div class="space-y-2 mt-8">
            <label for="measurement-notes" class="block text-sm font-medium text-gray-700">
              Measurement Notes
            </label>
            <UTextarea
              id="measurement-notes"
              v-model="measurements.notes"
              placeholder="Add any notes about the measurements here..."
              class="w-full"
              :rows="5"
            />
          </div>
        </div>

        <!-- Form has no bottom buttons, using top-right save button instead -->
      </form>
    </UCard>

    <div v-else class="bg-white shadow border-0 rounded-lg p-8 text-center">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 mx-auto text-orange-500" />
      <h3 class="mt-2 text-lg font-medium text-gray-900">Client not found</h3>
      <p class="mt-1 text-gray-500">
        The client you're looking for doesn't exist or has been deleted.
      </p>
      <div class="mt-6">
        <UButton to="/clients" color="primary"> Back to Clients </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import type { Client } from '~/types/client'

// Composables
const routes = useAppRoutes()
const { getClient, updateClient: updateClientApi } = useClients()
const { templates, isLoading: templatesLoading, fetchTemplates } = useMeasurementTemplates()
const { user } = useAuth()
const toast = useToast()

// Get route params
const route = useRoute()
const clientId = Array.isArray(route.params.id) ? route.params.id[0] : (route.params.id as string)

// Constants
const _CLIENTS_PATH = routes.ROUTE_PATHS[routes.ROUTE_NAMES.DASHBOARD.CLIENTS.INDEX] as string
const _getClientPath = (id: string): string =>
  (
    routes.ROUTE_PATHS[routes.ROUTE_NAMES.DASHBOARD.CLIENTS.VIEW] as (params: {
      id: string
    }) => string
  )({ id })

// Client form data
interface ClientFormData {
  name: string
  email: string | null
  phone: string | null
  address: string | null
}

const form = ref<ClientFormData>({
  name: '',
  email: null,
  phone: null,
  address: null,
})

// Measurements data
const measurements = ref({
  notes: null,
})

// Component state
const client = ref<Client | null>(null)
const isLoading = ref(false)
const isUpdating = ref(false)
const isDeleting = ref(false)
const isFormValid = computed(() => form.value.name && form.value.name.trim() !== '')
const hasLoadedTemplates = ref(false)
const selectedTemplateId = ref(null)
const templateOptions = computed(() => {
  return templates.value.map(template => ({
    label: template.name,
    value: template.id,
    description: `${template.gender.charAt(0).toUpperCase() + template.gender.slice(1)} template with ${template.fieldCount || 0} fields`,
  }))
})

// Measurement fields by category
const upperBodyFields = ref([])
const lowerBodyFields = ref([])
const otherFields = ref([])
const hasFields = computed(
  () =>
    upperBodyFields.value.length > 0 ||
    lowerBodyFields.value.length > 0 ||
    otherFields.value.length > 0
)

// Load templates function
async function loadTemplates(forceRefresh = false) {
  if (hasLoadedTemplates.value && !forceRefresh) return

  try {
    console.log('Fetching measurement templates...', forceRefresh ? '(forced refresh)' : '')
    await fetchTemplates()
    console.log('Templates fetched:', templates.value)
    hasLoadedTemplates.value = true
  } catch (error) {
    console.error('Failed to fetch measurement templates:', error)
    // Show error toast
    useToast().add({
      title: 'Error',
      description: 'Failed to load measurement templates',
      color: 'error',
    })
  }
}

// Also fetch on component mount for safety
onMounted(loadTemplates)

// Select template and load its fields
const selectTemplate = async templateId => {
  if (!templateId) {
    upperBodyFields.value = []
    lowerBodyFields.value = []
    otherFields.value = []
    return
  }

  try {
    console.log('Selecting template with ID:', templateId)

    // Find the selected template from the already loaded templates
    const template = templates.value.find(t => t.id === templateId)

    if (!template) {
      console.error('Template not found for ID:', templateId)
      useToast().add({
        title: 'Error',
        description: 'Template not found',
        color: 'error',
      })
      return
    }

    console.log('Found template:', template)

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
    const sortByOrder = (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
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
  } catch (error) {
    console.error('Error loading template fields:', error)
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
  allFields.forEach(
    (field: {
      name: string
      unit?: string
      id: string
      category?: string
      isRequired?: boolean
      displayOrder?: number
    }) => {
      try {
        // Convert field name to the format used in measurements object (lowercase with underscores)
        const fieldName = field.name.toLowerCase().replace(/\s+/g, '_')
        const measurementsValue = measurements.value as Record<string, any>
        const rawValue = measurementsValue[fieldName]

        // Handle different value types safely
        let fieldValue: number | null = null
        if (rawValue !== null && rawValue !== undefined && rawValue !== '') {
          const numValue = Number(rawValue)
          fieldValue = Number.isNaN(numValue) ? null : numValue
        }

        // Store field metadata and value (even if null)
        processedMeasurements.values[fieldName] = {
          value: fieldValue,
          unit: field.unit || 'in',
          name: field.name,
          fieldId: field.id,
          category: field.category || null,
          isRequired: field.isRequired || false,
          displayOrder: field.displayOrder || 0,
        }
      } catch (error) {
        console.error(`Error processing field ${field.name}:`, error)
      }
    }
  )

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

  return processedMeasurements
}

// Fetch client details
const fetchClient = async () => {
  try {
    isLoading.value = true

    // Fetch client directly using useAsyncData
    const { data: response, error } = await useAsyncData(`client-${clientId}`, () =>
      $fetch(`/api/clients/${clientId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    )

    if (error.value) {
      throw new Error(error.value?.data?.message || 'Failed to fetch client')
    }

    if (response.value && response.value.data) {
      const clientData = response.value.data

      // Update local state with the fetched client
      client.value = clientData

      // Update form with client data
      form.value = {
        name: clientData.name || '',
        email: clientData.email || null,
        phone: clientData.phone || null,
        address: clientData.address || null,
      }

      // Process measurement data if available
      if (client.value.measurement) {
        // If using the new schema with values field
        if (client.value.measurement.values) {
          const measurementValues = client.value.measurement.values as Record<string, any>

          // Set notes
          measurements.value.notes = client.value.measurement.notes || null

          // Store all measurement values in a temporary object for later use
          const tempValues: Record<string, any> = {}
          Object.entries(measurementValues).forEach(([key, data]) => {
            if (key !== '_template' && data && typeof data === 'object' && 'value' in data) {
              tempValues[key] = data.value
            }
          })

          // Extract template info if available
          if (measurementValues._template) {
            console.log('Found template info:', measurementValues._template)

            // First load templates, then select the one used for this client
            await loadTemplates(true) // Force refresh to ensure we have the latest templates

            // Set the selected template ID
            selectedTemplateId.value = measurementValues._template.id
            console.log('Set selected template ID to:', selectedTemplateId.value)

            // Initialize measurements with template fields
            initializeMeasurements()

            // Set the measurement values from the client data
            Object.entries(tempValues).forEach(([key, value]) => {
              if (measurements.value[key] !== undefined) {
                measurements.value[key] = value
              }
            })
          }
        } else if (client.value.measurement.measurements) {
          // Handle old schema with direct measurements
          selectedTemplateId.value = client.value.measurement.templateId || null
          measurements.value = {
            ...measurements.value,
            ...client.value.measurement.measurements,
          }
        }
      }
    } else {
      throw new Error('Failed to load client data')
    }
  } catch (error) {
    console.error('Error fetching client:', error)

    const errorMessage = error.message || 'Failed to load client data'
    useToast().add({
      title: 'Error',
      description: errorMessage,
      color: 'error',
    })
  } finally {
    isLoading.value = false
  }
}

// Update client
const updateClient = async () => {
  isUpdating.value = true
  isLoading.value = true

  try {
    // Process measurements if template is selected
    let measurementData = undefined
    if (selectedTemplateId.value) {
      measurementData = processMeasurements()
    }

    // Prepare the update data
    const updateData: Partial<Client> = {
      ...form.value,
      measurement: measurementData as any, // Cast to any to avoid type issues
    }

    // Update client using the composable
    const result = await updateClientApi(clientId, updateData)

    if (result.success && result.data) {
      // Show success message
      toast.add({
        title: 'Success',
        description: 'Client updated successfully',
        color: 'primary',
      })

      // Redirect to client detail page
      navigateTo(`/clients/${clientId}`)
    } else {
      throw new Error(result.message || 'Failed to update client')
    }
  } catch (error) {
    console.error('Error updating client:', error)

    toast.add({
      title: 'Error',
      description: error.message || 'Failed to update client. Please try again.',
      color: 'error',
    })
  } finally {
    isUpdating.value = false
    isLoading.value = false
  }
}

// Delete client
const deleteClient = async () => {
  isDeleting.value = true
  isLoading.value = true

  try {
    // Show confirmation dialog
    const confirmed = await useConfirmDialog({
      title: 'Delete Client',
      content: `Are you sure you want to delete ${form.value.name}? This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      confirmButtonColor: 'red',
    })

    if (!confirmed) {
      isDeleting.value = false
      isLoading.value = false
      return
    }

    // Delete client directly using $fetch
    await $fetch(`/api/clients/${clientId}`, {
      method: 'DELETE',
    })

    // Show success message
    toast.add({
      title: 'Success',
      description: 'Client deleted successfully',
      color: 'primary',
    })

    // Redirect to clients list
    navigateTo(_CLIENTS_PATH)
  } catch (error) {
    console.error('Error deleting client:', error)

    toast.add({
      title: 'Error',
      description: error.message || 'Failed to delete client. Please try again.',
      color: 'error',
    })
  } finally {
    isDeleting.value = false
    isLoading.value = false
  }
}

// Confirm delete
const _confirmDelete = () => {
  useConfirmDialog({
    title: 'Delete Client',
    content: 'Are you sure you want to delete this client? This action cannot be undone.',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    confirmButtonColor: 'red',
  }).then(confirmed => {
    if (confirmed) {
      deleteClient()
    }
  })
}

// Fetch client data and templates on mount
onMounted(async () => {
  await Promise.all([fetchClient(), loadTemplates()])
})
</script>
