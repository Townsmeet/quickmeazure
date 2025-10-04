import { useApi } from './useApi'

export type BusinessProfile = {
  userId: string
  shopName?: string | null
  businessType?: string | null
  yearsInBusiness?: number | null
  businessDescription?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  specializations?: string | null
  services?: string | null
  createdAt?: string | Date | null
  updatedAt?: string | Date | null
}

export function useBusiness() {
  const { request, loading, error } = useApi()

  async function updateBusiness(payload: Partial<BusinessProfile>) {
    return await request<{ success: true; data: BusinessProfile }>(`/api/business`, {
      method: 'PUT',
      body: payload as any,
    })
  }

  return {
    updateBusiness,
    loading,
    error,
  }
}
