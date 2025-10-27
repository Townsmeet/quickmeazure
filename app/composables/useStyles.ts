import type { Style } from '~/types/style'

interface CreateStyleData {
  name: string
  description?: string | null
  type?: string | null
}

interface StyleResponse {
  success: boolean
  data?: Style
  message?: string
}

interface StylesResponse {
  success: boolean
  data?: Style[]
  message?: string
}

interface StyleFilter {
  search: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export const useStyles = () => {
  // State
  const styles = useState<Style[]>('styles', () => [])
  const currentStyle = useState<Style | null>('current_style', () => null)
  const error = useState<string | null>('styles_error', () => null)
  const filters = useState<StyleFilter>('styles_filters', () => ({
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  }))

  // Data fetching with useFetch
  const {
    data: stylesData,
    pending: isLoading,
    refresh: refreshStyles,
  } = useFetch<any>('/api/styles', {
    server: false,
    default: () => ({ success: false, data: [] }),
    onResponse({ response }) {
      const responseData = response._data
      if (responseData?.success && responseData?.data) {
        styles.value = responseData.data
      }
    },
    onResponseError({ error: fetchError }) {
      error.value = fetchError?.message || 'Failed to fetch styles'
    },
  })

  // Computed
  const filteredStyles = computed(() => {
    return styles.value.filter(style => {
      const matchesSearch =
        !filters.value.search ||
        style.name.toLowerCase().includes(filters.value.search.toLowerCase()) ||
        style.description?.toLowerCase().includes(filters.value.search.toLowerCase())

      return matchesSearch
    })
  })

  // Fetch all styles (for compatibility)
  const fetchStyles = async (): Promise<Style[]> => {
    await refreshStyles()
    return styles.value
  }

  // Get style by ID (using useFetch)
  const getStyle = async (id: number): Promise<Style | null> => {
    error.value = null

    try {
      const { data } = await useFetch<any>(`/api/styles/${id}`, {
        server: false,
        default: () => ({ success: false, data: null }),
      })

      const responseData = data.value
      if (responseData?.success && responseData?.data) {
        const styleData = responseData.data.style || responseData.data
        currentStyle.value = styleData
        return styleData
      }

      return null
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch style'
      return null
    }
  }

  // Create style
  const createStyle = async (data: CreateStyleData): Promise<StyleResponse> => {
    error.value = null

    try {
      const response = await $fetch<any>('/api/styles', {
        method: 'POST',
        body: data,
      })

      if (response?.success && response?.data) {
        styles.value.push(response.data)
        return {
          success: true,
          data: response.data,
        }
      }

      return {
        success: false,
        message: response?.message || 'Failed to create style',
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to create style'
      return {
        success: false,
        message: error.value || 'Failed to create style',
      }
    }
  }

  // Update style
  const updateStyle = async (
    id: number,
    updates: Partial<CreateStyleData>
  ): Promise<StyleResponse> => {
    error.value = null

    try {
      const response = await $fetch<any>(`/api/styles/${id}`, {
        method: 'PUT',
        body: updates,
      })

      if (response?.success && response?.data) {
        const index = styles.value.findIndex(s => s.id === id)
        if (index !== -1) {
          styles.value[index] = response.data
        }

        // Update current style if it's the one being edited
        if (currentStyle.value?.id === id) {
          currentStyle.value = response.data
        }

        return {
          success: true,
          data: response.data,
        }
      }

      return {
        success: false,
        message: response?.message || 'Failed to update style',
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to update style'
      return {
        success: false,
        message: error.value || 'Failed to update style',
      }
    }
  }

  // Delete style
  const deleteStyle = async (id: number): Promise<boolean> => {
    error.value = null

    try {
      const response = await $fetch<any>(`/api/styles/${id}`, {
        method: 'DELETE',
      })

      if (response?.success) {
        styles.value = styles.value.filter(s => s.id !== id)

        // Clear current style if it's the one being removed
        if (currentStyle.value?.id === id) {
          currentStyle.value = null
        }

        return true
      }

      return false
    } catch (err: any) {
      error.value = err.message || 'Failed to delete style'
      return false
    }
  }

  // Search styles (using useFetch)
  const searchStyles = async (query: string): Promise<Style[]> => {
    error.value = null

    try {
      const { data } = await useFetch<StylesResponse>('/api/styles/search', {
        query: { q: query },
        server: false,
        default: () => ({ success: false, data: [] }) as StylesResponse,
      })

      const responseData = data.value as StylesResponse
      if (responseData?.success && responseData?.data) {
        return responseData.data
      }

      return []
    } catch (err: any) {
      error.value = err.message || 'Failed to search styles'
      return []
    }
  }

  // Local state management
  const setCurrentStyle = (style: Style | null) => {
    currentStyle.value = style
  }

  const setFilters = (newFilters: Partial<StyleFilter>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    styles: readonly(styles),
    currentStyle: readonly(currentStyle),
    isLoading: readonly(isLoading),
    error: readonly(error),
    filters: readonly(filters),

    // Computed
    filteredStyles,

    // API Actions
    fetchStyles,
    getStyle,
    createStyle,
    updateStyle,
    deleteStyle,
    searchStyles,

    // Refresh Actions
    refreshStyles,

    // Local State Actions
    setCurrentStyle,
    setFilters,
    clearError,
  }
}
