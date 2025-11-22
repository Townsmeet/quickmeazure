/**
 * Order related types
 */

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'delivered'
  | 'shipped'
  | 'draft'

export interface OrderItem {
  id?: number
  styleId: number
  quantity: number
  price: number
  measurements?: Record<string, any>
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export interface Order {
  id: string
  clientId: string
  styleId?: string
  orderNumber: string
  status: OrderStatus
  dueDate?: string
  totalAmount: number
  depositAmount?: number
  taxAmount?: number
  discountAmount?: number
  finalAmount: number
  notes?: string
  items: OrderItem[] | readonly OrderItem[] | readonly Readonly<OrderItem>[]
  measurements?: Record<string, any>
  shippingAddress?: Record<string, any>
  billingAddress?: Record<string, any>
  paymentStatus?: 'pending' | 'paid' | 'partially_paid' | 'refunded' | 'unpaid'
  paymentMethod?: string
  paymentReference?: string
  createdAt: string
  updatedAt?: string
  deletedAt?: string
  clientName?: string
  client?: Readonly<{
    id: string
    firstName: string
    lastName: string
    email?: string
    phone?: string
  }>
  style?: Readonly<{
    id: string
    name: string
    imageUrl?: string
  }>
}

export interface OrderFilterOptions {
  page?: number
  limit?: number
  status?: OrderStatus | OrderStatus[]
  clientId?: string
  styleId?: string
  search?: string
  sortBy?: 'newest' | 'oldest' | 'dueDate' | 'totalAmount' | 'status'
  dateFrom?: string
  dateTo?: string
}

export interface OrderStats {
  total: number
  totalRevenue: number
  averageOrderValue: number
  pendingOrders: number
  processingOrders: number
  completedOrders: number
  cancelledOrders: number
  byStatus: Array<{ status: OrderStatus; count: number; amount: number }>
  recentOrders: Order[]
}

export interface CreateOrderInput {
  clientId: string
  styleId?: string
  status: OrderStatus
  dueDate?: string
  totalAmount: number
  depositAmount?: number
  taxAmount?: number
  discountAmount?: number
  finalAmount: number
  notes?: string
  items: Omit<OrderItem, 'id' | 'createdAt' | 'updatedAt'>[]
  measurements?: Record<string, any>
  shippingAddress?: Record<string, any>
  billingAddress?: Record<string, any>
  paymentStatus?: 'pending' | 'paid' | 'partially_paid' | 'refunded' | 'unpaid'
  paymentMethod?: string
  paymentReference?: string
}

export interface UpdateOrderInput extends Partial<CreateOrderInput> {
  id: string
}

export interface OrderSummary {
  id: string
  orderNumber: string
  clientName: string
  status: OrderStatus
  dueDate: string
  totalAmount: number
  styleName?: string
  styleImage?: string
  itemCount: number
  createdAt: string
}
