import { eq, sql, desc, or, between, and } from 'drizzle-orm'
import { db } from '../../utils/drizzle'
import * as tables from '../../database/schema'

interface ActivityItem {
  id: number
  type: string // 'client', 'order', 'payment', 'measurement'
  action: string // 'created', 'updated', 'completed', etc.
  entity: string // Entity name (client name, order ID, etc.)
  message: string
  time: string
  timestamp: string // ISO date string for sorting
  icon: string
  metadata?: Record<string, any>
}

// Map activity types to icons
const activityIcons: Record<string, Record<string, string>> = {
  client: {
    created: 'i-heroicons-user-plus',
    updated: 'i-heroicons-user',
  },
  measurement: {
    created: 'i-heroicons-variable',
    updated: 'i-heroicons-variable',
  },
  order: {
    created: 'i-heroicons-shopping-bag',
    updated: 'i-heroicons-shopping-bag',
    completed: 'i-heroicons-check-circle',
  },
  payment: {
    created: 'i-heroicons-currency-dollar',
    received: 'i-heroicons-currency-dollar',
  },
}

// Helper function to format relative time
const getRelativeTime = (date: Date): string => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffDay > 30) {
    return new Date(date).toLocaleDateString()
  } else if (diffDay > 0) {
    return diffDay === 1 ? 'Yesterday' : `${diffDay} days ago`
  } else if (diffHour > 0) {
    return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`
  } else if (diffMin > 0) {
    return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`
  } else {
    return 'Just now'
  }
}

export default defineEventHandler(async (event: H3Event<EventHandlerRequest>) => {
  try {
    // Get authenticated user from event context
    const auth = event.context.auth
    if (!auth || !auth.userId) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized',
      })
    }

    const userId = auth.userId

    // Parse query parameters
    const query = getQuery(event)
    const page = parseInt((query.page as string) || '1')
    const perPage = parseInt((query.per_page as string) || '10')
    const activityType = (query.type as string) || null
    const startDate = query.start_date ? new Date(query.start_date as string) : null
    const endDate = query.end_date ? new Date(query.end_date as string) : null

    // Calculate offset for pagination
    const offset = (page - 1) * perPage

    // db is already imported

    // User ID for filtering
    // We'll use this in each individual query

    if (activityType) {
      // We'll handle this later in the code since we're combining data from multiple tables
    }

    if (startDate && endDate) {
      // We'll handle date filtering in each query
    }

    // Get recent clients (created or updated)
    const clientWhereConditions = [eq(tables.clients.userId, userId)]
    if (startDate && endDate) {
      clientWhereConditions.push(between(tables.clients.createdAt, startDate, endDate))
    }

    const recentClients = await db
      .select({
        id: tables.clients.id,
        name: tables.clients.name,
        createdAt: tables.clients.createdAt,
        action: sql<string>`'created'`,
      })
      .from(tables.clients)
      .where(and(...clientWhereConditions))
      .orderBy(desc(tables.clients.createdAt))
      .limit(perPage)

    // Get recent orders
    const orderWhereConditions = [eq(tables.clients.userId, userId)]
    if (startDate && endDate) {
      orderWhereConditions.push(
        or(
          between(tables.orders.createdAt, startDate, endDate),
          between(tables.orders.updatedAt, startDate, endDate)
        )
      )
    }

    const recentOrders = await db
      .select({
        id: tables.orders.id,
        clientId: tables.orders.clientId,
        status: tables.orders.status,
        createdAt: tables.orders.createdAt,
        updatedAt: tables.orders.updatedAt,
        clientName: tables.clients.name,
      })
      .from(tables.orders)
      .innerJoin(tables.clients, eq(tables.orders.clientId, tables.clients.id))
      .where(and(...orderWhereConditions))
      .orderBy(desc(tables.orders.updatedAt))
      .limit(perPage)

    // Get recent payments
    const paymentWhereConditions = [eq(tables.clients.userId, userId)]
    if (startDate && endDate) {
      paymentWhereConditions.push(between(tables.payments.paymentDate, startDate, endDate))
    }

    const recentPayments = await db
      .select({
        id: tables.payments.id,
        orderId: tables.payments.orderId,
        amount: tables.payments.amount,
        paymentDate: tables.payments.paymentDate,
        clientName: tables.clients.name,
      })
      .from(tables.payments)
      .innerJoin(tables.orders, eq(tables.payments.orderId, tables.orders.id))
      .innerJoin(tables.clients, eq(tables.orders.clientId, tables.clients.id))
      .where(and(...paymentWhereConditions))
      .orderBy(desc(tables.payments.paymentDate))
      .limit(perPage)

    // Get recent measurements
    const measurementWhereConditions = [eq(tables.clients.userId, userId)]
    if (startDate && endDate) {
      measurementWhereConditions.push(between(tables.measurements.updatedAt, startDate, endDate))
    }

    const recentMeasurements = await db
      .select({
        id: tables.measurements.id,
        clientId: tables.measurements.clientId,
        lastUpdated: tables.measurements.updatedAt,
        clientName: tables.clients.name,
      })
      .from(tables.measurements)
      .innerJoin(tables.clients, eq(tables.measurements.clientId, tables.clients.id))
      .where(and(...measurementWhereConditions))
      .orderBy(desc(tables.measurements.updatedAt))
      .limit(perPage)

    // Now combine and format all activities
    let activities: ActivityItem[] = [
      // Format client activities
      ...recentClients
        .filter(client => client && client.id && client.name)
        .map(client => ({
          id: client.id,
          type: 'client',
          action: 'created',
          entity: client.name || 'Unknown',
          message: `Added new client <strong>${client.name || 'Unknown'}</strong>`,
          time: getRelativeTime(new Date(client.createdAt || new Date())),
          timestamp: new Date(client.createdAt || new Date()).toISOString(),
          icon: activityIcons.client.created,
        })),

      // Format order activities
      ...recentOrders
        .filter(order => order && order.id && order.clientName)
        .map(order => {
          const isCompleted = order.status === 'Completed'
          const timestamp = isCompleted
            ? order.updatedAt || order.createdAt || new Date()
            : order.createdAt || new Date()

          return {
            id: order.id,
            type: 'order',
            action: isCompleted ? 'completed' : 'created',
            entity: `Order #${order.id}`,
            message: isCompleted
              ? `Completed order for <strong>${order.clientName || 'Unknown'}</strong>`
              : `New order created for <strong>${order.clientName || 'Unknown'}</strong>`,
            time: getRelativeTime(new Date(timestamp)),
            timestamp: new Date(timestamp).toISOString(),
            icon: activityIcons.order[isCompleted ? 'completed' : 'created'],
          }
        }),

      // Format payment activities
      ...recentPayments
        .filter(payment => payment && payment.id && payment.amount != null && payment.clientName)
        .map(payment => ({
          id: payment.id,
          type: 'payment',
          action: 'received',
          entity: `Payment for Order #${payment.orderId || 'N/A'}`,
          message: `Received payment of <strong>₦${(payment.amount || 0).toLocaleString()}</strong> from <strong>${payment.clientName || 'Unknown'}</strong>`,
          time: getRelativeTime(new Date(payment.paymentDate || new Date())),
          timestamp: new Date(payment.paymentDate || new Date()).toISOString(),
          icon: activityIcons.payment.received,
        })),

      // Format measurement activities
      ...recentMeasurements
        .filter(measurement => measurement && measurement.id && measurement.clientName)
        .map(measurement => {
          const lastUpdated = measurement.lastUpdated || new Date()
          return {
            id: measurement.id,
            type: 'measurement',
            action: 'updated',
            entity: measurement.clientName || 'Unknown',
            message: `Updated measurements for <strong>${measurement.clientName || 'Unknown'}</strong>`,
            time: getRelativeTime(new Date(lastUpdated)),
            timestamp: new Date(lastUpdated).toISOString(),
            icon: activityIcons.measurement.updated,
          }
        }),
    ]

    // Filter by activity type if specified
    if (activityType) {
      activities = activities.filter(activity => activity.type === activityType)
    }

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })

    // Count total activities for pagination
    const total = activities.length

    // Apply pagination
    const paginatedActivities = activities.slice(offset, offset + perPage)

    // Calculate total pages
    const totalPages = Math.ceil(total / perPage)

    // Return the paginated activities with metadata
    return {
      success: true,
      data: paginatedActivities,
      total,
      page,
      totalPages,
    }
  } catch (error: any) {
    console.error('Activity API error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch activity data',
      message: error.message || 'Failed to fetch activity data',
    }
  }
})
