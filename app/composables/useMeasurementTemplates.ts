import type { MeasurementTemplate } from '~/types'

interface CreateFieldData {
  name: string
  isRequired: boolean
  displayOrder: number
  category: string
}

interface UpdateTemplateData {
  name?: string
  unit?: string
  description?: string
  gender?: 'male' | 'female' | 'unisex'
  fields?: CreateFieldData[]
}

interface CreateTemplateData {
  name: string
  unit: string
  description?: string
  gender: string
  fields: CreateFieldData[]
  setupProcess?: boolean
}

interface TemplateResponse {
  success: boolean
  data?: MeasurementTemplate
  message?: string
}

interface TemplatesResponse {
  success: boolean
  data?: MeasurementTemplate[]
  message?: string
}

export const useMeasurementTemplates = () => {
  // State
  const templates = useState<MeasurementTemplate[]>('measurement_templates', () => [])
  const currentTemplate = useState<MeasurementTemplate | null>(
    'measurement_current_template',
    () => null
  )
  const error = useState<string | null>('measurement_templates_error', () => null)

  // Data fetching with useFetch
  const { pending: isLoading, refresh: refreshTemplates } = useFetch<TemplatesResponse>(
    '/api/measurement-templates',
    {
      server: true,
      query: { includeArchived: 'true' },
      default: () => ({ success: false, data: [] }) as TemplatesResponse,
      onResponse({ response }) {
        const responseData = response._data as TemplatesResponse
        if (responseData?.success && responseData?.data) {
          templates.value = responseData.data.map(template => ({
            ...template,
            fields: template.fields.map(field => ({ ...field })),
          })) as MeasurementTemplate[]
        }
      },
      onResponseError({ error: fetchError }) {
        error.value = fetchError?.message || 'Failed to fetch templates'
      },
    }
  )

  // Computed
  const defaultTemplate = computed<MeasurementTemplate | undefined>(() =>
    templates.value.find(t => t.isDefault)
  )
  const templateNames = computed<string[]>(() => templates.value.map(t => t.name))

  // Fetch all templates (for compatibility)
  const fetchTemplates = async (): Promise<MeasurementTemplate[]> => {
    await refreshTemplates()
    return templates.value
  }

  // Create template (mutation with $fetch)
  const createTemplate = async (data: CreateTemplateData): Promise<TemplateResponse> => {
    error.value = null
    try {
      console.log('Sending to API:', data)
      const response = await $fetch<TemplateResponse>('/api/measurement-templates', {
        method: 'POST',
        body: data,
        credentials: 'include',
      })
      console.log('API Response:', response)
      if (response.success && response.data) {
        const mutableTemplate = {
          ...response.data,
          fields: response.data.fields.map(field => ({ ...field })),
        } as MeasurementTemplate
        templates.value.push(mutableTemplate)
        await refreshTemplates()

        // Force refresh to get updated setup status from server
        const { init } = useAuth()
        await init(true)
      }
      return response
    } catch (err: any) {
      console.error('API Error:', err)
      error.value = err.message || 'Failed to create template'
      return { success: false, message: error.value || undefined }
    }
  }

  // Update template (mutation with $fetch)
  const updateTemplate = async (
    id: number,
    updates: UpdateTemplateData
  ): Promise<TemplateResponse> => {
    error.value = null
    try {
      console.log('Making PUT request to:', `/api/measurement-templates/${id}`)
      const response = await $fetch<TemplateResponse>(`/api/measurement-templates/${id}`, {
        method: 'PUT',
        body: updates,
        credentials: 'include',
      })
      if (response.success && response.data) {
        const index = templates.value.findIndex(t => t.id === id)
        if (index !== -1) {
          templates.value[index] = {
            ...response.data,
            fields: response.data.fields.map(field => ({ ...field })),
          } as MeasurementTemplate
        }
        if (currentTemplate.value && currentTemplate.value.id === id) {
          currentTemplate.value = {
            ...response.data,
            fields: response.data.fields.map(field => ({ ...field })),
          } as MeasurementTemplate
        }
        await refreshTemplates()
      }
      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to update template'
      return { success: false, message: error.value || undefined }
    }
  }

  // Delete template (mutation with $fetch)
  const deleteTemplate = async (id: number): Promise<boolean> => {
    error.value = null

    try {
      const response = await $fetch<{ success: boolean }>(`/api/measurement-templates/${id}`, {
        method: 'DELETE',
      })

      if (response.success) {
        templates.value = templates.value.filter(t => t.id !== id)

        // Clear current template if it's the one being removed
        if (currentTemplate.value && currentTemplate.value.id === id) {
          currentTemplate.value = null
        }

        await refreshTemplates()
      }

      return response.success
    } catch (err: any) {
      error.value = err.message || 'Failed to delete template'
      return false
    }
  }

  // Set default template (mutation with $fetch)
  const setDefaultTemplate = async (id: number): Promise<boolean> => {
    error.value = null

    try {
      const response = await $fetch<{ success: boolean }>(
        `/api/measurement-templates/${id}/set-default`,
        {
          method: 'POST',
        }
      )

      if (response.success) {
        // Update all templates to set isDefault to false except the selected one
        templates.value = templates.value.map(t => ({
          ...t,
          isDefault: t.id === id,
        }))
        await refreshTemplates()
      }

      return response.success
    } catch (err: any) {
      error.value = err.message || 'Failed to set default template'
      return false
    }
  }

  // Archive template (mutation with $fetch)
  const archiveTemplate = async (id: number): Promise<boolean> => {
    error.value = null

    try {
      const response = await $fetch<{ success: boolean }>(
        `/api/measurement-templates/${id}/archive`,
        {
          method: 'POST',
        }
      )

      if (response.success) {
        const index = templates.value.findIndex(t => t.id === id)
        if (index !== -1) {
          const templateToUpdate = templates.value[index]
          if (templateToUpdate) {
            templates.value[index] = {
              ...templateToUpdate,
              fields: templateToUpdate.fields.map(field => ({ ...field })),
              isArchived: true,
            } as MeasurementTemplate
          }
        }
        await refreshTemplates()
      }

      return response.success
    } catch (err: any) {
      error.value = err.message || 'Failed to archive template'
      return false
    }
  }

  // Unarchive template (mutation with $fetch)
  const unarchiveTemplate = async (id: number): Promise<boolean> => {
    error.value = null

    try {
      const response = await $fetch<{ success: boolean }>(
        `/api/measurement-templates/${id}/unarchive`,
        {
          method: 'POST',
        }
      )

      if (response.success) {
        const index = templates.value.findIndex(t => t.id === id)
        if (index !== -1) {
          const templateToUpdate = templates.value[index]
          if (templateToUpdate) {
            templates.value[index] = {
              ...templateToUpdate,
              fields: templateToUpdate.fields.map(field => ({ ...field })),
              isArchived: false,
            } as MeasurementTemplate
          }
        }
        await refreshTemplates()
      }

      return response.success
    } catch (err: any) {
      error.value = err.message || 'Failed to unarchive template'
      return false
    }
  }

  // Local state management functions
  const setTemplates = (newTemplates: MeasurementTemplate[]) => {
    templates.value = newTemplates
  }

  const setCurrentTemplate = (template: MeasurementTemplate | null) => {
    currentTemplate.value = template
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    templates,
    currentTemplate: readonly(currentTemplate),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Computed
    defaultTemplate,
    templateNames,

    // API Actions
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    setDefaultTemplate,
    archiveTemplate,
    unarchiveTemplate,

    // Refresh Actions
    refreshTemplates,

    // Local State Actions
    setTemplates,
    setCurrentTemplate,
    clearError,
  }
}
