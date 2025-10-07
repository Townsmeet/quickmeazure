interface Client {
  id: number
  name: string
  email?: string
  phone?: string
  address?: string
  gender?: 'male' | 'female'
  notes?: string
  createdAt: string
  updatedAt: string
}

interface CreateClientData {
  name: string
  email?: string
  phone?: string
  address?: string
  gender?: 'male' | 'female'
  notes?: string
}

interface ClientResponse {
  success: boolean
  data?: Client
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
    data: clientsData,
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

  // Get client by ID (using $fetch for individual client)
  const getClient = async (id: number): Promise<Client | null> => {
    error.value = null

    try {
      const response = await $fetch<ClientResponse>(`/api/clients/${id}`)

      if (response.success && response.data) {
        currentClient.value = response.data
        return response.data
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

  // Search clients (using $fetch)
  const searchClients = async (query: string): Promise<Client[]> => {
    error.value = null

    try {
      const response = await $fetch<ClientsResponse>('/api/clients/search', {
        query: { q: query },
      })

      if (response.success && response.data) {
        return response.data
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
