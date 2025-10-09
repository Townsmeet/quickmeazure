export interface MeasurementField {
  id: string | number
  name: string
  unit: string
}

export interface MeasurementTemplate {
  id: string | number
  name: string
  description: string
  category: string
  fields: MeasurementField[]
  createdAt: string
  updatedAt?: string
  isActive?: boolean
  isDefault?: boolean
  userId?: string | number
}
