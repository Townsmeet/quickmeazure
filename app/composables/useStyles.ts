interface Style {
  id: number
  name: string
  description?: string
  status: 'active' | 'inactive' | 'draft'
  price?: number
  images?: string[]
  measurements?: Record<string, any>
  createdAt: string
  updatedAt: string
}

interface CreateStyleData {
  name: string
  description?: string
  price?: number
  images?: string[]
  measurements?: Record<string, any>
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
  status: 'all' | 'active' | 'inactive' | 'draft'
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
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  }))

  // Data fetching with useFetch
  const {
    data: stylesData,
    pending: isLoading,
    refresh: refreshStyles,
  } = useFetch<StylesResponse>('/api/styles', {
    server: false,
    default: () => ({ success: false, data: [] }) as StylesResponse,
    onResponse({ response }) {
      const responseData = response._data as StylesResponse
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

      const matchesStatus = filters.value.status === 'all' || style.status === filters.value.status

      return matchesSearch && matchesStatus
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
      const { data } = await useFetch<StyleResponse>(`/api/styles/${id}`, {
        server: false,
        default: () => ({ success: false, data: null }) as StyleResponse,
      })

      const responseData = data.value as StyleResponse
      if (responseData?.success && responseData?.data) {
        currentStyle.value = responseData.data
        return responseData.data
      }

      return null
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch style'
      return null
    }
  }

  // Create style
  const createStyle = async (data: CreateStyleData): Promise<StyleResponse> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<StyleResponse>('/api/styles', {
        method: 'POST',
        body: data,
      })

      if (response.success && response.data) {
        styles.value.push(response.data)
      }

      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to create style'
      return {
        success: false,
        message: error.value,
      }
    } finally {
      isLoading.value = false
    }
  }

  // Update style
  const updateStyle = async (
    id: number,
    updates: Partial<CreateStyleData>
  ): Promise<StyleResponse> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<StyleResponse>(`/api/styles/${id}`, {
        method: 'PUT',
        body: updates,
      })

      if (response.success && response.data) {
        const index = styles.value.findIndex(s => s.id === id)
        if (index !== -1) {
          styles.value[index] = response.data
        }

        // Update current style if it's the one being edited
        if (currentStyle.value?.id === id) {
          currentStyle.value = response.data
        }
      }

      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to update style'
      return {
        success: false,
        message: error.value,
      }
    } finally {
      isLoading.value = false
    }
  }

  // Delete style
  const deleteStyle = async (id: number): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean }>(`/api/styles/${id}`, {
        method: 'DELETE',
      })

      if (response.success) {
        styles.value = styles.value.filter(s => s.id !== id)

        // Clear current style if it's the one being removed
        if (currentStyle.value?.id === id) {
          currentStyle.value = null
        }
      }

      return response.success
    } catch (err: any) {
      error.value = err.message || 'Failed to delete style'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Update style status
  const updateStyleStatus = async (id: number, status: Style['status']): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<StyleResponse>(`/api/styles/${id}/status`, {
        method: 'PUT',
        body: { status },
      })

      if (response.success && response.data) {
        const index = styles.value.findIndex(s => s.id === id)
        if (index !== -1) {
          styles.value[index] = response.data
        }

        // Update current style if it's the one being edited
        if (currentStyle.value?.id === id) {
          currentStyle.value = response.data
        }
      }

      return response.success
    } catch (err: any) {
      error.value = err.message || 'Failed to update style status'
      return false
    } finally {
      isLoading.value = false
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
    updateStyleStatus,
    searchStyles,

    // Refresh Actions
    refreshStyles,

    // Local State Actions
    setCurrentStyle,
    setFilters,
    clearError,
  }
}
