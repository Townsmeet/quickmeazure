/**
 * Enhanced type definitions to replace 'any' types throughout the application
 */

// Basic utility types
export type UnknownRecord = Record<string, unknown>
export type StringRecord = Record<string, string>

// Error handling types
export interface ErrorWithMessage {
  message: string
  code?: string
  statusCode?: number
}

export interface DatabaseError extends ErrorWithMessage {
  query?: string
  params?: unknown[]
}

export interface ApiError extends ErrorWithMessage {
  data?: unknown
  response?: {
    status: number
    statusText: string
    data?: unknown
  }
}

export interface NetworkError extends ErrorWithMessage {
  code?: string
  name?: string
  cause?: unknown
  // Network errors typically don't have a statusCode, or have statusCode 0
  statusCode?: number
}

// Generic data structures
export interface KeyValuePair<T = string> {
  [key: string]: T
}

// Measurement specific types
export interface MeasurementValue {
  value: number | string
  unit?: string
  notes?: string
}

// Address types
export interface Address {
  street?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  type?: 'shipping' | 'billing'
}

// Metadata types
export interface BaseMetadata {
  createdBy?: string
  updatedBy?: string
  version?: number
  tags?: string[]
}

export interface NotificationMetadata extends BaseMetadata {
  priority?: 'low' | 'medium' | 'high'
  category?: string
  actionUrl?: string
}

export interface SubscriptionMetadata extends BaseMetadata {
  source?: string
  campaignId?: string
  referrer?: string
}

export interface PaymentMetadata extends BaseMetadata {
  gateway?: string
  transactionId?: string
  currency?: string
}

// Form data types
export interface FormField {
  name: string
  value: unknown
  type: 'text' | 'number' | 'email' | 'password' | 'select' | 'textarea' | 'checkbox' | 'radio'
  required?: boolean
  validation?: {
    min?: number
    max?: number
    pattern?: string
    custom?: (value: unknown) => boolean | string
  }
}

export interface FormData {
  [fieldName: string]: FormField
}

// API response types
export interface PaginationInfo {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNextPage?: boolean
  hasPrevPage?: boolean
}

export interface ApiResponseData<T = unknown> {
  data: T
  pagination?: PaginationInfo
  metadata?: UnknownRecord
}

// File upload types
export interface FileUploadData {
  file: File
  fieldName: string
  fileName?: string
  mimeType?: string
  size?: number
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

// User profile types
export interface UserProfile {
  id: string
  email: string
  firstName?: string
  lastName?: string
  avatar?: string
  phone?: string
  businessName?: string
  specializations?: StringRecord
  services?: StringRecord
  preferences?: UnknownRecord
  metadata?: UnknownRecord
}

// Business data types
export interface BusinessInfo {
  name: string
  description?: string
  address?: Address
  phone?: string
  email?: string
  website?: string
  logo?: string
  settings?: UnknownRecord
}

// Chart data types
export interface ChartDataPoint {
  label: string
  value: number
  color?: string
  metadata?: UnknownRecord
}

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
  }[]
}

// Activity/Audit log types
export interface ActivityLogEntry {
  id: string
  userId: string
  action: string
  entityType: string
  entityId: string
  timestamp: string
  metadata?: UnknownRecord
  ipAddress?: string
  userAgent?: string
}

// Search and filter types
export interface SearchFilters {
  query?: string
  dateFrom?: string
  dateTo?: string
  status?: string
  category?: string
  tags?: string[]
  [key: string]: unknown
}

export interface SortOptions {
  field: string
  direction: 'asc' | 'desc'
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// Event handler types
export type EventHandler<T = Event> = (event: T) => void | Promise<void>
export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>

// Component prop types
export interface BaseComponentProps {
  id?: string
  className?: string
  style?: Partial<CSSStyleDeclaration>
  disabled?: boolean
  loading?: boolean
}

// Table/List component types
export interface TableColumn<T = UnknownRecord> {
  key: string
  label: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (value: unknown, row: T) => string | HTMLElement
}

export interface TableRow extends UnknownRecord {
  id: string | number
}

// Modal/Dialog types
export interface ModalOptions {
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  type?: 'info' | 'warning' | 'error' | 'success'
  persistent?: boolean
}

// Notification types
export interface NotificationOptions {
  title?: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  duration?: number
  persistent?: boolean
  actions?: Array<{
    label: string
    action: () => void
  }>
}

// Configuration types
export interface AppConfig {
  apiBaseUrl: string
  environment: 'development' | 'staging' | 'production'
  features: {
    [featureName: string]: boolean
  }
  limits: {
    fileUploadSize: number
    requestTimeout: number
    [key: string]: number
  }
  integrations: {
    paystack?: {
      publicKey: string
      enabled: boolean
    }
    sentry?: {
      dsn: string
      enabled: boolean
    }
    [key: string]: UnknownRecord | undefined
  }
}

// Type guards
export function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as ErrorWithMessage).message === 'string'
  )
}

export function isApiError(error: unknown): error is ApiError {
  return isErrorWithMessage(error) && 'statusCode' in error
}

export function isDatabaseError(error: unknown): error is DatabaseError {
  return isErrorWithMessage(error) && ('query' in error || 'params' in error)
}

export function isStringRecord(value: unknown): value is StringRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isUnknownRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
