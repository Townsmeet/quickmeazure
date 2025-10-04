import { eq, and, sql } from 'drizzle-orm'
import { useDrizzle } from '../utils/drizzle'
import * as tables from '../database/schema'
import { addDays, isBefore, differenceInDays } from 'date-fns'

// Notification types
export const NOTIFICATION_TYPES = {
  PAYMENT: 'payment',
  SUBSCRIPTION: 'subscription',
  USAGE: 'usage',
  SYSTEM: 'system',
}

// Notification severities
export const NOTIFICATION_SEVERITIES = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
}

/**
 * Create a notification for a user
 */
export async function createNotification({
  userId,
  type,
  severity,
  title,
  message,
  actionUrl = null,
  actionText = null,
  expiresAt = null,
  metadata = {},
}: {
  userId: number
  type: string
  severity: string
  title: string
  message: string
  actionUrl?: string | null
  actionText?: string | null
  expiresAt?: Date | null
  metadata?: Record<string, unknown>
}) {
  try {
    const db = useDrizzle()

    // Check if a similar notification already exists and is not expired
    const existingNotifications = await db
      .select()
      .from(tables.notifications)
      .where(
        and(
          eq(tables.notifications.userId, userId),
          eq(tables.notifications.type, type),
          eq(tables.notifications.title, title),
          sql`${tables.notifications.expiresAt} IS NULL OR ${tables.notifications.expiresAt} > ${new Date()}`
        )
      )
      .limit(1)

    // If a similar notification exists, don't create a duplicate
    if (existingNotifications.length > 0) {
      return existingNotifications[0]
    }

    // Create the notification
    const [notification] = await db
      .insert(tables.notifications)
      .values({
        userId,
        type,
        severity,
        title,
        message,
        actionUrl,
        actionText,
        expiresAt,
        metadata: JSON.stringify(metadata ?? {}),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return notification
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

/**
 * Generate payment reminder notifications for users with upcoming subscription renewals
 */
export async function generatePaymentReminders() {
  try {
    const db = useDrizzle()

    // Find active subscriptions that will renew in the next 7 days
    const now = new Date()
    const sevenDaysFromNow = addDays(now, 7)
    const threeDaysFromNow = addDays(now, 3)

    // Get subscriptions with upcoming renewals
    const upcomingRenewals = await db
      .select({
        subscription: tables.subscriptions,
        user: tables.user,
        plan: tables.plans,
      })
      .from(tables.subscriptions)
      .innerJoin(tables.user, eq(tables.subscriptions.userId, tables.user.id))
      .innerJoin(tables.plans, eq(tables.subscriptions.planId, tables.plans.id))
      .where(
        and(
          eq(tables.subscriptions.status, 'active'),
          sql`${tables.subscriptions.nextBillingDate} <= ${sevenDaysFromNow}`,
          sql`${tables.subscriptions.nextBillingDate} > ${now}`
        )
      )

    // Create notifications for each upcoming renewal
    for (const { subscription, user, plan } of upcomingRenewals) {
      if (!subscription.nextBillingDate) continue
      const daysUntilRenewal = differenceInDays(subscription.nextBillingDate, now)

      // Determine severity based on how close the renewal is
      let severity = NOTIFICATION_SEVERITIES.INFO
      if (
        subscription.nextBillingDate &&
        isBefore(subscription.nextBillingDate, threeDaysFromNow)
      ) {
        severity = NOTIFICATION_SEVERITIES.WARNING
      }

      // Create the notification
      await createNotification({
        userId: user.id,
        type: NOTIFICATION_TYPES.PAYMENT,
        severity,
        title: 'Upcoming Subscription Renewal',
        message: `Your ${plan.name} plan will renew in ${daysUntilRenewal} days. Please ensure your payment method is up to date.`,
        actionUrl: '/settings/billing',
        actionText: 'Update Payment Method',
        expiresAt: subscription.nextBillingDate,
        metadata: {
          subscriptionId: subscription.id,
          planId: plan.id,
          renewalDate: subscription.nextBillingDate,
        },
      })
    }

    return { success: true, count: upcomingRenewals.length }
  } catch (error) {
    console.error('Error generating payment reminders:', error)
    throw error
  }
}

/**
 * Generate subscription expiration notifications for users with expiring subscriptions
 */
export async function generateSubscriptionExpirationAlerts() {
  try {
    const db = useDrizzle()

    // Find subscriptions that will expire in the next 14 days
    const now = new Date()
    const fourteenDaysFromNow = addDays(now, 14)
    const sevenDaysFromNow = addDays(now, 7)

    // Get subscriptions with upcoming expirations
    const upcomingExpirations = await db
      .select({
        subscription: tables.subscriptions,
        user: tables.user,
        plan: tables.plans,
      })
      .from(tables.subscriptions)
      .innerJoin(tables.user, eq(tables.subscriptions.userId, tables.user.id))
      .innerJoin(tables.plans, eq(tables.subscriptions.planId, tables.plans.id))
      .where(
        and(
          eq(tables.subscriptions.status, 'active'),
          sql`${tables.subscriptions.endDate} <= ${fourteenDaysFromNow}`,
          sql`${tables.subscriptions.endDate} > ${now}`
        )
      )

    // Create notifications for each upcoming expiration
    for (const { subscription, user, plan } of upcomingExpirations) {
      const daysUntilExpiration = subscription.endDate
        ? differenceInDays(subscription.endDate, now)
        : 0

      // Determine severity based on how close the expiration is
      let severity = NOTIFICATION_SEVERITIES.INFO
      if (subscription.endDate && isBefore(subscription.endDate, sevenDaysFromNow)) {
        severity = NOTIFICATION_SEVERITIES.WARNING
      }

      // Create the notification
      await createNotification({
        userId: user.id,
        type: NOTIFICATION_TYPES.SUBSCRIPTION,
        severity,
        title: 'Subscription Expiring Soon',
        message: `Your ${plan.name} plan will expire in ${daysUntilExpiration} days. Renew now to avoid service interruption.`,
        actionUrl: '/settings/billing',
        actionText: 'Renew Subscription',
        expiresAt: subscription.endDate,
        metadata: {
          subscriptionId: subscription.id,
          planId: plan.id,
          expirationDate: subscription.endDate,
        },
      })
    }

    return { success: true, count: upcomingExpirations.length }
  } catch (error) {
    console.error('Error generating subscription expiration alerts:', error)
    throw error
  }
}

/**
 * Generate usage limit warnings for users approaching their plan limits
 */
export async function generateUsageLimitWarnings() {
  try {
    const db = useDrizzle()

    // Get active subscriptions with their associated plans and usage data
    const subscriptionsWithUsage = await db
      .select({
        subscription: tables.subscriptions,
        user: tables.user,
        plan: tables.plans,
      })
      .from(tables.subscriptions)
      .innerJoin(tables.user, eq(tables.subscriptions.userId, tables.user.id))
      .innerJoin(tables.plans, eq(tables.subscriptions.planId, tables.plans.id))
      .where(eq(tables.subscriptions.status, 'active'))

    const now = new Date()
    let notificationCount = 0

    // Check each subscription for usage limits
    for (const { subscription, user, plan } of subscriptionsWithUsage) {
      // Skip free plans or plans without usage limits
      if (plan.price <= 0 || !plan.limits) {
        continue
      }

      const limits = plan.limits

      // Check client limit if it exists
      if (limits.maxClients) {
        // Count clients for this user
        const clientCount = await db
          .select({ count: sql`count(*)` })
          .from(tables.clients)
          .where(eq(tables.clients.userId, user.id))
          .then(result => Number(result[0]?.count || 0))

        // Calculate percentage of limit used
        const percentUsed = (clientCount / limits.maxClients) * 100

        // Create warning if approaching limit (80% or more)
        if (percentUsed >= 80) {
          const severity =
            percentUsed >= 90 ? NOTIFICATION_SEVERITIES.WARNING : NOTIFICATION_SEVERITIES.INFO

          await createNotification({
            userId: user.id,
            type: NOTIFICATION_TYPES.USAGE,
            severity,
            title: 'Client Limit Approaching',
            message: `You've used ${clientCount} of ${limits.maxClients} clients (${Math.round(percentUsed)}%). Consider upgrading your plan for more clients.`,
            actionUrl: '/settings/billing',
            actionText: 'Upgrade Plan',
            expiresAt: addDays(now, 30),
            metadata: {
              subscriptionId: subscription.id,
              planId: plan.id,
              limitType: 'clients',
              current: clientCount,
              max: limits.maxClients,
            },
          })

          notificationCount++
        }
      }

      // Check measurement limit if it exists
      if (limits.maxMeasurements) {
        // Count measurements for this user
        const measurementCount = await db
          .select({ count: sql`count(*)` })
          .from(tables.measurements)
          .where(eq(tables.measurements.clientId, user.id))
          .then(result => Number(result[0]?.count || 0))

        // Calculate percentage of limit used
        const percentUsed = (measurementCount / limits.maxMeasurements) * 100

        // Create warning if approaching limit (80% or more)
        if (percentUsed >= 80) {
          const severity =
            percentUsed >= 90 ? NOTIFICATION_SEVERITIES.WARNING : NOTIFICATION_SEVERITIES.INFO

          await createNotification({
            userId: user.id,
            type: NOTIFICATION_TYPES.USAGE,
            severity,
            title: 'Measurement Limit Approaching',
            message: `You've used ${measurementCount} of ${limits.maxMeasurements} measurements (${Math.round(percentUsed)}%). Consider upgrading your plan for more measurements.`,
            actionUrl: '/settings/billing',
            actionText: 'Upgrade Plan',
            expiresAt: addDays(now, 30),
            metadata: {
              subscriptionId: subscription.id,
              planId: plan.id,
              limitType: 'measurements',
              current: measurementCount,
              max: limits.maxMeasurements,
            },
          })

          notificationCount++
        }
      }

      // Add more limit checks as needed (storage, etc.)
    }

    return { success: true, count: notificationCount }
  } catch (error) {
    console.error('Error generating usage limit warnings:', error)
    throw error
  }
}

/**
 * Clean up expired notifications
 */
export async function cleanupExpiredNotifications() {
  try {
    const db = useDrizzle()

    // Delete notifications that have expired
    await db
      .delete(tables.notifications)
      .where(sql`${tables.notifications.expiresAt} < ${new Date()}`)

    return { success: true }
  } catch (error) {
    console.error('Error cleaning up expired notifications:', error)
    throw error
  }
}
