/**
 * User preferences and profile related types
 */

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  measurementUnit: 'metric' | 'imperial'
  dateFormat: string
  notifications: {
    email: boolean
    push: boolean
    reminders: boolean
    promotions: boolean
  }
  emailNotifications: boolean
  pushNotifications: boolean
  language: string
  timezone: string
  currency: string
  twoFactorEnabled: boolean
  autoSave: boolean
  defaultView: 'list' | 'grid' | 'calendar'
  compactMode: boolean
  fontSize: 'small' | 'medium' | 'large'
  showTutorial: boolean
  lastVisitedAt?: string
  metadata?: Record<string, unknown>
}
