interface DashboardStats {
  totalClients: number
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  completedOrders: number
  monthlyRevenue: number
  monthlyGrowth: number
}

interface ActivityItem {
  id: string
  type: 'order' | 'client' | 'payment'
  title: string
  description: string
  timestamp: string
  metadata?: Record<string, any>
}

interface ClientGrowthData {
  labels: string[]
  data: number[]
  totalGrowth: number
  percentGrowth: number
}

interface Order {
  id: number
  clientId: number
  status: string
  totalAmount: number
  dueDate?: string
  createdAt: string
}

type ChartPeriod = '7days' | '30days' | '90days' | '1year'

interface DashboardResponse {
  success: boolean
  data?: {
    stats: DashboardStats
    recentActivity: ActivityItem[]
    dueOrders: Order[]
    clientGrowth: ClientGrowthData
  }
  message?: string
}

export const useDashboard = () => {
  // State
  const stats = useState<DashboardStats | null>('dashboard_stats', () => null)
  const recentActivity = useState<ActivityItem[]>('dashboard_activity', () => [])
  const dueOrders = useState<Order[]>('dashboard_due_orders', () => [])
  const clientGrowth = useState<ClientGrowthData>('dashboard_client_growth', () => ({
    labels: [],
    data: [],
    totalGrowth: 0,
    percentGrowth: 0,
  }))
  const error = useState<string | null>('dashboard_error', () => null)
  const chartPeriod = useState<ChartPeriod>('dashboard_chart_period', () => '30days')

  // Data fetching with useFetch
  const {
    data: dashboardData,
    pending: isLoading,
    refresh: refreshDashboard,
  } = useFetch<DashboardResponse>('/api/dashboard', {
    query: computed(() => ({ period: chartPeriod.value })),
    server: false,
    default: () => ({ success: false, data: undefined }) as DashboardResponse,
    onResponse({ response }) {
      const responseData = response._data as DashboardResponse
      if (responseData?.success && responseData?.data) {
        const data = responseData.data
        stats.value = data.stats
        recentActivity.value = data.recentActivity
        dueOrders.value = data.dueOrders
        clientGrowth.value = data.clientGrowth
      }
    },
    onResponseError({ error: fetchError }) {
      error.value = fetchError?.message || 'Failed to fetch dashboard data'
    },
  })

  // Computed
  const hasChartData = computed(() => {
    return clientGrowth.value.labels.length > 0 && clientGrowth.value.data.length > 0
  })

  // Fetch dashboard data (for compatibility)
  const fetchDashboardData = async (period: ChartPeriod = chartPeriod.value): Promise<boolean> => {
    chartPeriod.value = period
    await refreshDashboard()
    const responseData = dashboardData.value as DashboardResponse
    return responseData?.success || false
  }

  // Fetch functions using $fetch for individual endpoints
  const fetchStats = async (): Promise<DashboardStats | null> => {
    try {
      const response = await $fetch<{ success: boolean; data: DashboardStats }>(
        '/api/dashboard/stats'
      )
      if (response.success && response.data) {
        stats.value = response.data
        return response.data
      }
      return null
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch stats'
      return null
    }
  }

  const fetchRecentActivity = async (): Promise<ActivityItem[]> => {
    try {
      const response = await $fetch<{ success: boolean; data: ActivityItem[] }>(
        '/api/dashboard/activity',
        {
          query: { limit: 10 },
        }
      )
      if (response.success && response.data) {
        recentActivity.value = response.data
        return response.data
      }
      return []
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch activity'
      return []
    }
  }

  const fetchDueOrders = async (): Promise<Order[]> => {
    try {
      const response = await $fetch<{ success: boolean; data: Order[] }>(
        '/api/dashboard/due-orders'
      )
      if (response.success && response.data) {
        dueOrders.value = response.data
        return response.data
      }
      return []
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch due orders'
      return []
    }
  }

  const fetchClientGrowth = async (
    period: ChartPeriod = chartPeriod.value
  ): Promise<ClientGrowthData | null> => {
    chartPeriod.value = period
    await refreshDashboard()
    return clientGrowth.value
  }

  // Local state management
  const setChartPeriod = (period: ChartPeriod) => {
    chartPeriod.value = period
  }

  const clearError = () => {
    error.value = null
  }

  const refreshData = async () => {
    await fetchDashboardData(chartPeriod.value)
  }

  return {
    // State
    isLoading: readonly(isLoading),
    stats: readonly(stats),
    recentActivity: readonly(recentActivity),
    dueOrders: readonly(dueOrders),
    clientGrowth: readonly(clientGrowth),
    error: readonly(error),
    chartPeriod: readonly(chartPeriod),

    // Computed
    hasChartData,

    // API Actions
    fetchDashboardData,
    fetchStats,
    fetchRecentActivity,
    fetchDueOrders,
    fetchClientGrowth,

    // Refresh Actions
    refreshDashboard,

    // Local State Actions
    setChartPeriod,
    clearError,
    refreshData,
  }
}
