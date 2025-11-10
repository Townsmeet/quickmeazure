import { ref } from 'vue'

export type BusinessProfile = {
  userId: string
  businessName?: string | null
  yearsInBusiness?: number | null
  businessDescription?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  specializations?: string | null
  image?: string | null
  createdAt?: string | Date | null
  updatedAt?: string | Date | null
}

export function useBusiness() {
  const loading = ref(false)
  const error = ref<Error | null>(null)

  async function updateBusiness(payload: Partial<BusinessProfile> | FormData) {
    loading.value = true
    error.value = null

    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
      }

      // Only set Content-Type for non-FormData payloads
      if (!(payload instanceof FormData)) {
        headers['Content-Type'] = 'application/json'
      }

      const response = await $fetch<{
        success: boolean
        data: BusinessProfile
        error?: string
        message?: string
      }>('/api/business', {
        method: 'PUT',
        body: payload,
        headers,
      })
      return response
    } catch (err: any) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  async function getBusiness() {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean; data: BusinessProfile | null }>(
        '/api/business'
      )
      return response
    } catch (err: any) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    updateBusiness,
    getBusiness,
    loading,
    error,
  }
}
