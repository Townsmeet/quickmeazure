export const API_BASE = process.env.NUXT_PUBLIC_API_BASE_URL || '/api'

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: `${API_BASE}/auth/login`,
    REGISTER: `${API_BASE}/auth/register`,
    FORGOT_PASSWORD: `${API_BASE}/auth/forgot-password`,
    RESET_PASSWORD: (token: string) => `${API_BASE}/auth/reset-password/${token}`,
    VERIFY_EMAIL: (token: string) => `${API_BASE}/auth/verify-email/${token}`,
    LOGOUT: `${API_BASE}/auth/logout`,
    REFRESH: `${API_BASE}/auth/refresh`,
  },

  // Users
  USERS: {
    BASE: `${API_BASE}/users`,
    BY_ID: (id: string) => `${API_BASE}/users/${id}`,
    UPDATE_PASSWORD: `${API_BASE}/users/change-password`,
    UPDATE_AVATAR: `${API_BASE}/users/avatar`,
    PROFILE: `${API_BASE}/profile`,
    MEASUREMENT_SETTINGS: `${API_BASE}/users/measurements`,
  },

  // Clients
  CLIENTS: {
    BASE: `${API_BASE}/clients`,
    BY_ID: (id: string) => `${API_BASE}/clients/${id}`,
    IMPORT: `${API_BASE}/clients/import`,
    EXPORT: `${API_BASE}/clients/export`,
  },

  // Orders
  ORDERS: {
    BASE: `${API_BASE}/orders`,
    BY_ID: (id: string) => `${API_BASE}/orders/${id}`,
    STATUSES: `${API_BASE}/orders/statuses`,
    SUMMARY: `${API_BASE}/orders/summary`,
  },

  // Styles
  STYLES: {
    BASE: `${API_BASE}/styles`,
    BY_ID: (id: string) => `${API_BASE}/styles/${id}`,
    CATEGORIES: `${API_BASE}/styles/categories`,
    TEMPLATES: `${API_BASE}/styles/templates`,
  },

  // Measurements
  MEASUREMENTS: {
    BASE: `${API_BASE}/measurements`,
    TEMPLATES: `${API_BASE}/measurements/templates`,
    TEMPLATE_BY_ID: (id: string) => `${API_BASE}/measurements/templates/${id}`,
    USER_MEASUREMENTS: (userId: string) => `${API_BASE}/measurements/user/${userId}`,
  },

  // Subscriptions
  SUBSCRIPTIONS: {
    BASE: `${API_BASE}/subscriptions`,
    PLANS: `${API_BASE}/subscriptions/plans`,
    CURRENT: `${API_BASE}/subscriptions/current`,
    REACTIVATE: `${API_BASE}/subscriptions/reactivate`,
    CANCEL: `${API_BASE}/subscriptions/cancel`,
    CHANGE_PLAN: `${API_BASE}/subscriptions/change-plan`,
    BILLING_HISTORY: `${API_BASE}/subscriptions/billing-history`,
    PAYMENT_METHODS: `${API_BASE}/subscriptions/payment-methods`,
    PAYMENT_METHOD_BY_ID: (id: string) => `${API_BASE}/subscriptions/payment-methods/${id}`,
    INVOICES: `${API_BASE}/subscriptions/invoices`,
  },

  // Dashboard
  DASHBOARD: {
    STATS: `${API_BASE}/dashboard/stats`,
    RECENT_ACTIVITY: `${API_BASE}/dashboard/recent-activity`,
    ORDERS_DUE_SOON: `${API_BASE}/dashboard/orders-due-soon`,
    CLIENT_GROWTH: `${API_BASE}/dashboard/client-growth`,
  },

  // Settings
  SETTINGS: {
    PROFILE: `${API_BASE}/settings/profile`,
    PREFERENCES: `${API_BASE}/settings/preferences`,
    NOTIFICATIONS: `${API_BASE}/settings/notifications`,
    BILLING: `${API_BASE}/settings/billing`,
  },
}
