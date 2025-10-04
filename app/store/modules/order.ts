import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Order, OrderFilterOptions, OrderStats, OrderStatus } from '../../types/order'

export const useOrderStore = defineStore('order', () => {
  // State
  const orders = ref<Order[]>([])
  const currentOrder = ref<Order | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const totalCount = ref(0)
  const stats = ref<OrderStats | null>(null)
  const filters = ref<OrderFilterOptions>({
    page: 1,
    limit: 20,
    status: '',
    search: '',
    sortBy: 'newest',
  })

  // Getters
  const hasMore = computed(() => orders.value.length < totalCount.value)
  const pendingOrders = computed(() => orders.value.filter(order => order.status === 'pending'))
  const completedOrders = computed(() => orders.value.filter(order => order.status === 'completed'))
  const recentOrders = computed(() =>
    [...orders.value]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  )

  // Mutations
  const setOrders = (newOrders: Order[]) => {
    orders.value = newOrders
  }

  const setCurrentOrder = (order: Order | null) => {
    currentOrder.value = order
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const setError = (errorMessage: string | null) => {
    error.value = errorMessage
  }

  const setTotalCount = (count: number) => {
    totalCount.value = count
  }

  const setStats = (newStats: OrderStats | null) => {
    stats.value = newStats
  }

  const updateFilters = (newFilters: Partial<OrderFilterOptions>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const resetFilters = () => {
    filters.value = {
      page: 1,
      limit: 20,
      status: '',
      search: '',
      sortBy: 'newest',
    }
  }

  const addOrder = (order: Order) => {
    orders.value.unshift(order)
    totalCount.value += 1
  }

  const updateOrderInList = (updatedOrder: Order) => {
    const index = orders.value.findIndex(o => o.id === updatedOrder.id)
    if (index !== -1) {
      orders.value[index] = updatedOrder
    }
    if (currentOrder.value?.id === updatedOrder.id) {
      currentOrder.value = updatedOrder
    }
  }

  const removeOrder = (orderId: string) => {
    const index = orders.value.findIndex(o => o.id === orderId)
    if (index !== -1) {
      orders.value.splice(index, 1)
      totalCount.value -= 1
    }
    if (currentOrder.value?.id === orderId) {
      currentOrder.value = null
    }
  }

  const $reset = () => {
    orders.value = []
    currentOrder.value = null
    isLoading.value = false
    error.value = null
    totalCount.value = 0
    stats.value = null
    resetFilters()
  }

  // Actions
  const fetchOrders = async (options?: Partial<OrderFilterOptions>) => {
    try {
      setLoading(true)
      setError(null)

      // Merge provided options with current filters
      const queryParams = { ...filters.value, ...options }

      // Update filters with new options
      updateFilters(queryParams)

      // In a real implementation, you would call your API here
      // const response = await $api.get(API_ENDPOINTS.ORDERS.INDEX, { params: queryParams })
      // setOrders(response.data.orders)
      // setTotalCount(response.data.total)

      // For now, we'll just return an empty array
      setOrders([])
      setTotalCount(0)

      return { success: true, data: [], total: 0 }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch orders'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return {
    // State
    orders,
    currentOrder,
    isLoading,
    error,
    totalCount,
    stats,
    filters,

    // Getters
    hasMore,
    pendingOrders,
    completedOrders,
    recentOrders,
    // Actions
    fetchOrders,
    setOrders,
    setCurrentOrder,
    setLoading,
    setError,
    setTotalCount,
    setStats,
    updateFilters,
    resetFilters,
    addOrder,
    updateOrderInList,
    removeOrder,
    $reset,
  }
})
