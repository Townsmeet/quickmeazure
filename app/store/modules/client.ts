import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Client, ClientStats } from '../../types/client'

export const useClientStore = defineStore('client', () => {
  // State
  const clients = ref<Client[]>([])
  const currentClient = ref<Client | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const stats = ref<ClientStats | null>(null)
  const totalCount = ref(0)

  /**
   * Set the clients list and total count
   */
  const setClients = (newClients: Client[], total: number) => {
    // Ensure all clients have the required fields with proper types
    clients.value = newClients.map(client => ({
      id: client.id,
      name: client.name || 'Unnamed Client',
      email: client.email ?? null,
      phone: client.phone ?? null,
      address: client.address ?? null,
      notes: client.notes ?? null,

      hasOrders: Boolean(client.hasOrders),
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    }))
    totalCount.value = total
    console.log('Clients set in store:', clients.value)
  }

  /**
   * Set the current client
   */
  const setCurrentClient = (client: Client | null) => {
    currentClient.value = client
  }

  /**
   * Add a new client to the store
   */
  const addClient = (client: Client) => {
    clients.value = [client, ...clients.value]
    totalCount.value++
    return client
  }

  /**
   * Update a client in the store
   */
  const updateClientInStore = (id: string | number, updates: Partial<Client>) => {
    const index = clients.value.findIndex(c => c.id === id)
    if (index !== -1) {
      clients.value[index] = { ...clients.value[index], ...updates }
    }
    if (currentClient.value?.id === id) {
      currentClient.value = { ...currentClient.value, ...updates }
    }
  }

  /**
   * Remove a client from the store
   */
  const removeClient = (id: string | number) => {
    clients.value = clients.value.filter(client => client.id !== id)
    totalCount.value = Math.max(0, totalCount.value - 1)

    if (currentClient.value?.id === id) {
      currentClient.value = null
    }
  }

  /**
   * Set client statistics
   */
  const setClientStats = (newStats: ClientStats | null) => {
    stats.value = newStats
  }

  // Note: Reset functionality is handled by the Pinia store's $reset() method

  return {
    // State
    clients,
    currentClient,
    isLoading,
    error,
    stats,
    totalCount,

    // Actions
    setClients,
    setCurrentClient,
    addClient,
    updateClientInStore,
    removeClient,
    setClientStats,
  }
})
