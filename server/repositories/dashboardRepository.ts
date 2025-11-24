import { eq, and, or, count, sql, desc, lte, isNull } from 'drizzle-orm'
import { db } from '../utils/drizzle'
import * as tables from '../database/schema'

export interface DashboardStats {
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

export interface ActivityItem {
  id: string
  type: 'order' | 'client' | 'payment'
  title: string
  description: string
  timestamp: string
  metadata?: Record<string, any>
}

export interface ClientGrowthData {
  labels: string[]
  data: number[]
  totalGrowth: number
  percentGrowth: number
}

export interface DueOrder {
  id: number
  clientName: string
  status: string
  totalAmount: number
  dueDate?: string
  createdAt: string
}

type ChartPeriod = '7days' | '30days' | '90days' | '1year' | 'year'

// Helper function to safely extract count from query result
const getCount = (result: { count: number }[]): number => result[0]?.count || 0

// Helper function to get date range for a given month and year
const getMonthDateRange = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  return {
    firstDay,
    lastDay,
    firstDayStr: firstDay.toISOString(),
    lastDayStr: lastDay.toISOString(),
  }
}

/**
 * Get dashboard statistics for a user
 */
export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  // Get current and previous month date ranges
  const currentMonthRange = getMonthDateRange(currentYear, currentMonth)
  const prevMonthRange = getMonthDateRange(
    currentMonth === 0 ? currentYear - 1 : currentYear,
    currentMonth === 0 ? 11 : currentMonth - 1
  )

  // Execute all queries in parallel
  const [
    totalClientsResult,
    newClientsThisMonthResult,
    activeOrdersResult,
    completedOrdersThisMonthResult,
    currentMonthRevenueResult,
    prevMonthRevenueResult,
    subscriptionResult,
  ] = await Promise.all([
    // 1. Total clients count
    db.select({ count: count() }).from(tables.clients).where(eq(tables.clients.userId, userId)),

    // 2. New clients this month
    db
      .select({ count: count() })
      .from(tables.clients)
      .where(
        and(
          eq(tables.clients.userId, userId),
          sql`${tables.clients.createdAt} >= ${currentMonthRange.firstDayStr}`,
          sql`${tables.clients.createdAt} <= ${currentMonthRange.lastDayStr}`
        )
      ),

    // 3. Active orders
    db
      .select({ count: count() })
      .from(tables.orders)
      .innerJoin(tables.clients, eq(tables.orders.clientId, tables.clients.id))
      .where(
        and(
          eq(tables.clients.userId, userId),
          sql`${tables.orders.status} IN ('pending', 'in_progress', 'processing')`
        )
      ),

    // 4. Completed orders this month
    db
      .select({ count: count() })
      .from(tables.orders)
      .innerJoin(tables.clients, eq(tables.orders.clientId, tables.clients.id))
      .where(
        and(
          eq(tables.clients.userId, userId),
          sql`${tables.orders.status} = 'completed'`,
          sql`${tables.orders.updatedAt} >= ${currentMonthRange.firstDayStr}`,
          sql`${tables.orders.updatedAt} <= ${currentMonthRange.lastDayStr}`
        )
      ),

    // 5. Current month revenue
    db
      .select({
        total: sql<number>`COALESCE(SUM(${tables.payments.amount}), 0)`,
      })
      .from(tables.payments)
      .innerJoin(tables.orders, eq(tables.payments.orderId, tables.orders.id))
      .innerJoin(tables.clients, eq(tables.orders.clientId, tables.clients.id))
      .where(
        and(
          eq(tables.clients.userId, userId),
          sql`${tables.payments.paymentDate} >= ${currentMonthRange.firstDayStr}`,
          sql`${tables.payments.paymentDate} <= ${currentMonthRange.lastDayStr}`
        )
      ),

    // 6. Previous month revenue
    db
      .select({
        total: sql<number>`COALESCE(SUM(${tables.payments.amount}), 0)`,
      })
      .from(tables.payments)
      .innerJoin(tables.orders, eq(tables.payments.orderId, tables.orders.id))
      .innerJoin(tables.clients, eq(tables.orders.clientId, tables.clients.id))
      .where(
        and(
          eq(tables.clients.userId, userId),
          sql`${tables.payments.paymentDate} >= ${prevMonthRange.firstDayStr}`,
          sql`${tables.payments.paymentDate} <= ${prevMonthRange.lastDayStr}`
        )
      ),

    // 7. Subscription info
    db
      .select({
        name: tables.plans.name,
        maxClients: tables.plans.maxClients,
        status: tables.subscriptions.status,
        endDate: tables.subscriptions.endDate,
      })
      .from(tables.subscriptions)
      .innerJoin(tables.plans, eq(tables.subscriptions.planId, tables.plans.id))
      .where(
        and(eq(tables.subscriptions.userId, userId), eq(tables.subscriptions.status, 'active'))
      )
      .orderBy(desc(tables.subscriptions.createdAt))
      .limit(1),
  ])

  // Extract results
  const totalClients = getCount(totalClientsResult)
  const newClientsThisMonth = getCount(newClientsThisMonthResult)
  const activeOrders = getCount(activeOrdersResult)
  const completedOrdersThisMonth = getCount(completedOrdersThisMonthResult)
  const totalRevenue = currentMonthRevenueResult[0]?.total || 0
  const prevMonthRevenue = prevMonthRevenueResult[0]?.total || 0

  // Calculate revenue growth
  let revenueGrowth = 0
  if (prevMonthRevenue > 0) {
    revenueGrowth = Math.round(((totalRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
  } else if (totalRevenue > 0) {
    revenueGrowth = 100
  }

  // Process subscription info
  let subscriptionPlan = 'Free Plan'
  let clientLimit = 100 // Default for free plan

  if (subscriptionResult.length > 0) {
    const subscription = subscriptionResult[0]
    const isExpired = subscription.endDate ? new Date(subscription.endDate) < now : false

    if (subscription.status === 'active' && !isExpired) {
      subscriptionPlan = subscription.name
      clientLimit = subscription.maxClients || 0
    }
  }

  // Calculate clients remaining
  const clientsRemaining = clientLimit > 0 ? Math.max(0, clientLimit - totalClients) : -1

  return {
    totalClients,
    newClientsThisMonth,
    totalOrders: 0, // Will be calculated if needed
    activeOrders,
    pendingOrders: 0, // Will be calculated if needed
    completedOrders: 0, // Will be calculated if needed
    completedOrdersThisMonth,
    totalRevenue,
    monthlyRevenue: totalRevenue,
    monthlyGrowth: 0, // Will be calculated if needed
    revenueGrowth,
    subscriptionPlan,
    clientsRemaining: clientsRemaining < 0 ? null : clientsRemaining,
  }
}

/**
 * Get recent activity for a user
 */
export async function getRecentActivity(
  userId: string,
  limit: number = 10
): Promise<ActivityItem[]> {
  const activities: ActivityItem[] = []

  // Get recent clients
  const recentClients = await db
    .select({
      id: tables.clients.id,
      name: tables.clients.name,
      createdAt: tables.clients.createdAt,
    })
    .from(tables.clients)
    .where(eq(tables.clients.userId, userId))
    .orderBy(desc(tables.clients.createdAt))
    .limit(5)

  // Add client activities
  recentClients.forEach(client => {
    activities.push({
      id: `client-${client.id}`,
      type: 'client',
      title: 'New client added',
      description: `Added ${client.name}`,
      timestamp: client.createdAt?.toISOString() || new Date().toISOString(),
      metadata: { clientId: client.id.toString(), clientName: client.name },
    })
  })

  // Get recent orders
  const recentOrders = await db
    .select({
      id: tables.orders.id,
      status: tables.orders.status,
      createdAt: tables.orders.createdAt,
      updatedAt: tables.orders.updatedAt,
      clientName: tables.clients.name,
      clientId: tables.clients.id,
    })
    .from(tables.orders)
    .innerJoin(tables.clients, eq(tables.orders.clientId, tables.clients.id))
    .where(eq(tables.clients.userId, userId))
    .orderBy(desc(tables.orders.createdAt))
    .limit(5)

  // Add order activities
  recentOrders.forEach(order => {
    const isCompleted = order.status === 'completed'
    const timestamp = isCompleted && order.updatedAt ? order.updatedAt : order.createdAt

    activities.push({
      id: `order-${order.id}`,
      type: 'order',
      title: isCompleted ? 'Order completed' : 'New order created',
      description: isCompleted
        ? `Completed order for ${order.clientName}`
        : `New order created for ${order.clientName}`,
      timestamp: timestamp?.toISOString() || new Date().toISOString(),
      metadata: {
        orderId: order.id.toString(),
        clientId: order.clientId.toString(),
        clientName: order.clientName,
        status: order.status,
      },
    })
  })

  // Get recent payments
  const recentPayments = await db
    .select({
      id: tables.payments.id,
      amount: tables.payments.amount,
      paymentDate: tables.payments.paymentDate,
      orderId: tables.payments.orderId,
      clientName: tables.clients.name,
    })
    .from(tables.payments)
    .innerJoin(tables.orders, eq(tables.payments.orderId, tables.orders.id))
    .innerJoin(tables.clients, eq(tables.orders.clientId, tables.clients.id))
    .where(eq(tables.clients.userId, userId))
    .orderBy(desc(tables.payments.paymentDate))
    .limit(5)

  // Add payment activities
  recentPayments.forEach(payment => {
    activities.push({
      id: `payment-${payment.id}`,
      type: 'payment',
      title: 'Payment received',
      description: `Received ₦${payment.amount} from ${payment.clientName}`,
      timestamp: payment.paymentDate?.toISOString() || new Date().toISOString(),
      metadata: {
        paymentId: payment.id.toString(),
        orderId: payment.orderId?.toString() || 'unknown',
        amount: payment.amount,
        clientName: payment.clientName,
      },
    })
  })

  // Sort all activities by timestamp and limit
  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)
}

/**
 * Get orders due soon for a user
 */
export async function getOrdersDueSoon(userId: string, limit: number = 10): Promise<DueOrder[]> {
  const today = new Date()
  const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  const formattedDate = sevenDaysLater.toISOString()

  const dueOrders = await db
    .select({
      id: tables.orders.id,
      dueDate: tables.orders.dueDate,
      totalAmount: tables.orders.totalAmount,
      status: tables.orders.status,
      clientName: tables.clients.name,
      createdAt: tables.orders.createdAt,
    })
    .from(tables.orders)
    .innerJoin(tables.clients, eq(tables.orders.clientId, tables.clients.id))
    .where(
      and(
        eq(tables.clients.userId, userId),
        or(
          eq(tables.orders.status, 'pending'),
          eq(tables.orders.status, 'in_progress'),
          eq(tables.orders.status, 'processing')
        ),
        or(isNull(tables.orders.dueDate), lte(tables.orders.dueDate, formattedDate))
      )
    )
    .orderBy(tables.orders.dueDate)
    .limit(limit)

  return dueOrders.map(order => ({
    id: order.id,
    clientName: order.clientName,
    status: order.status,
    totalAmount: order.totalAmount || 0,
    dueDate: order.dueDate || undefined,
    createdAt: order.createdAt?.toISOString() || new Date().toISOString(),
  }))
}

/**
 * Get client growth data for a user
 */
export async function getClientGrowth(
  userId: string,
  period: ChartPeriod = '30days'
): Promise<ClientGrowthData> {
  const now = new Date()
  let startDate: Date
  const labels: string[] = []

  // Calculate date ranges and labels based on period
  switch (period) {
    case '7days':
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 7)
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(now.getDate() - i)
        labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
      }
      break

    case '30days':
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 30)
      for (let i = 4; i >= 0; i--) {
        labels.push(`Week ${5 - i}`)
      }
      break

    case '90days':
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 90)
      for (let i = 2; i >= 0; i--) {
        const d = new Date(now)
        d.setMonth(now.getMonth() - i)
        labels.push(d.toLocaleDateString('en-US', { month: 'short' }))
      }
      break

    case 'year':
    case '1year':
      startDate = new Date(now)
      startDate.setFullYear(now.getFullYear() - 1)
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now)
        d.setMonth(now.getMonth() - i)
        labels.push(d.toLocaleDateString('en-US', { month: 'short' }))
      }
      break

    default:
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 30)
      for (let i = 4; i >= 0; i--) {
        labels.push(`Week ${5 - i}`)
      }
  }

  const startDateTimestamp = Math.floor(startDate.getTime() / 1000)
  const nowTimestamp = Math.floor(now.getTime() / 1000)

  // Get all clients in the date range and process in JavaScript
  const clientsInPeriod = await db
    .select({
      id: tables.clients.id,
      createdAt: tables.clients.createdAt,
    })
    .from(tables.clients)
    .where(
      and(
        eq(tables.clients.userId, userId),
        sql`${tables.clients.createdAt} >= ${startDateTimestamp}`,
        sql`${tables.clients.createdAt} <= ${nowTimestamp}`
      )
    )
    .orderBy(tables.clients.createdAt)

  // Group clients by date in JavaScript
  const clientGrowthData: { date: string; count: number }[] = []
  const dateGroups: Record<string, number> = {}

  clientsInPeriod.forEach(client => {
    if (client.createdAt) {
      const dateKey = client.createdAt.toISOString().split('T')[0] // YYYY-MM-DD format
      dateGroups[dateKey] = (dateGroups[dateKey] || 0) + 1
    }
  })

  // Convert to array format
  Object.entries(dateGroups).forEach(([date, count]) => {
    clientGrowthData.push({ date, count })
  })

  // Calculate total clients before the period for growth calculation
  const totalPreviousResult = await db
    .select({ count: count() })
    .from(tables.clients)
    .where(
      and(
        eq(tables.clients.userId, userId),
        sql`${tables.clients.createdAt} < ${startDateTimestamp}`
      )
    )

  const totalPrevious = totalPreviousResult[0]?.count || 0
  const totalCurrentPeriod = clientGrowthData.reduce((sum, item) => sum + item.count, 0)

  // Calculate percentage growth
  let percentGrowth = 0
  if (totalPrevious > 0) {
    percentGrowth = Math.round((totalCurrentPeriod / totalPrevious) * 100)
  } else if (totalCurrentPeriod > 0) {
    percentGrowth = 100
  }

  // Format data based on period
  let formattedData: number[] = []

  if (period === '7days') {
    formattedData = new Array(7).fill(0)
    clientGrowthData.forEach(item => {
      if (!item.date) return
      try {
        const date = new Date(item.date)
        // Use date-only comparison to avoid timezone issues
        const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const clientDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
        const dayIndex =
          6 - Math.floor((nowDate.getTime() - clientDate.getTime()) / (1000 * 60 * 60 * 24))
        if (dayIndex >= 0 && dayIndex < 7) {
          formattedData[dayIndex] = item.count
        }
      } catch (error) {
        console.error('Error processing date:', item.date, error)
      }
    })
  } else if (period === '30days') {
    formattedData = new Array(5).fill(0)
    clientGrowthData.forEach(item => {
      if (!item.date) return
      try {
        const date = new Date(item.date)
        // Use date-only comparison to avoid timezone issues
        const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const clientDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
        const dayDiff = Math.floor(
          (nowDate.getTime() - clientDate.getTime()) / (1000 * 60 * 60 * 24)
        )
        if (dayDiff >= 0 && dayDiff <= 30) {
          const weekIndex = Math.min(4, Math.floor(dayDiff / 7))
          formattedData[4 - weekIndex] += item.count
        }
      } catch (error) {
        console.error('Error processing date:', item.date, error)
      }
    })
  } else if (period === '90days') {
    formattedData = new Array(3).fill(0)
    clientGrowthData.forEach(item => {
      if (!item.date) return
      try {
        const date = new Date(item.date)
        // Use consistent date comparison
        const nowDate = new Date(now.getFullYear(), now.getMonth(), 1)
        const clientDate = new Date(date.getFullYear(), date.getMonth(), 1)
        const monthsDiff =
          nowDate.getMonth() -
          clientDate.getMonth() +
          12 * (nowDate.getFullYear() - clientDate.getFullYear())
        if (monthsDiff >= 0 && monthsDiff < 3) {
          formattedData[2 - monthsDiff] += item.count
        }
      } catch (error) {
        console.error('Error processing date:', item.date, error)
      }
    })
  } else if (period === 'year' || period === '1year') {
    formattedData = new Array(12).fill(0)
    clientGrowthData.forEach(item => {
      if (!item.date) return
      try {
        const date = new Date(item.date)
        // Use consistent date comparison
        const nowDate = new Date(now.getFullYear(), now.getMonth(), 1)
        const clientDate = new Date(date.getFullYear(), date.getMonth(), 1)
        const monthsDiff =
          nowDate.getMonth() -
          clientDate.getMonth() +
          12 * (nowDate.getFullYear() - clientDate.getFullYear())
        if (monthsDiff >= 0 && monthsDiff < 12) {
          formattedData[11 - monthsDiff] += item.count
        }
      } catch (error) {
        console.error('Error processing date:', item.date, error)
      }
    })
  }

  return {
    labels,
    data: formattedData,
    totalGrowth: totalCurrentPeriod,
    percentGrowth,
  }
}
