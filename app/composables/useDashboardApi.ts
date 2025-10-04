import { API_ENDPOINTS } from '../../constants/api'
import type {
  DashboardStats,
  ActivityItem,
  ClientGrowthData,
  ChartPeriod,
} from '../../types/dashboard'
import type { Order } from '../../types/order'

export function useDashboardApi() {
  const toast = useToast()

  // Helper function to handle API errors
  const handleError = (error: any, defaultMessage: string) => {
    console.error(defaultMessage, error)
    const errorMessage = error.data?.message || defaultMessage

    // Only show toast on client side
    if (import.meta.client) {
      toast.add({
        title: 'Error',
        description: errorMessage,
        color: 'error',
      })
    }

    throw new Error(errorMessage)
  }

  /**
   * Fetch dashboard statistics
   */
  const getStats = async () => {
    const { data, error } = await useAsyncData<DashboardStats>('dashboard-stats', () =>
      $fetch<DashboardStats>(API_ENDPOINTS.DASHBOARD.STATS, {
        method: 'GET',
      })
    )

    if (error.value) {
      return handleError(error.value, 'Failed to fetch dashboard statistics')
    }

    return { success: true, stats: data.value }
  }

  /**
   * Fetch recent activity
   * @param limit Number of activities to fetch (default: 5)
   */
  const getRecentActivity = async (limit = 5) => {
    const { data, error } = await useAsyncData<ActivityItem[]>(`recent-activity-${limit}`, () =>
      $fetch<ActivityItem[]>(API_ENDPOINTS.DASHBOARD.RECENT_ACTIVITY, {
        method: 'GET',
        params: { limit },
      })
    )

    if (error.value) {
      return handleError(error.value, 'Failed to fetch recent activity')
    }

    return { success: true, activities: data.value || [] }
  }

  /**
   * Fetch orders due soon
   */
  const getDueOrders = async () => {
    const { data, error } = await useAsyncData<Order[]>('due-orders', () =>
      $fetch<Order[]>(API_ENDPOINTS.DASHBOARD.ORDERS_DUE_SOON, {
        method: 'GET',
      })
    )

    if (error.value) {
      return handleError(error.value, 'Failed to fetch due orders')
    }

    return { success: true, orders: data.value || [] }
  }

  /**
   * Fetch client growth data
   * @param period Time period for growth data (week, month, year)
   */
  const getClientGrowth = async (period: ChartPeriod = 'month') => {
    try {
      const url = API_ENDPOINTS.DASHBOARD.CLIENT_GROWTH
      console.log(`Fetching client growth data from: ${url}`, { period })

      const response = await $fetch<ClientGrowthData>(url, {
        method: 'GET',
        params: { period },
        onRequest({ request, options: _options }) {
          console.log('Request:', { url: request, options: _options })
        },
        onResponse({ response }) {
          console.log('Response received:', {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            headers: Object.fromEntries(response.headers.entries()),
          })
        },
        onResponseError({ request, response, options: _options }) {
          console.error('Response error:', {
            request,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers ? Object.fromEntries(response.headers.entries()) : {},
            body: response._data,
          })
        },
      })

      if (!response) {
        throw new Error('No data returned from client growth endpoint')
      }

      console.log('Successfully fetched client growth data:', response)
      return { success: true, growthData: response }
    } catch (error: any) {
      console.error('Error fetching client growth data:', error)
      return handleError(error, 'Failed to fetch client growth data')
    }
  }

  /**
   * Fetch all dashboard data in a single request with server-side rendering support
   */
  const getDashboardData = async () => {
    const { data, error } = await useAsyncData<{
      stats: DashboardStats
      activities: ActivityItem[]
      dueOrders: Order[]
    }>('dashboard-data', async () => {
      const [stats, activities, dueOrders] = await Promise.all([
        $fetch<DashboardStats>(API_ENDPOINTS.DASHBOARD.STATS, { method: 'GET' }),
        $fetch<ActivityItem[]>(API_ENDPOINTS.DASHBOARD.RECENT_ACTIVITY, {
          method: 'GET',
          params: { limit: 5 },
        }),
        $fetch<Order[]>(API_ENDPOINTS.DASHBOARD.ORDERS_DUE_SOON, { method: 'GET' }),
      ])

      return { stats, activities, dueOrders }
    })

    if (error.value) {
      return handleError(error.value, 'Failed to fetch dashboard data')
    }

    return {
      success: true,
      stats: data.value?.stats,
      activities: data.value?.activities || [],
      dueOrders: data.value?.dueOrders || [],
    }
  }

  return {
    getStats,
    getRecentActivity,
    getDueOrders,
    getClientGrowth,
    getDashboardData,
  }
}

export default useDashboardApi
