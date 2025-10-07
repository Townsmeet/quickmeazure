import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useDashboardApi } from '~/composables/useDashboardApi'
import type {
  DashboardStats,
  ActivityItem,
  ClientGrowthData,
  ChartPeriod,
} from '../../types/dashboard'
import type { Order } from '../../types/order'

export const useDashboardStore = defineStore('dashboard', () => {
  // State
  const dashboardApi = useDashboardApi()
  const isLoading = ref(false)
  const stats = ref<DashboardStats | null>(null)
  const recentActivity = ref<ActivityItem[]>([])
  const dueOrders = ref<Order[]>([])
  const clientGrowth = ref<ClientGrowthData>({
    labels: [],
    data: [],
    totalGrowth: 0,
    percentGrowth: 0,
  })
  const error = ref<string | null>(null)
  const chartPeriod = ref<ChartPeriod>('30days')

  // Getters
  const hasChartData = computed(() => {
    return clientGrowth.value.labels.length > 0 && clientGrowth.value.data.length > 0
  })

  // Actions (simple state mutations)
  const setStats = (newStats: DashboardStats | null) => {
    stats.value = newStats
  }

  const setRecentActivity = (activities: ActivityItem[]) => {
    recentActivity.value = activities
  }

  const setDueOrders = (orders: Order[]) => {
    dueOrders.value = orders
  }

  const setClientGrowth = (growthData: ClientGrowthData) => {
    clientGrowth.value = growthData
  }

  const setChartPeriod = (period: ChartPeriod) => {
    chartPeriod.value = period
  }

  const setError = (err: string | null) => {
    error.value = err
  }

  // Reset store state
  const $reset = () => {
    stats.value = null
    recentActivity.value = []
    dueOrders.value = []
    clientGrowth.value = {
      labels: [],
      data: [],
      totalGrowth: 0,
      percentGrowth: 0,
    }
    isLoading.value = false
    error.value = null
  }

  return {
    // State
    stats,
    recentActivity,
    dueOrders,
    clientGrowth,
    error,
    chartPeriod,

    // Getters
    hasChartData,

    // Actions (state mutations)
    setStats,
    setRecentActivity,
    setDueOrders,
    setClientGrowth,
    setChartPeriod,
    setError,
    $reset,

    // Async actions
    async fetchClientGrowth(period: ChartPeriod) {
      try {
        isLoading.value = true
        error.value = null
        const response = await dashboardApi.getClientGrowth(period)
        const growthData = response.growthData
        setClientGrowth({
          labels: growthData.labels || [],
          data: growthData.data || [],
          totalGrowth: growthData.totalGrowth || 0,
          percentGrowth: growthData.percentGrowth || 0,
        })
        return growthData
      } catch (error) {
        console.error('Error in fetchClientGrowth:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch client growth data')
        // Return default empty data on error
        return {
          labels: [],
          data: [],
          totalGrowth: 0,
          percentGrowth: 0,
        }
      } finally {
        isLoading.value = false
      }
    },
  }
})
