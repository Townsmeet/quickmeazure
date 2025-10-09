import type { H3Event, EventHandlerRequest } from 'h3'
import { createError } from 'h3'
import { db } from '../../utils/drizzle'
import * as tables from '../../database/schema'

interface Order {
  id: number
  client: string
  dueDate: Date | string | null
  amount: number
  status: string
}

export default defineCachedEventHandler(async (event: H3Event<EventHandlerRequest>) => {
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

    // Get today's date and format for SQL
    const today = new Date()
    const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const formattedDate = sevenDaysLater.toISOString().split('T')[0] // Format as YYYY-MM-DD

    // Get orders due within the next 7 days with active statuses (Pending or In Progress)
    const dueOrders = await db
      .select({
        id: tables.orders.id,
        dueDate: tables.orders.dueDate,
        totalAmount: tables.orders.totalAmount,
        status: tables.orders.status,
        clientName: tables.clients.name,
        clientId: tables.clients.id,
      })
      .from(tables.orders)
      .innerJoin(tables.clients, eq(tables.orders.clientId, tables.clients.id))
      .where(
        and(
          eq(tables.clients.userId, userId),
          sql`(${tables.orders.status} ILIKE '%pending%' OR ${tables.orders.status} ILIKE '%progress%')`,
          sql`(${tables.orders.dueDate} IS NULL OR ${tables.orders.dueDate} <= ${formattedDate})`
        )
      )
      .orderBy(tables.orders.dueDate)
      .limit(10)

    // Format orders for the dashboard
    const formattedOrders: Order[] = dueOrders.map(order => ({
      id: order.id,
      client: order.clientName,
      dueDate: order.dueDate,
      amount: order.totalAmount || 0,
      status: order.status,
    }))

    return {
      success: true,
      data: formattedOrders,
    }
  } catch (error: any) {
    console.error('Dashboard orders due soon API error:', error)
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Failed to fetch orders due soon',
      message: 'Failed to fetch orders due soon',
    }
  }
})
