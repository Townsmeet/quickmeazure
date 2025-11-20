import type { Order, CreateOrderInput, OrderStatus } from '~/types/order'

type CreateOrderData = Omit<CreateOrderInput, 'id' | 'createdAt' | 'updatedAt'>

interface OrderResponse {
  success: boolean
  data?: Order | null
  message?: string
}

interface BackendOrder {
  id: number
  clientId: number
  dueDate?: string
  totalAmount: number
  status: string
  description?: string | null
  details?: {
    styleId?: number | null
    measurementId?: number | null
    depositAmount?: number
    balanceAmount?: number
    notes?: string
  }
  createdAt: number // Unix timestamp
  updatedAt?: number
  clientName?: string
  styleName?: string | null
  styleImageUrl?: string | null
}

interface OrdersResponse {
  success: boolean
  data?: BackendOrder[]
  message?: string
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Helper function to convert backend order to frontend Order type
const convertBackendOrder = (backendOrder: BackendOrder): Order => {
  if (!backendOrder) {
    throw new Error('Backend order is required')
  }
  const description = backendOrder.description || backendOrder.details?.notes || undefined
  return {
    id: String(backendOrder.id),
    clientId: String(backendOrder.clientId),
    styleId: backendOrder.details?.styleId ? String(backendOrder.details.styleId) : undefined,
    orderNumber: `ORD-${String(backendOrder.id).padStart(6, '0')}`, // Generate order number from ID
    status: backendOrder.status.toLowerCase() as OrderStatus,
    dueDate: backendOrder.dueDate,
    totalAmount: backendOrder.totalAmount,
    taxAmount: 0,
    discountAmount: 0,
    finalAmount: backendOrder.totalAmount, // Use totalAmount as finalAmount
    notes: description || '',
    items: [], // Empty items array since backend doesn't provide this yet
    measurements: {},
    shippingAddress: {},
    billingAddress: {},
    paymentStatus: 'pending', // Default payment status
    paymentMethod: undefined,
    paymentReference: undefined,
    createdAt: String(backendOrder.createdAt), // Convert Unix timestamp to string
    updatedAt: backendOrder.updatedAt ? String(backendOrder.updatedAt) : undefined,
    deletedAt: undefined,
    clientName: backendOrder.clientName,
    client: backendOrder.clientName
      ? {
          id: String(backendOrder.clientId),
          firstName: backendOrder.clientName.split(' ')[0] || '',
          lastName: backendOrder.clientName.split(' ').slice(1).join(' ') || '',
          email: undefined,
          phone: undefined,
        }
      : undefined,
    style: backendOrder.styleName
      ? {
          id: backendOrder.details?.styleId ? String(backendOrder.details.styleId) : '0',
          name: backendOrder.styleName || '',
          imageUrl: backendOrder.styleImageUrl || undefined,
        }
      : undefined,
  }
}

export const useOrders = () => {
  // State
  const orders = useState<Order[]>('orders', () => [])
  const currentOrder = useState<Order | null>('current_order', () => null)
  const error = useState<string | null>('orders_error', () => null)

  // Data fetching with useFetch — use `pending` so loading state is accurate
  // Remove unused ordersData since we're using the orders state
  const {
    data: ordersData,
    pending: isLoading,
    refresh: refreshOrders,
  } = useFetch<OrdersResponse>('/api/orders', {
    server: false,
    default: () => ({ success: false, data: [] }),
    onResponse({ response }) {
      const responseData = response._data as OrdersResponse
      if (responseData?.success && responseData?.data) {
        // Convert backend orders to frontend format, filtering out any null values
        orders.value = responseData.data
          .map(convertBackendOrder)
          .filter((order): order is Order => order !== null)
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

  // Fetch a single order by ID
  const fetchOrder = async (id: string): Promise<Order | null> => {
    error.value = null

    try {
      const { data } = await useFetch<OrderResponse>(`/api/orders/${id}`, {
        server: false,
        default: () => ({ success: false, data: null }) as OrderResponse,
      })

      const responseData = data.value as OrderResponse
      if (responseData?.success && responseData?.data) {
        // Convert and set the order
        const order = responseData.data
        if (!order) {
          throw new Error('No order data received')
        }
        const convertedOrder = convertBackendOrder(order)
        currentOrder.value = convertedOrder
        return convertedOrder
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
    id: string,
    data: Partial<CreateOrderData>
  ): Promise<OrderResponse> => {
    error.value = null

    try {
      const response = await $fetch<OrderResponse>(`/api/orders/${id}`, {
        method: 'PUT',
        body: data,
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
    }
  }

  // Update order status
  const updateOrderStatus = async (id: string, status: OrderStatus): Promise<boolean> => {
    error.value = null
    try {
      const order = orders.value.find(o => o.id === id)
      if (order) {
        order.status = status
        order.updatedAt = new Date().toISOString()
      }
      return true
    } catch (err: any) {
      error.value = err.message || 'Failed to update order status'
      return false
    }
  }

  // Delete order
  const deleteOrder = async (id: string): Promise<boolean> => {
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
    }
  }

  // Get orders by client ID
  const getClientOrders = async (clientId: string): Promise<Order[]> => {
    error.value = null

    try {
      const { data } = await useFetch<OrdersResponse>(`/api/orders/client/${clientId}`, {
        server: false,
        default: () => ({ success: false, data: [] }) as OrdersResponse,
      })

      const responseData = data.value as OrdersResponse
      if (responseData?.success && responseData?.data) {
        // Convert backend orders to frontend format
        return responseData.data.map(convertBackendOrder)
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

  // Define the missing functions
  const getOrder = async (id: string): Promise<Order | null> => {
    return fetchOrder(id)
  }

  const getOrdersByClient = async (clientId: string): Promise<Order[]> => {
    return getClientOrders(clientId)
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
