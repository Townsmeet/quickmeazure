/**
 * Utility functions for proper error handling throughout the application
 */

import type { ErrorWithMessage, ApiError, DatabaseError } from '~/types/enhanced'

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
