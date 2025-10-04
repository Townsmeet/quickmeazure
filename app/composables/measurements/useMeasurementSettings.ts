import { ref } from 'vue'

export const useMeasurementSettings = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const settings = ref({
    defaultUnit: 'in' as 'in' | 'cm',
  })

  // Fetch user's measurement settings
  const fetchSettings = async () => {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await useFetch('/api/user/measurement-settings', {
        deep: true
      })

      if (fetchError.value) {
        throw new Error(fetchError.value.message || 'Failed to fetch settings')
      }

      if (data.value?.data) {
        settings.value = {
          ...settings.value,
          ...data.value.data,
        }
      }

      return settings.value
    } catch (err: any) {
      console.error('Error fetching measurement settings:', err)
      error.value = err.message || 'Failed to fetch measurement settings'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update user's measurement settings
  const updateSettings = async (updates: { defaultUnit?: 'in' | 'cm' }) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: updateError } = await useFetch('/api/user/measurement-settings', {
        method: 'PUT',
        body: updates,
      })

      if (updateError.value) {
        throw new Error(updateError.value.message || 'Failed to update settings')
      }

      if (data.value?.data) {
        settings.value = {
          ...settings.value,
          ...data.value.data,
        }
      }

      return settings.value
    } catch (err: any) {
      console.error('Error updating measurement settings:', err)
      error.value = err.message || 'Failed to update measurement settings'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Convert a value between units
  const convertValue = (value: number, fromUnit: 'in' | 'cm', toUnit: 'in' | 'cm'): number => {
    if (fromUnit === toUnit) return value

    if (fromUnit === 'in' && toUnit === 'cm') {
      return value * 2.54
    } else if (fromUnit === 'cm' && toUnit === 'in') {
      return value / 2.54
    }

    return value
  }

  // Format a value with unit
  const formatValue = (value: number, unit: 'in' | 'cm', precision = 2): string => {
    return `${value.toFixed(precision)} ${unit}`
  }

  return {
    // State
    loading,
    error,
    settings,

    // Methods
    fetchSettings,
    updateSettings,
    convertValue,
    formatValue,
  }
}

export default useMeasurementSettings
