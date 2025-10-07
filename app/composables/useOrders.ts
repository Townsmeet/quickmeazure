interface Order {
  id: number
  clientId: number
  styleId?: number
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  totalAmount: number
  paidAmount: number
  dueDate?: string
  notes?: string
  measurements?: Record<string, any>
  createdAt: string
  updatedAt: string
}

interface CreateOrderData {
  clientId: number
  styleId?: number
  totalAmount: number
  paidAmount?: number
  dueDate?: string
  notes?: string
  measurements?: Record<string, any>
}

interface OrderResponse {
  success: boolean
  data?: Order
  message?: string
}

interface OrdersResponse {
  success: boolean
  data?: Order[]
  message?: string
}

export const useOrders = () => {
  // State
  const orders = useState<Order[]>('orders', () => [])
  const currentOrder = useState<Order | null>('current_order', () => null)
  const error = useState<string | null>('orders_error', () => null)

  // Data fetching with useFetch
  const {
    data: ordersData,
    pending: isLoading,
    refresh: refreshOrders,
  } = useFetch<OrdersResponse>('/api/orders', {
    server: false,
    default: () => ({ success: false, data: [] }) as OrdersResponse,
    onResponse({ response }) {
      const responseData = response._data as OrdersResponse
      if (responseData?.success && responseData?.data) {
        orders.value = responseData.data
      }
    },
    onResponseError({ error: fetchError }) {
      error.value = fetchError?.message || 'Failed to fetch orders'
    },
  })

  // Fetch all orders (for compatibility)
  const fetchOrders = async (): Promise<Order[]> => {
    await refreshOrders()
    return orders.value
  }

  // Get order by ID (using useFetch)
  const getOrder = async (id: number): Promise<Order | null> => {
    error.value = null

    try {
      const { data } = await useFetch<OrderResponse>(`/api/orders/${id}`, {
        server: false,
        default: () => ({ success: false, data: null }) as OrderResponse,
      })

      const responseData = data.value as OrderResponse
      if (responseData?.success && responseData?.data) {
        currentOrder.value = responseData.data
        return responseData.data
      }

      return null
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch order'
      return null
    }
  }

  // Create order (mutation with $fetch)
  const createOrder = async (data: CreateOrderData): Promise<OrderResponse> => {
    error.value = null

    try {
      const response = await $fetch<OrderResponse>('/api/orders', {
        method: 'POST',
        body: data,
      })

      if (response.success && response.data) {
        orders.value.push(response.data)
        await refreshOrders()
      }

      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to create order'
      return {
        success: false,
        message: error.value || undefined,
      }
    }
  }

  // Update order
  const updateOrder = async (
    id: number,
    updates: Partial<CreateOrderData>
  ): Promise<OrderResponse> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<OrderResponse>(`/api/orders/${id}`, {
        method: 'PUT',
        body: updates,
      })

      if (response.success && response.data) {
        const index = orders.value.findIndex(o => o.id === id)
        if (index !== -1) {
          orders.value[index] = response.data
        }

        // Update current order if it's the one being edited
        if (currentOrder.value?.id === id) {
          currentOrder.value = response.data
        }
      }

      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to update order'
      return {
        success: false,
        message: error.value,
      }
    } finally {
      isLoading.value = false
    }
  }

  // Update order status
  const updateOrderStatus = async (id: number, status: Order['status']): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<OrderResponse>(`/api/orders/${id}/status`, {
        method: 'PUT',
        body: { status },
      })

      if (response.success && response.data) {
        const index = orders.value.findIndex(o => o.id === id)
        if (index !== -1) {
          orders.value[index] = response.data
        }

        // Update current order if it's the one being edited
        if (currentOrder.value?.id === id) {
          currentOrder.value = response.data
        }
      }

      return response.success
    } catch (err: any) {
      error.value = err.message || 'Failed to update order status'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Delete order
  const deleteOrder = async (id: number): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean }>(`/api/orders/${id}`, {
        method: 'DELETE',
      })

      if (response.success) {
        orders.value = orders.value.filter(o => o.id !== id)

        // Clear current order if it's the one being removed
        if (currentOrder.value?.id === id) {
          currentOrder.value = null
        }
      }

      return response.success
    } catch (err: any) {
      error.value = err.message || 'Failed to delete order'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Get orders by client (using useFetch)
  const getOrdersByClient = async (clientId: number): Promise<Order[]> => {
    error.value = null

    try {
      const { data } = await useFetch<OrdersResponse>(`/api/orders/client/${clientId}`, {
        server: false,
        default: () => ({ success: false, data: [] }) as OrdersResponse,
      })

      const responseData = data.value as OrdersResponse
      if (responseData?.success && responseData?.data) {
        return responseData.data
      }

      return []
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch client orders'
      return []
    }
  }

  // Local state management
  const setCurrentOrder = (order: Order | null) => {
    currentOrder.value = order
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    orders: readonly(orders),
    currentOrder: readonly(currentOrder),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // API Actions
    fetchOrders,
    getOrder,
    createOrder,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
    getOrdersByClient,

    // Refresh Actions
    refreshOrders,

    // Local State Actions
    setCurrentOrder,
    clearError,
  }
}
