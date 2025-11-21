// Activity types
export interface ActivityItem {
  id: number | string
  type: string
  action?: string
  entity?: string
  message: string
  time?: string
  timestamp?: string
  icon?: string
  metadata?: Record<string, any>
}

interface ActivityResponse {
  success: boolean
  data?: ActivityItem[]
  total?: number
  page?: number
  totalPages?: number
  error?: string
  message?: string
}

interface ActivityFilters {
  type?: string | null
  startDate?: string | null
  endDate?: string | null
}

interface ActivityParams {
  page?: number
  perPage?: number
  filters?: ActivityFilters
}

export const useActivity = () => {
  // State
  const activities = useState<ActivityItem[]>('activities', () => [])
  const error = useState<string | null>('activity_error', () => null)
  const isLoading = useState<boolean>('activity_loading', () => false)
  const totalCount = useState<number>('activity_total', () => 0)
  const currentPage = useState<number>('activity_page', () => 1)
  const totalPages = useState<number>('activity_total_pages', () => 1)
  const perPage = useState<number>('activity_per_page', () => 10)

  // Fetch activity with pagination and filters
  const fetchActivity = async (params?: ActivityParams): Promise<ActivityResponse> => {
    isLoading.value = true
    error.value = null

    try {
      // Use provided params or state defaults
      const pageNum = params?.page ?? currentPage.value
      const perPageSize = params?.perPage ?? perPage.value
      const filters = params?.filters ?? {}

      // Prepare query parameters
      const queryParams = new URLSearchParams()
      queryParams.append('page', pageNum.toString())
      queryParams.append('per_page', perPageSize.toString())

      // Add filters if they exist
      if (filters.type) {
        queryParams.append('type', filters.type)
      }

      if (filters.startDate && filters.endDate) {
        const startDate = new Date(filters.startDate)
        const endDate = new Date(filters.endDate)
        // Set end date to end of day
        endDate.setHours(23, 59, 59, 999)
        queryParams.append('start_date', startDate.toISOString())
        queryParams.append('end_date', endDate.toISOString())
      }

      // Fetch activity data
      const response = await $fetch<ActivityResponse>(`/api/activity?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.success && Array.isArray(response.data)) {
        activities.value = response.data
        totalCount.value = response.total ?? 0
        totalPages.value = response.totalPages ?? 1
        currentPage.value = response.page ?? pageNum
        perPage.value = perPageSize

        return response
      } else {
        // Handle error response
        error.value = response.error || response.message || 'Failed to fetch activity data'
        activities.value = []
        totalCount.value = 0
        totalPages.value = 1

        return response
      }
    } catch (err: any) {
      error.value = err?.data?.message || err?.message || 'Failed to fetch activity data'
      activities.value = []
      totalCount.value = 0
      totalPages.value = 1

      return {
        success: false,
        error: error.value,
        message: error.value,
      }
    } finally {
      isLoading.value = false
    }
  }

  // Clear error
  const clearError = () => {
    error.value = null
  }

  // Set page
  const setPage = (page: number) => {
    currentPage.value = page
  }

  // Set per page
  const setPerPage = (pageSize: number) => {
    perPage.value = pageSize
  }

  return {
    // State
    activities: readonly(activities),
    isLoading: readonly(isLoading),
    error: readonly(error),
    totalCount: readonly(totalCount),
    currentPage: readonly(currentPage),
    totalPages: readonly(totalPages),
    perPage: readonly(perPage),

    // Actions
    fetchActivity,
    clearError,
    setPage,
    setPerPage,
  }
}
