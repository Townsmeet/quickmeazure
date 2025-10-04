import { useApi } from './useApi'
import type { Ref } from 'vue'

export type Profile = {
  userId: string
  name?: string | null
  email?: string | null
  businessName?: string | null
  phone?: string | null
  location?: string | null
  bio?: string | null
  avatar?: string | null
  specializations?: string[] | string | null
  services?: string[] | string | null
  createdAt?: string | Date | null
  updatedAt?: string | Date | null
}

export function useProfile() {
  const { request, loading, error } = useApi()

  async function updateProfile(payload: Partial<Profile>) {
    return await request<{ success: true; data: Profile }>(`/api/profile`, {
      method: 'PUT',
      body: payload as any,
    })
  }

  return {
    updateProfile,
    loading,
    error,
  }
}
