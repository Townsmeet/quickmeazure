/**
 * Storage keys used throughout the application for persisting data in localStorage
 */

export const STORAGE_KEYS = {
  // Authentication
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',

  // Theme and UI preferences
  THEME: 'theme',

  // Other storage keys can be added here as needed
} as const

export type StorageKey = keyof typeof STORAGE_KEYS

export const PERSIST_KEYS = {
  AUTH: 'auth',
  USER: 'user',
  THEME: 'theme',
} as const
