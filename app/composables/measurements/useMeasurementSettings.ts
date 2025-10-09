import type { MeasurementSettings } from '~/types/measurement'

interface SettingsResponse {
  success: boolean
  data?: MeasurementSettings
  message?: string
}

export const useMeasurementSettings = () => {
  // State
  const settings = useState<MeasurementSettings>('measurement_settings', () => ({
    defaultUnit: 'in', // Default to inches
  }))

  const error = useState<string | null>('measurement_settings_error', () => null)
  const isLoading = ref(false)

  // Fetch settings
  const fetchSettings = async (): Promise<MeasurementSettings | null> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<SettingsResponse>('/api/measurement-settings')

      if (response.success && response.data) {
        settings.value = response.data
        return response.data
      }

      return null
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch measurement settings'
      console.error('Error fetching measurement settings:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  // Update settings
  const updateSettings = async (updates: Partial<MeasurementSettings>): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<SettingsResponse>('/api/measurement-settings', {
        method: 'PUT',
        body: updates,
      })

      if (response.success && response.data) {
        settings.value = { ...settings.value, ...response.data }
        return true
      }

      return false
    } catch (err: any) {
      error.value = err.message || 'Failed to update measurement settings'
      console.error('Error updating measurement settings:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    settings,
    isLoading,
    error,

    // Methods
    fetchSettings,
    updateSettings,
  }
}

// Using MeasurementSettings type from ~/types/measurement
