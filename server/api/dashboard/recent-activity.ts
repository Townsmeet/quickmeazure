import type { H3Event, EventHandlerRequest } from 'h3'
import { defineCachedEventHandler } from '#imports'
import { createError } from 'h3'
import { db } from '../../utils/drizzle'
import * as tables from '../../database/schema'

interface ActivityItem {
  id: number
  type: string // 'client', 'order', 'payment', 'measurement'
  action: string // 'created', 'updated', 'completed', etc.
  entity: string // Entity name (client name, order ID, etc.)
  message: string
  time: string
  icon: string
  metadata?: Record<string, unknown>
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
    const limit = parseInt((event.context.query?.limit as string) || '10')

    // Combined query using UNION ALL for better performance
    const activitiesQuery = db.$with('combined_activities').as(
      db
        // Client activities
        .select({
          id: tables.clients.id,
          type: sql<string>`'client'::text`.as('type'),
          action: sql<string>`'created'::text`.as('action'),
          entity: tables.clients.name,
          message: sql<string>`'Added new client ' || ${tables.clients.name}::text`.as('message'),
          timestamp: tables.clients.createdAt,
          icon: sql<string>`${activityIcons.client.created}::text`.as('icon'),
          metadata: sql<
            Record<string, unknown>
          >`jsonb_build_object('clientId', ${tables.clients.id}::text)::jsonb`.as('metadata'),
          sort_order: sql<number>`1::integer`.as('sort_order'),
        })
        .from(tables.clients)
        .where(eq(tables.clients.userId, userId))

        // Union with order activities
        .unionAll(
          db
            .select({
              id: tables.orders.id,
              type: sql<string>`'order'::text`.as('type'),
              action: sql<string>`CASE 
                WHEN ${tables.orders.status} = 'completed'::text THEN 'completed'::text 
                ELSE 'created'::text 
              END`.as('action'),
              entity: sql<string>`'Order #' || ${tables.orders.id}::text`,
              message: sql<string>`CASE 
                WHEN ${tables.orders.status} = 'completed'::text
                THEN 'Completed order for ' || ${tables.clients.name}::text
                ELSE 'New order created for ' || ${tables.clients.name}::text
              END`.as('message'),
              timestamp: sql<Date>`CASE 
                WHEN ${tables.orders.status} = 'completed'::text AND ${tables.orders.updatedAt} IS NOT NULL 
                THEN ${tables.orders.updatedAt}
                ELSE ${tables.orders.createdAt}
              END`.as('timestamp'),
              icon: sql<string>`CASE 
                WHEN ${tables.orders.status} = 'completed'::text
                THEN ${activityIcons.order.completed}::text
                ELSE ${activityIcons.order.created}::text
              END`.as('icon'),
              metadata: sql<Record<string, unknown>>`jsonb_build_object(
                'orderId', ${tables.orders.id}::text,
                'clientId', ${tables.orders.clientId}::text,
                'clientName', ${tables.clients.name}::text
              )::jsonb`.as('metadata'),
              sort_order: sql<number>`2::integer`.as('sort_order'),
            })
            .from(tables.orders)
            .innerJoin(tables.clients, eq(tables.orders.clientId, tables.clients.id))
            .where(
              and(
                eq(tables.clients.userId, userId),
                sql`${tables.orders.status} IN ('pending', 'in_progress', 'completed')`
              )
            )
        )

        // Union with payment activities
        .unionAll(
          db
            .select({
              id: tables.payments.id,
              type: sql<string>`'payment'::text`.as('type'),
              action: sql<string>`'received'::text`.as('action'),
              entity: sql<string>`'Payment for Order #' || ${tables.payments.orderId}::text`,
              message: sql<string>`'Received payment of ' || 
                '₦' || ${tables.payments.amount}::text || ' from ' || ${tables.clients.name}::text`.as(
                'message'
              ),
              timestamp: tables.payments.paymentDate,
              icon: sql<string>`${activityIcons.payment.received}::text`.as('icon'),
              metadata: sql<Record<string, unknown>>`jsonb_build_object(
                'paymentId', ${tables.payments.id}::text,
                'orderId', ${tables.payments.orderId}::text,
                'amount', ${tables.payments.amount},
                'clientName', ${tables.clients.name}::text
              )::jsonb`.as('metadata'),
              sort_order: sql<number>`3::integer`.as('sort_order'),
            })
            .from(tables.payments)
            .innerJoin(tables.orders, eq(tables.payments.orderId, tables.orders.id))
            .innerJoin(tables.clients, eq(tables.orders.clientId, tables.clients.id))
            .where(eq(tables.clients.userId, userId))
        )

        // Union with measurement activities
        .unionAll(
          db
            .select({
              id: tables.measurements.id,
              type: sql<string>`'measurement'::text`.as('type'),
              action: sql<string>`'updated'::text`.as('action'),
              entity: tables.clients.name,
              message: sql<string>`'Updated measurements for ' || ${tables.clients.name}::text`.as(
                'message'
              ),
              timestamp: tables.measurements.lastUpdated,
              icon: sql<string>`${activityIcons.measurement.updated}::text`.as('icon'),
              metadata: sql<Record<string, unknown>>`jsonb_build_object(
                'measurementId', ${tables.measurements.id}::text,
                'clientId', ${tables.measurements.clientId}::text,
                'clientName', ${tables.clients.name}::text
              )::jsonb`.as('metadata'),
              sort_order: sql<number>`4::integer`.as('sort_order'),
            })
            .from(tables.measurements)
            .innerJoin(tables.clients, eq(tables.measurements.clientId, tables.clients.id))
            .where(
              and(
                eq(tables.clients.userId, userId),
                sql`${tables.measurements.lastUpdated} IS NOT NULL`
              )
            )
        )
    )

    // Get the combined and sorted activities
    const combinedActivities = await db
      .with(activitiesQuery)
      .select()
      .from(activitiesQuery)
      .orderBy(desc(activitiesQuery.timestamp))
      .limit(limit)

    // Format the combined activities
    const activities: ActivityItem[] = combinedActivities.map(activity => ({
      id: activity.id,
      type: activity.type as 'client' | 'order' | 'payment' | 'measurement',
      action: activity.action as 'created' | 'updated' | 'completed' | 'received',
      entity: activity.entity,
      message: activity.message.replace(
        /<strong>(.*?)<\/strong>/g,
        (_, p1) => `<strong>${p1}</strong>`
      ),
      time: getRelativeTime(new Date(activity.timestamp || new Date())),
      icon: activity.icon,
      metadata: activity.metadata,
    }))
    return activities.slice(0, limit)
  } catch (error: unknown) {
    // Return a consistent API error response structure
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'An unknown error occurred',
      message: 'Failed to fetch recent activities',
    }
  }
})
