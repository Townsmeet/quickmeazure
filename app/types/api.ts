/**
 * API related types and interfaces
 */

import type { UnknownRecord, PaginationInfo } from './enhanced'

/**
 * Standard API response format
 */
export interface ApiResponse<T = unknown> {
  data: T | null
  success: boolean
  error?: string
  statusCode?: number
  message?: string
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T = unknown> {
  data: T[]
  pagination: PaginationInfo
}

/**
 * Standard error response
 */
export interface ApiError {
  message: string
  statusCode: number
  errors?: Record<string, string[]>
  code?: string
}

/**
 * Request options for API calls
 */
export interface ApiRequestOptions {
  headers?: Record<string, string>
  params?: UnknownRecord
  body?: unknown
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  responseType?: 'json' | 'blob' | 'arraybuffer' | 'text'
  skipAuth?: boolean
  skipErrorHandling?: boolean
  [key: string]: unknown
}

/**
 * Authentication headers
 */
export interface AuthHeaders {
  Authorization?: string
  'X-Refresh-Token'?: string
  'Content-Type'?: string
}

/**
 * File upload options
 */
export interface FileUploadOptions {
  fieldName?: string
  fileName?: string
  mimeType?: string
  metadata?: UnknownRecord
  onProgress?: (progress: number) => void
}

/**
 * API endpoint configuration
 */
export interface ApiEndpoint {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  authRequired?: boolean
  roles?: string[]
}
