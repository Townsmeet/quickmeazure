/**
 * Style and product related types
 */

export interface StyleMeasurement {
  value: number
  unit?: string
  notes?: string
}

export interface StyleTemplate {
  id: number
  name: string
  fields: Array<{
    id: string
    name: string
    type: string
    required: boolean
  }>
}

export interface Style {
  id: number
  userId?: number
  name: string
  description?: string | null
  imageUrl?: string | null
  imageUrls?: string[] | null
  category?: string | null
  type?: string | null
  tags?: string[]
  status?: 'active' | 'inactive' | 'draft' | 'archived'
  itemCount?: number
  details?: Record<string, string | number | boolean>
  measurements?: Record<string, StyleMeasurement>
  templateId?: number
  template?: StyleTemplate
  notes?: string | null
  clientId?: number
  client?: {
    id: number
    name: string
  }
  createdAt: Date | string
  updatedAt?: Date | string | null
}

export interface StyleFilterOptions {
  search?: string
  category?: string
  clientId?: number
  templateId?: number
  sortBy?: 'name' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface StyleStats {
  total: number
  byCategory: Array<{ category: string; count: number }>
  recentStyles: Style[]
}
