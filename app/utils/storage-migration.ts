/**
 * Storage migration utilities
 *
 * Handles migration of localStorage data between different storage formats
 */

import { STORAGE_KEYS } from '../constants/storage'
import { removeFromStorage, setStringToStorage } from './storage'

/**
 * Migrate JWT tokens from JSON-stringified format to raw string format
 * This fixes issues where JWT tokens were incorrectly stored as JSON
 */
export function migrateTokenStorage(): void {
  if (typeof window === 'undefined') return

  try {
    // Check and migrate auth token
    const authTokenKey = STORAGE_KEYS.AUTH_TOKEN
    const rawAuthToken = localStorage.getItem(authTokenKey)

    if (rawAuthToken && rawAuthToken.startsWith('"') && rawAuthToken.endsWith('"')) {
      // Token was JSON stringified, extract the actual token
      const actualToken = JSON.parse(rawAuthToken)
      setStringToStorage(authTokenKey, actualToken)
      console.log('Migrated auth token from JSON format to string format')
    }

    // Check and migrate refresh token
    const refreshTokenKey = STORAGE_KEYS.REFRESH_TOKEN
    const rawRefreshToken = localStorage.getItem(refreshTokenKey)

    if (rawRefreshToken && rawRefreshToken.startsWith('"') && rawRefreshToken.endsWith('"')) {
      // Token was JSON stringified, extract the actual token
      const actualToken = JSON.parse(rawRefreshToken)
      setStringToStorage(refreshTokenKey, actualToken)
      console.log('Migrated refresh token from JSON format to string format')
    }

    // Clean up any malformed tokens that can't be parsed
    if (rawRefreshToken && !isValidJWT(rawRefreshToken)) {
      console.warn('Removing malformed refresh token from localStorage')
      removeFromStorage(refreshTokenKey)
    }

    if (rawAuthToken && !isValidJWT(rawAuthToken)) {
      console.warn('Removing malformed auth token from localStorage')
      removeFromStorage(authTokenKey)
    }
  } catch (error) {
    console.error('Error during token storage migration:', error)
    // If migration fails, clear potentially corrupted tokens
    removeFromStorage(STORAGE_KEYS.AUTH_TOKEN)
    removeFromStorage(STORAGE_KEYS.REFRESH_TOKEN)
  }
}

/**
 * Check if a string is a valid JWT token format
 * @param token The token string to validate
 * @returns True if the token appears to be a valid JWT
 */
function isValidJWT(token: string): boolean {
  if (!token || typeof token !== 'string') return false

  // Remove quotes if present
  const cleanToken = token.replace(/^"|"$/g, '')

  // JWT tokens have 3 parts separated by dots
  const parts = cleanToken.split('.')
  if (parts.length !== 3) return false

  // Each part should be base64url encoded (alphanumeric + - and _)
  const base64UrlPattern = /^[A-Za-z0-9_-]+$/
  return parts.every(part => base64UrlPattern.test(part))
}
