/**
 * Utility functions for proper error handling throughout the application
 */

import type { ErrorWithMessage, ApiError, DatabaseError, NetworkError } from '~/types/enhanced'

/**
 * Type guard to check if an error has a message property
 */
export function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as ErrorWithMessage).message === 'string'
  )
}

/**
 * Type guard to check if an error is an API error
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    isErrorWithMessage(error) &&
    'statusCode' in error &&
    typeof (error as ApiError).statusCode === 'number'
  )
}

/**
 * Type guard to check if an error is a database error
 */
export function isDatabaseError(error: unknown): error is DatabaseError {
  return isErrorWithMessage(error) && ('query' in error || 'params' in error)
}

/**
 * Type guard to check if an error is a network error
 * Network errors occur when the request never reaches the server or fails before getting a response
 */
export function isNetworkError(error: unknown): error is NetworkError {
  if (typeof error !== 'object' || error === null) {
    return false
  }

  const err = error as Record<string, unknown>

  // Network errors typically have error codes or names indicating connection issues
  const networkErrorCodes = [
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
    'ECONNRESET',
    'EHOSTUNREACH',
    'ENETUNREACH',
    'EAI_AGAIN',
    'ERR_NETWORK',
    'ERR_INTERNET_DISCONNECTED',
  ]

  const networkErrorNames = ['NetworkError', 'FetchError', 'TypeError']

  // Check for network error code
  if (err.code && typeof err.code === 'string' && networkErrorCodes.includes(err.code)) {
    return true
  }

  // Check for network error name
  if (err.name && typeof err.name === 'string' && networkErrorNames.includes(err.name)) {
    return true
  }

  // Check statusCode directly (network errors don't have valid HTTP status codes)
  let statusCode: number | undefined = undefined

  // Check for statusCode property directly
  if (typeof err.statusCode === 'number') {
    statusCode = err.statusCode
  } else if (typeof err.status === 'number') {
    statusCode = err.status
  } else if (err.response && typeof err.response === 'object') {
    const response = err.response as Record<string, unknown>
    if (typeof response.status === 'number') {
      statusCode = response.status
    }
  }

  // Network errors typically have statusCode 0, undefined, or no statusCode at all
  // Valid HTTP responses have statusCode 100-599
  const hasValidHttpStatus = statusCode !== undefined && statusCode >= 100 && statusCode < 600

  // If it has a valid HTTP status code, it's not a network error (it's an HTTP error response)
  if (hasValidHttpStatus) {
    return false
  }

  // Check if error message indicates network issues
  if (err.message && typeof err.message === 'string') {
    const message = err.message.toLowerCase()
    if (
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('fetch failed') ||
      message.includes('failed to fetch') ||
      message.includes('offline') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('enotfound') ||
      message.includes('etimedout')
    ) {
      // If statusCode is 0, undefined, or invalid, and we have network indicators, it's a network error
      if (!hasValidHttpStatus) {
        return true
      }
    }
  }

  // If statusCode is 0 or undefined, and we have network error indicators, it's likely a network error
  if ((statusCode === 0 || statusCode === undefined) && !hasValidHttpStatus) {
    // Additional check: if it has network error indicators, it's a network error
    if (
      (err.code && typeof err.code === 'string') ||
      (err.name && typeof err.name === 'string' && networkErrorNames.includes(err.name as string))
    ) {
      return true
    }
  }

  return false
}

/**
 * Check if an error is an actual HTTP error response from the server
 * (as opposed to a network error where no response was received)
 */
export function isActualHttpError(error: unknown): boolean {
  // Network errors are not HTTP errors
  if (isNetworkError(error)) {
    return false
  }

  const statusCode = getErrorStatusCode(error, -1)

  // Valid HTTP status codes are 100-599
  // Status code 0 typically indicates a network error (no response)
  // Status code -1 means we couldn't find a status code
  return statusCode >= 100 && statusCode < 600
}

/**
 * Get the type of error for better error handling
 * Returns 'network', 'http', 'database', or 'unknown'
 */
export function getErrorType(error: unknown): 'network' | 'http' | 'database' | 'unknown' {
  if (isNetworkError(error)) {
    return 'network'
  }

  if (isDatabaseError(error)) {
    return 'database'
  }

  if (isActualHttpError(error)) {
    return 'http'
  }

  return 'unknown'
}

/**
 * Extract error message from unknown error type
 */
export function getErrorMessage(error: unknown, fallback = 'An unknown error occurred'): string {
  if (isErrorWithMessage(error)) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return fallback
}

/**
 * Extract status code from error
 */
export function getErrorStatusCode(error: unknown, fallback = 500): number {
  if (isApiError(error)) {
    return error.statusCode
  }

  // Check for common error response patterns
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>

    // Check for response.status pattern
    if (errorObj.response && typeof errorObj.response === 'object') {
      const response = errorObj.response as Record<string, unknown>
      if (typeof response.status === 'number') {
        return response.status
      }
    }

    // Check for statusCode property
    if (typeof errorObj.statusCode === 'number') {
      return errorObj.statusCode
    }

    // Check for status property
    if (typeof errorObj.status === 'number') {
      return errorObj.status
    }
  }

  return fallback
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: unknown,
  defaultMessage?: string
): {
  success: false
  error: string
  statusCode: number
} {
  const message = getErrorMessage(error, defaultMessage)
  const statusCode = getErrorStatusCode(error)

  return {
    success: false,
    error: message,
    statusCode,
  }
}

/**
 * Handle API errors with proper logging
 */
export function handleApiError(error: unknown, context?: string): never {
  const message = getErrorMessage(error)
  const statusCode = getErrorStatusCode(error)

  if (context) {
    console.error(`API Error in ${context}:`, error)
  } else {
    console.error('API Error:', error)
  }

  throw createError({
    statusCode,
    statusMessage: message,
  })
}

/**
 * Handle database errors with proper logging
 */
export function handleDatabaseError(error: unknown, context?: string): never {
  const message = getErrorMessage(error, 'Database operation failed')

  if (context) {
    console.error(`Database Error in ${context}:`, error)
  } else {
    console.error('Database Error:', error)
  }

  throw createError({
    statusCode: 500,
    statusMessage: `Database error: ${message}`,
  })
}

/**
 * Safe error logging that handles unknown error types
 */
export function logError(error: unknown, context?: string): void {
  const message = getErrorMessage(error)
  const logMessage = context ? `${context}: ${message}` : message

  console.error(logMessage, error)
}

/**
 * Convert unknown error to Error instance
 */
export function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error
  }

  const message = getErrorMessage(error)
  return new Error(message)
}

/**
 * Async error handler wrapper
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    logError(error, context)
    throw toError(error)
  }
}

/**
 * Sync error handler wrapper
 */
export function withSyncErrorHandling<T>(operation: () => T, context?: string): T {
  try {
    return operation()
  } catch (error) {
    logError(error, context)
    throw toError(error)
  }
}
