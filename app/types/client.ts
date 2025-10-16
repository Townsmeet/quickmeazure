/**
 * Client related types
 */

export interface Client {
  id: number
  userId?: number
  firstName: string
  lastName: string
  name?: string // computed property for backward compatibility
  email?: string | null
  phone?: string | null
  address?: string | null
  notes?: string | null
  isActive?: boolean
  hasOrders?: boolean
  orderCount?: number
  createdAt: string
  updatedAt?: string
}

export interface ClientMeasurement {
  id: number
  clientId: number
  values: Record<string, string | number>
  notes?: string
  lastUpdated: string
  createdAt: string
}

export interface ClientFilterOptions {
  search?: string
  sortBy?: 'name' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface ClientStats {
  total: number
  withMeasurements: number
  averageMeasurements: number
}
