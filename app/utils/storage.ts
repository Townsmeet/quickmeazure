/**
 * Storage utility functions
 *
 * Provides standardized methods for interacting with localStorage
 * with proper error handling and type safety.
 */

/**
 * Get a value from localStorage with proper error handling
 * @param key The localStorage key
 * @param defaultValue The default value to return if not found or error
 * @returns The parsed value or null if not found or error
 */
export function getFromStorage<T = any>(key: string, defaultValue: T | null = null): T | null {
  return getLocalStorage(key, defaultValue)
}

/**
 * Alias for getFromStorage for backward compatibility
 */
export function getLocalStorage<T = any>(key: string, defaultValue: T | null = null): T | null {
  if (typeof window === 'undefined') return defaultValue

  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : defaultValue
  } catch (error) {
    console.error(`Error retrieving ${key} from localStorage:`, error)
    return defaultValue
  }
}

/**
 * Get a string value from localStorage without JSON parsing
 * Useful for JWT tokens and other string values that don't need parsing
 * @param key The localStorage key
 * @returns The string value or null if not found
 */
export function getStringFromStorage(key: string): string | null {
  if (typeof window === 'undefined') return null

  try {
    return localStorage.getItem(key)
  } catch (error) {
    console.error(`Error retrieving ${key} from localStorage:`, error)
    return null
  }
}

/**
 * Set a string value in localStorage without JSON stringification
 * Useful for JWT tokens and other string values
 * @param key The localStorage key
 * @param value The string value to store
 * @returns True if successful, false otherwise
 */
export function setStringToStorage(key: string, value: string): boolean {
  if (typeof window === 'undefined') return false

  try {
    localStorage.setItem(key, value)
    return true
  } catch (error) {
    console.error(`Error storing ${key} in localStorage:`, error)
    return false
  }
}

/**
 * Set a value in localStorage with proper error handling
 * @param key The localStorage key
 * @param value The value to store
 * @returns True if successful, false otherwise
 */
export function setToStorage<T>(key: string, value: T): boolean {
  return setLocalStorage(key, value)
}

/**
 * Alias for setToStorage for backward compatibility
 */
export function setLocalStorage<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') return false

  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.error(`Error storing ${key} in localStorage:`, error)
    return false
  }
}

/**
 * Remove a value from localStorage with proper error handling
 * @param key The localStorage key
 * @returns True if successful, false otherwise
 */
export function removeFromStorage(key: string): boolean {
  return removeLocalStorage(key)
}

/**
 * Alias for removeFromStorage for backward compatibility
 */
export function removeLocalStorage(key: string): boolean {
  if (typeof window === 'undefined') return false

  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error)
    return false
  }
}

/**
 * Clear all localStorage values with proper error handling
 * @returns True if successful, false otherwise
 */
export function clearStorage(): boolean {
  if (typeof window === 'undefined') return false

  try {
    localStorage.clear()
    return true
  } catch (error) {
    console.error('Error clearing localStorage:', error)
    return false
  }
}

/**
 * Storage keys used throughout the application
 * Centralizing these prevents typos and inconsistencies
 */
export const STORAGE_KEYS = {
  AUTH: 'auth',
  SUBSCRIPTION: 'subscription',
  USER_PREFERENCES: 'user-preferences',
  MEASUREMENT_SETTINGS: 'measurement-settings',
  RECENT_CLIENTS: 'recent-clients',
}
