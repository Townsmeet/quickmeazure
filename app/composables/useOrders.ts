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
  const isLoading = useState<boolean>('orders_loading', () => false)
  const error = useState<string | null>('orders_error', () => null)

  // Fetch all orders
  const fetchOrders = async (): Promise<Order[]> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<OrdersResponse>('/api/orders', {
        method: 'GET',
      })

      if (response.success && response.data) {
        orders.value = response.data
        return response.data
      }

      return []
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch orders'
      return []
    } finally {
      isLoading.value = false
    }
  }

  // Get order by ID
  const getOrder = async (id: number): Promise<Order | null> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<OrderResponse>(`/api/orders/${id}`, {
        method: 'GET',
      })

      if (response.success && response.data) {
        currentOrder.value = response.data
        return response.data
      }

      return null
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch order'
      return null
    } finally {
      isLoading.value = false
    }
  }

  // Create order
  const createOrder = async (data: CreateOrderData): Promise<OrderResponse> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<OrderResponse>('/api/orders', {
        method: 'POST',
        body: data,
      })

      if (response.success && response.data) {
        orders.value.push(response.data)
      }

      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to create order'
      return {
        success: false,
        message: error.value,
      }
    } finally {
      isLoading.value = false
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

  // Get orders by client
  const getOrdersByClient = async (clientId: number): Promise<Order[]> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<OrdersResponse>(`/api/orders/client/${clientId}`, {
        method: 'GET',
      })

      if (response.success && response.data) {
        return response.data
      }

      return []
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch client orders'
      return []
    } finally {
      isLoading.value = false
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

    // Local State Actions
    setCurrentOrder,
    clearError,
  }
}
