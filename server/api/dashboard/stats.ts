import type { H3Event, EventHandlerRequest } from 'h3'
import { defineCachedEventHandler } from '#imports'
import { createError } from 'h3'
import { count, sql } from 'drizzle-orm'
import { db } from '../../utils/drizzle'
import * as tables from '../../database/schema'

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

export default defineCachedEventHandler(async (event: H3Event<EventHandlerRequest>) => {
  try {
    // Authentication check
    const auth = event.context.auth
    if (!auth?.userId) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized',
      })
    }

    const userId = auth.userId
    const now = new Date()

    // Calculate date ranges
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

      // 3. Active orders (using specific status values for better performance)
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
    const clientsRemaining = clientLimit > 0 ? Math.max(0, clientLimit - totalClients) : -1 // Unlimited

    // Return the combined stats
    return {
      totalClients,
      newClientsThisMonth,
      activeOrders,
      completedOrdersThisMonth,
      totalRevenue,
      revenueGrowth,
      subscriptionPlan,
      clientsRemaining: clientsRemaining < 0 ? Infinity : clientsRemaining,
    }
  } catch (error) {
    console.error('Error in dashboard stats endpoint:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch dashboard statistics',
    })
  }
})
