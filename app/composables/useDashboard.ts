interface DashboardStats {
  totalClients: number
  newClientsThisMonth: number
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  completedOrders: number
  completedOrdersThisMonth: number
  activeOrders: number
  monthlyRevenue: number
  monthlyGrowth: number
  revenueGrowth: number
  subscriptionPlan?: string
  clientsRemaining?: number | null
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
  clientName: string
  status: string
  totalAmount: number
  dueDate?: string
  createdAt: string
}

type ChartPeriod = '7days' | '30days' | '90days' | '1year' | 'year'

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

  // Data fetching with useFetch for each data type
  const {
    data: _statsData,
    pending: isLoadingStats,
    refresh: refreshStats,
  } = useFetch<{ success: boolean; data?: DashboardStats; message?: string; error?: string }>(
    '/api/dashboard/stats',
    {
      server: false,
      default: () => ({
        success: false,
        data: undefined as unknown as DashboardStats,
      }),
      onResponse({ response }) {
        const responseData = response._data
        if (responseData?.success && responseData?.data) {
          stats.value = responseData.data
        } else {
          stats.value = null
          error.value = responseData?.error || responseData?.message || 'Failed to fetch stats'
        }
      },
    }
  )

  const {
    data: _activityData,
    pending: isLoadingActivity,
    refresh: refreshActivity,
  } = useFetch<{ success: boolean; data?: ActivityItem[]; message?: string; error?: string }>(
    '/api/dashboard/recent-activity',
    {
      query: { limit: 10 },
      server: false,
      default: () => ({
        success: false,
        data: [] as ActivityItem[],
      }),
      onResponse({ response }) {
        const responseData = response._data
        if (responseData?.success && responseData?.data) {
          recentActivity.value = responseData.data
        } else {
          recentActivity.value = []
          error.value = responseData?.error || responseData?.message || 'Failed to fetch activity'
        }
      },
    }
  )

  const {
    data: _dueOrdersData,
    pending: isLoadingDueOrders,
    refresh: refreshDueOrders,
  } = useFetch<{ success: boolean; data?: Order[]; message?: string; error?: string }>(
    '/api/dashboard/orders-due-soon',
    {
      server: false,
      default: () => ({
        success: false,
        data: [] as Order[],
      }),
      onResponse({ response }) {
        const responseData = response._data
        if (responseData?.success && responseData?.data) {
          dueOrders.value = responseData.data
        } else {
          dueOrders.value = []
          error.value = responseData?.error || responseData?.message || 'Failed to fetch due orders'
        }
      },
    }
  )

  const {
    data: _growthData,
    pending: isLoadingGrowth,
    refresh: refreshGrowth,
  } = useFetch<{ success: boolean; data?: ClientGrowthData; message?: string; error?: string }>(
    '/api/dashboard/client-growth',
    {
      query: computed(() => ({ period: chartPeriod.value })),
      server: false,
      default: () => ({
        success: false,
        data: {
          labels: [] as string[],
          data: [] as number[],
          totalGrowth: 0,
          percentGrowth: 0,
        },
      }),
      onResponse({ response }) {
        const responseData = response._data
        if (responseData?.success && responseData?.data) {
          clientGrowth.value = responseData.data
        } else {
          clientGrowth.value = { labels: [], data: [], totalGrowth: 0, percentGrowth: 0 }
          error.value =
            responseData?.error || responseData?.message || 'Failed to fetch client growth'
        }
      },
    }
  )

  // Combined loading state
  const isLoading = computed(
    () =>
      isLoadingStats.value ||
      isLoadingActivity.value ||
      isLoadingDueOrders.value ||
      isLoadingGrowth.value
  )

  // Computed
  const hasChartData = computed(() => {
    return clientGrowth.value.labels.length > 0 && clientGrowth.value.data.length > 0
  })

  // Fetch dashboard data (for compatibility)
  const fetchDashboardData = async (period: ChartPeriod = chartPeriod.value): Promise<boolean> => {
    chartPeriod.value = period
    await refreshDashboard()
    return true
  }

  // Individual data fetching functions (kept for backward compatibility)
  const fetchStats = async (): Promise<DashboardStats | null> => {
    if (stats.value) return stats.value
    await refreshStats()
    return stats.value
  }

  const fetchRecentActivity = async (): Promise<ActivityItem[]> => {
    if (recentActivity.value.length > 0) return recentActivity.value
    await refreshActivity()
    return recentActivity.value
  }

  const fetchDueOrders = async (): Promise<Order[]> => {
    if (dueOrders.value.length > 0) return dueOrders.value
    await refreshDueOrders()
    return dueOrders.value
  }

  const _fetchClientGrowth = async (
    _period: ChartPeriod = chartPeriod.value
  ): Promise<ClientGrowthData | null> => {
    if (clientGrowth.value.labels.length > 0) return clientGrowth.value
    await refreshGrowth()
    return clientGrowth.value
  }

  // Watch for period changes and refresh growth data
  watch(chartPeriod, async () => {
    await refreshGrowth()
  })

  const setChartPeriod = (period: ChartPeriod) => {
    chartPeriod.value = period
  }
  const clearError = () => {
    error.value = null
  }

  // Refresh function
  const refreshDashboard = async () => {
    // Refresh all data by triggering refetch for each query
    await Promise.all([refreshStats(), refreshActivity(), refreshDueOrders(), refreshGrowth()])
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

    // Methods
    fetchDashboardData,
    fetchStats,
    fetchRecentActivity,
    fetchDueOrders,
    refreshDashboard,

    // Local State Actions
    setChartPeriod,
    clearError,
  }
}
