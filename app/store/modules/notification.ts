// Types
import type { Notification } from '../../types/notification'

/**
 * Notification store for managing user notifications state
 * This store is responsible for managing the state of notifications only
 * All API calls should be made in the useNotificationApi composable
 */
export const useNotificationStore = defineStore('notification', () => {
  // State
  const notifications = ref<Notification[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastChecked = ref<Date | null>(null)

  // Computed properties
  const unreadCount = computed(() => {
    return notifications.value.filter(n => !n.read).length
  })

  const paymentNotifications = computed(() => {
    return notifications.value.filter(n => n.type === 'payment')
  })

  const subscriptionNotifications = computed(() => {
    return notifications.value.filter(n => n.type === 'subscription')
  })

  const usageNotifications = computed(() => {
    return notifications.value.filter(n => n.type === 'usage')
  })

  // State mutation methods
  const setNotifications = (newNotifications: Notification[]) => {
    notifications.value = newNotifications
    lastChecked.value = new Date()
  }

  const setLoading = (isLoading: boolean) => {
    loading.value = isLoading
  }

  const setError = (errorMessage: string | null) => {
    error.value = errorMessage
  }

  const addNotification = (notification: Notification) => {
    notifications.value.unshift(notification)
  }

  const updateNotification = (id: string, updates: Partial<Notification>) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value[index] = { ...notifications.value[index], ...updates }
    }
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  const markAllRead = () => {
    notifications.value.forEach(n => {
      n.read = true
    })
  }

  return {
    // State
    notifications,
    loading,
    error,
    lastChecked,

    // Computed
    unreadCount,
    paymentNotifications,
    subscriptionNotifications,
    usageNotifications,

    // Actions
    setNotifications,
    setLoading,
    setError,
    addNotification,
    updateNotification,
    removeNotification,
    markAllRead,
  }
})
