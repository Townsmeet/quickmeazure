import type { Client } from '~/types/client'

interface CreateClientData {
  name: string
  gender?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  notes?: string | null
  measurements?: {
    values?: Record<string, any>
    notes?: string
    additionalMeasurements?: Record<string, any>
  }
}

interface ClientResponse {
  success: boolean
  data?: Client | null
  message?: string
}

interface ClientsResponse {
  success: boolean
  data?: Client[]
  message?: string
}

export const useClients = () => {
  // State
  const clients = useState<Client[]>('clients', () => [])
  const currentClient = useState<Client | null>('current_client', () => null)
  const error = useState<string | null>('clients_error', () => null)

  // Data fetching with useFetch
  const {
    data: _clientsData,
    pending: isLoading,
    refresh: refreshClients,
  } = useFetch<ClientsResponse>('/api/clients', {
    server: false,
    default: () => ({ success: false, data: [] }) as ClientsResponse,
    onResponse({ response }) {
      const responseData = response._data as ClientsResponse
      if (responseData?.success && responseData?.data) {
        clients.value = responseData.data
      }
    },
    onResponseError({ error: fetchError }) {
      error.value = fetchError?.message || 'Failed to fetch clients'
    },
  })

  // Fetch all clients (for compatibility)
  const fetchClients = async (): Promise<Client[]> => {
    await refreshClients()
    return clients.value
  }

  // Get client by ID (using useFetch for individual client)
  const getClient = async (id: number): Promise<Client | null> => {
    error.value = null

    try {
      const { data } = await useFetch<ClientResponse>(`/api/clients/${id}`, {
        server: false,
        default: () => ({ success: false, data: undefined }) as ClientResponse,
      })

      const responseData = data.value as ClientResponse
      if (responseData?.success && responseData?.data) {
        currentClient.value = responseData.data
        return responseData.data
      }

      return null
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch client'
      return null
    }
  }

  // Create client (mutation with $fetch)
  const createClient = async (data: CreateClientData): Promise<ClientResponse> => {
    error.value = null

    try {
      const response = await $fetch<ClientResponse>('/api/clients', {
        method: 'POST',
        body: data,
      })

      if (response.success && response.data) {
        clients.value.push(response.data)
        await refreshClients()
      }

      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to create client'
      return {
        success: false,
        message: error.value || undefined,
      }
    }
  }

  // Update client (mutation with $fetch)
  const updateClient = async (
    id: number,
    updates: Partial<CreateClientData>
  ): Promise<ClientResponse> => {
    error.value = null

    try {
      const response = await $fetch<ClientResponse>(`/api/clients/${id}`, {
        method: 'PUT',
        body: updates,
      })

      if (response.success && response.data) {
        const index = clients.value.findIndex(c => c.id === id)
        if (index !== -1) {
          clients.value[index] = response.data
        }

        // Update current client if it's the one being edited
        if (currentClient.value?.id === id) {
          currentClient.value = response.data
        }

        await refreshClients()
      }

      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to update client'
      return {
        success: false,
        message: error.value || undefined,
      }
    }
  }

  // Delete client (mutation with $fetch)
  const deleteClient = async (id: number): Promise<boolean> => {
    error.value = null

    try {
      const response = await $fetch<{ success: boolean }>(`/api/clients/${id}`, {
        method: 'DELETE',
      })

      if (response.success) {
        clients.value = clients.value.filter(c => c.id !== id)

        // Clear current client if it's the one being removed
        if (currentClient.value?.id === id) {
          currentClient.value = null
        }

        await refreshClients()
      }

      return response.success
    } catch (err: any) {
      error.value = err.message || 'Failed to delete client'
      return false
    }
  }

  // Search clients (using useFetch)
  const searchClients = async (query: string): Promise<Client[]> => {
    error.value = null

    try {
      const { data } = await useFetch<ClientsResponse>('/api/clients/search', {
        query: { q: query },
        server: false,
        default: () => ({ success: false, data: [] }) as ClientsResponse,
      })

      const responseData = data.value as ClientsResponse
      if (responseData?.success && responseData?.data) {
        return responseData.data
      }

      return []
    } catch (err: any) {
      error.value = err.message || 'Failed to search clients'
      return []
    }
  }

  // Local state management
  const setCurrentClient = (client: Client | null) => {
    currentClient.value = client
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    clients: readonly(clients),
    currentClient: readonly(currentClient),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // API Actions
    fetchClients,
    getClient,
    createClient,
    updateClient,
    deleteClient,
    searchClients,

    // Refresh Actions
    refreshClients,

    // Local State Actions
    setCurrentClient,
    clearError,
  }
}
