interface Notification {
  id: string
  type: 'order' | 'client' | 'payment' | 'system'
  title: string
  message: string
  read: boolean
  severity: 'info' | 'warning' | 'error' | 'success'
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

interface NotificationsResponse {
  success: boolean
  data?: Notification[]
  message?: string
}

export const useNotifications = () => {
  // State
  const notifications = useState<Notification[]>('notifications', () => [])
  const error = useState<string | null>('notifications_error', () => null)

  // Data fetching with useFetch
  const {
    data: notificationsData,
    pending: isLoading,
    refresh: refreshNotifications,
  } = useFetch<NotificationsResponse>('/api/notifications', {
    server: false,
    default: () => ({ success: false, data: [] }) as NotificationsResponse,
    onResponse({ response }) {
      const responseData = response._data as NotificationsResponse
      if (responseData?.success && responseData?.data) {
        notifications.value = responseData.data
      }
    },
    onResponseError({ error: fetchError }) {
      error.value = fetchError?.message || 'Failed to fetch notifications'
    },
  })

  // Computed
  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

  const unreadNotifications = computed(() => notifications.value.filter(n => !n.read))

  const readNotifications = computed(() => notifications.value.filter(n => n.read))

  // Mark notification as read (mutation with $fetch)
  const markAsRead = async (id: string): Promise<boolean> => {
    error.value = null

    try {
      const response = await $fetch<{ success: boolean }>(`/api/notifications/${id}/read`, {
        method: 'POST',
      })

      if (response.success) {
        // Update local state
        const notification = notifications.value.find(n => n.id === id)
        if (notification) {
          notification.read = true
        }
        await refreshNotifications()
      }

      return response.success
    } catch (err: any) {
      error.value = err.message || 'Failed to mark notification as read'
      return false
    }
  }

  // Mark all notifications as read (mutation with $fetch)
  const markAllAsRead = async (): Promise<boolean> => {
    error.value = null

    try {
      const response = await $fetch<{ success: boolean }>('/api/notifications/mark-all-read', {
        method: 'POST',
      })

      if (response.success) {
        // Update local state
        notifications.value = notifications.value.map(n => ({ ...n, read: true }))
        await refreshNotifications()
      }

      return response.success
    } catch (err: any) {
      error.value = err.message || 'Failed to mark all notifications as read'
      return false
    }
  }

  // Delete notification (mutation with $fetch)
  const deleteNotification = async (id: string): Promise<boolean> => {
    error.value = null

    try {
      const response = await $fetch<{ success: boolean }>(`/api/notifications/${id}`, {
        method: 'DELETE',
      })

      if (response.success) {
        notifications.value = notifications.value.filter(n => n.id !== id)
        await refreshNotifications()
      }

      return response.success
    } catch (err: any) {
      error.value = err.message || 'Failed to delete notification'
      return false
    }
  }

  // Clear all notifications (mutation with $fetch)
  const clearAll = async (): Promise<boolean> => {
    error.value = null

    try {
      const response = await $fetch<{ success: boolean }>('/api/notifications/clear', {
        method: 'DELETE',
      })

      if (response.success) {
        notifications.value = []
        await refreshNotifications()
      }

      return response.success
    } catch (err: any) {
      error.value = err.message || 'Failed to clear notifications'
      return false
    }
  }

  // Get notification icon based on type and severity
  const getNotificationIcon = (notification: Notification): string => {
    if (notification.type === 'payment') {
      return notification.severity === 'error'
        ? 'i-heroicons-exclamation-triangle'
        : 'i-heroicons-credit-card'
    }
    if (notification.type === 'order') {
      return 'i-heroicons-shopping-bag'
    }
    if (notification.type === 'client') {
      return 'i-heroicons-user'
    }
    if (notification.type === 'system') {
      return notification.severity === 'error'
        ? 'i-heroicons-exclamation-triangle'
        : 'i-heroicons-information-circle'
    }
    return 'i-heroicons-bell'
  }

  // Get notification color based on severity
  const getNotificationColor = (notification: Notification): string => {
    switch (notification.severity) {
      case 'error':
        return 'red'
      case 'warning':
        return 'yellow'
      case 'success':
        return 'green'
      case 'info':
      default:
        return 'blue'
    }
  }

  // Local state management
  const clearError = () => {
    error.value = null
  }

  return {
    // State
    notifications: readonly(notifications),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Computed
    unreadCount,
    unreadNotifications,
    readNotifications,

    // API Actions
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,

    // Utility Functions
    getNotificationIcon,
    getNotificationColor,

    // Refresh Actions
    refreshNotifications,

    // Local State Actions
    clearError,
  }
}
