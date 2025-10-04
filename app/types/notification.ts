/**
 * Notification related types
 */

export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'payment'
  | 'subscription'
  | 'system'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  createdAt: string
  action?: {
    label: string
    url: string
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    data?: Record<string, unknown>
    priority?: 'low' | 'medium' | 'high'
  }
  metadata?: Record<string, unknown>
}

export interface NotificationPreferences {
  email: boolean
  push: boolean
  inApp: boolean
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly'
  categories: {
    payments: boolean
    reminders: boolean
    promotions: boolean
    account: boolean
  }
}

export interface UnreadCounts {
  total: number
  payments: number
  reminders: number
  promotions: number
  account: number
}
