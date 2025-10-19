/**
 * Measurement related types
 */

import type { MeasurementValue } from './enhanced'

// Type for measurement values collection
export type MeasurementValues = Record<string, MeasurementValue>

export interface Measurement {
  id: number
  clientId: number
  values: MeasurementValues
  notes?: string
  lastUpdated: string
  createdAt: string
}

export interface MeasurementField {
  id: string | number
  name: string
  description?: string | null
  isRequired: boolean
  displayOrder: number
  metadata?: string | null
  category?: string // Derived from metadata for frontend convenience
  createdAt?: string
  updatedAt?: string
}

export interface MeasurementTemplate {
  id: string | number
  name: string
  unit: string // measurement unit for all fields in this template
  gender: 'male' | 'female' | 'unisex'
  fields: MeasurementField[]
  createdAt: string
  updatedAt?: string
  isDefault?: boolean
  isArchived?: boolean
  userId?: string | number
  // Legacy fields for backward compatibility
  description?: string
  category?: string
  isActive?: boolean
}

export interface ClientMeasurement {
  id: number
  clientId: number
  templateId: number
  values: MeasurementValues
  notes?: string
  lastUpdated: string
  createdAt: string
}

export interface MeasurementStats {
  total: number
  byClient: Record<number, number> // clientId: count
  lastUpdated: string | null
}

export interface MeasurementSettings {
  defaultUnit: 'cm' | 'in' | 'm'
}
