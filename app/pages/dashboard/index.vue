<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <PageHeader
      title="Dashboard"
      :primary-action="{
        label: 'Add Client',
        icon: 'i-heroicons-plus',
        to: NEW_CLIENT_PATH,
      }"
    />

    <!-- Dashboard Content -->
    <div class="space-y-6">
      <!-- Stats Overview -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <UCard class="bg-white">
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="text-sm font-medium text-gray-500">Total Clients</h3>
              <UIcon name="i-heroicons-users" class="text-primary-500" />
            </div>
          </template>
          <div class="text-3xl font-bold">{{ dashboardData?.stats?.totalClients || 0 }}</div>
          <template #footer>
            <div class="text-sm text-gray-500">
              <span class="text-green-500 font-medium"
                >+{{ dashboardData?.stats?.newClientsThisMonth || 0 }}</span
              >
              this month
            </div>
          </template>
        </UCard>

        <UCard class="bg-white">
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="text-sm font-medium text-gray-500">Active Orders</h3>
              <UIcon name="i-heroicons-shopping-bag" class="text-primary-500" />
            </div>
          </template>
          <div class="text-3xl font-bold">{{ dashboardData?.stats?.activeOrders || 0 }}</div>
          <template #footer>
            <div class="text-sm text-gray-500">
              <span class="font-medium">{{
                dashboardData?.stats?.completedOrdersThisMonth || 0
              }}</span>
              completed this month
            </div>
          </template>
        </UCard>

        <UCard class="bg-white">
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="text-sm font-medium text-gray-500">Revenue</h3>
              <UIcon name="i-heroicons-banknotes" class="text-primary-500" />
            </div>
          </template>
          <div class="text-3xl font-bold">
            ₦{{ formatNumber(dashboardData?.stats?.totalRevenue || 0) }}
          </div>
          <template #footer>
            <div class="text-sm text-gray-500">
              <span class="text-green-500 font-medium"
                >+{{ dashboardData?.stats?.revenueGrowth || 0 }}%</span
              >
              vs last month
            </div>
          </template>
        </UCard>

        <UCard class="bg-white">
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="text-sm font-medium text-gray-500">Subscription</h3>
              <UIcon name="i-heroicons-credit-card" class="text-primary-500" />
            </div>
          </template>
          <div class="text-xl py-1 font-bold">
            {{ dashboardData?.stats?.subscriptionPlan || 'Free Plan' }}
          </div>
          <template #footer>
            <div class="text-sm text-gray-500">
              <span v-if="dashboardData?.stats?.clientsRemaining === Infinity"
                >Unlimited clients</span
              >
              <span v-else
                >{{ dashboardData?.stats?.clientsRemaining || 0 }} clients remaining</span
              >
            </div>
          </template>
        </UCard>
      </div>

      <!-- Recent Activity and Orders -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Recent Activity -->
        <UCard class="bg-white">
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="font-medium">Recent Activity</h3>
              <UButton
color="neutral"
variant="subtle"
to="/activity"
size="xs">
                View all
              </UButton>
            </div>
          </template>

          <div class="space-y-4">
            <template v-if="dashboardData?.activities?.length">
              <div
                v-for="activity in dashboardData?.activities"
                :key="activity.id"
                class="flex items-start space-x-3 py-2"
              >
                <div
                  class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0"
                >
                  <UIcon :name="activity.icon || 'i-heroicons-bell'" class="text-primary-600" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">
                    {{ activity.message || 'Activity' }}
                  </p>
                  <p class="text-xs text-gray-500">{{ activity.time || 'Recently' }}</p>
                </div>
              </div>
            </template>
            <div v-else class="text-center py-4">
              <p class="text-gray-500">No recent activity</p>
            </div>
          </div>
        </UCard>

        <!-- Due Orders -->
        <UCard class="bg-white">
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="font-medium">Orders Due Soon</h3>
              <UButton
color="neutral"
variant="subtle"
to="/orders"
size="xs"> View all </UButton>
            </div>
          </template>

          <div v-if="!dashboardData?.dueOrders?.length" class="text-center py-8">
            <p class="text-gray-500">No orders due soon</p>
          </div>

          <div v-else>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Client
                    </th>
                    <th
                      scope="col"
                      class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Due Date
                    </th>
                    <th
                      scope="col"
                      class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Amount
                    </th>
                    <th
                      scope="col"
                      class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    ></th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="order in dashboardData?.dueOrders" :key="order.id">
                    <td class="px-3 py-2 whitespace-nowrap">
                      <div class="font-medium text-gray-900">{{ order.client }}</div>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                      <UBadge :color="getDueDateColor(order.dueDate)" variant="subtle" size="sm">
                        {{ formatDueDate(order.dueDate) }}
                      </UBadge>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">₦{{ formatNumber(order.amount) }}</td>
                    <td class="px-3 py-2 whitespace-nowrap">
                      <UBadge :color="getStatusColor(order.status)" variant="subtle" size="sm">
                        {{ order.status }}
                      </UBadge>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap text-right">
                      <UButton
                        icon="i-heroicons-eye"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                        :to="`${ORDERS_PATH}/${order.id}`"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Client Growth Chart -->
      <UCard class="bg-white">
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="font-medium">Client Growth</h3>
            <USelect
              v-model="chartPeriod"
              :items="chartPeriodOptions"
              size="sm"
              @update:model-value="updateChartData"
            />
          </div>
        </template>

        <div class="h-64">
          <ClientGrowthChart
            ref="growthChart"
            :period="chartPeriod"
            :real-data="clientGrowth"
            :has-real-data="hasChartData"
          />
        </div>

        <template #footer>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600"
              >Total new clients:
              <span class="font-medium">{{ chartStats.totalGrowth }}</span></span
            >
            <span class="text-gray-600"
              >Growth:
              <span class="font-medium text-green-600">+{{ chartStats.percentGrowth }}%</span>
            </span>
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
// Import composables and UI components
import { computed, watch } from 'vue'
import { ROUTE_NAMES } from '~/constants/routes'

definePageMeta({
  middleware: 'setup-required',
})

// Initialize composables
const { user } = useAuth()
const {
  chartPeriod,
  clientGrowth,
  stats,
  recentActivity,
  dueOrders,
  isLoading,
  fetchDashboardData,
  setChartPeriod,
} = useDashboard()

// Chart period options
const chartPeriodOptions = [
  { label: 'Last 7 days', value: '7days' },
  { label: 'Last 30 days', value: '30days' },
  { label: 'Last 90 days', value: '90days' },
  { label: 'Last year', value: 'year' },
]

// Routes
const NEW_CLIENT_PATH = ROUTE_NAMES.DASHBOARD.CLIENTS.NEW
const ORDERS_PATH = ROUTE_NAMES.DASHBOARD.ORDERS.INDEX

// Set page metadata
useHead({
  title: 'Dashboard',
})

// Helper computed property to check if we have chart data to display
const hasChartData = computed(() => {
  return (
    clientGrowth.value?.labels?.length > 0 &&
    clientGrowth.value?.data?.length > 0 &&
    clientGrowth.value.data.some(value => value > 0)
  )
})

// Update chart data when period changes
const updateChartData = async (period: string | ChartPeriod) => {
  try {
    const chartPeriod = period as ChartPeriod
    await dashboardStore.fetchClientGrowth(chartPeriod)
  } catch (error) {
    console.error('Error updating chart data:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to update chart data',
      color: 'error',
    })
  }
}

// Update chart data when period changes
watch(chartPeriod, newPeriod => {
  if (newPeriod) {
    dashboardStore.fetchClientGrowth(newPeriod)
  }
})

// Format number with thousands separator
const formatNumber = (number: number) => {
  if (number === null || number === undefined) return '0'
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const formatDueDate = (date: string) => {
  if (!date) return 'No date set'

  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dueDate = new Date(date)
    const dueDateNoTime = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())

    const diffTime = dueDateNoTime.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`
    } else if (diffDays === 0) {
      return 'Due today'
    } else if (diffDays === 1) {
      return 'Due tomorrow'
    } else {
      return `Due in ${diffDays} days`
    }
  } catch (error) {
    console.error('Error formatting due date:', error)
    return 'Invalid date'
  }
}

// Get color for due date badge
const getDueDateColor = (date: string) => {
  if (!date) return 'neutral'

  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dueDate = new Date(date)
    const dueDateNoTime = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())

    const diffTime = dueDateNoTime.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return 'error'
    } else if (diffDays === 0) {
      return 'warning'
    } else if (diffDays <= 2) {
      return 'warning'
    } else {
      return 'success'
    }
  } catch (error) {
    console.error('Error getting due date color:', error)
    return 'neutral'
  }
}

// Get color for status badge
const getStatusColor = (status: string) => {
  if (!status) return 'neutral'

  switch (status.toLowerCase()) {
    case 'completed':
      return 'success'
    case 'in progress':
      return 'primary'
    case 'pending payment':
      return 'warning'
    case 'overdue':
      return 'error'
    default:
      return 'neutral'
  }
}

// Client growth data - using store action instead

// Function to fetch dashboard data with proper error handling
const fetchDashboardData = async () => {
  console.log('Fetching dashboard data...')

  // Check if we're on client side
  if (import.meta.client) {
    const token = authStore.token || localStorage.getItem('auth_token')

    if (!token) {
      console.error('No authentication token found')
      return getDefaultDashboardData()
    }

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }

    try {
      console.log('Starting dashboard API calls...')

      // First, check if API endpoints are defined
      if (!API_ENDPOINTS?.DASHBOARD) {
        console.error('API endpoints not properly configured')
        return getDefaultDashboardData()
      }

      const [stats, activities, dueOrders] = await Promise.allSettled([
        $fetch(API_ENDPOINTS.DASHBOARD.STATS, {
          method: 'GET',
          headers,
          retry: 1,
          retryDelay: 1000,
        }).catch(err => {
          console.error('Error fetching stats:', err)
          return null
        }),
        $fetch(API_ENDPOINTS.DASHBOARD.RECENT_ACTIVITY, {
          method: 'GET',
          params: { limit: 5 },
          headers,
          retry: 1,
          retryDelay: 1000,
        }).catch(err => {
          console.error('Error fetching recent activity:', err)
          return []
        }),
        $fetch(API_ENDPOINTS.DASHBOARD.ORDERS_DUE_SOON, {
          method: 'GET',
          params: { limit: 5 },
          headers,
          retry: 1,
          retryDelay: 1000,
        }).catch(err => {
          console.error('Error fetching due orders:', err)
          return []
        }),
      ])

      // Process the results with fallback values
      const result = {
        stats: getValidStats(stats),
        activities: getValidArray(activities, 'activities'),
        dueOrders: getValidArray(dueOrders, 'dueOrders'),
        clientGrowth: null,
      }

      console.log('Dashboard data fetched successfully:', result)
      return result
    } catch (error) {
      console.error('Error in fetchDashboardData:', error)
      return getDefaultDashboardData()
    }
  }

  // Return default data for server-side rendering
  return getDefaultDashboardData()
}

// Helper function to get default dashboard data
const getDefaultDashboardData = () => ({
  stats: {
    totalClients: 0,
    activeOrders: 0,
    revenue: 0,
    newClients: 0,
    newClientsThisMonth: 0,
    completedOrdersThisMonth: 0,
    totalRevenue: 0,
    revenueGrowth: 0,
    subscriptionPlan: 'Free Plan',
    clientsRemaining: 5,
  },
  activities: [],
  dueOrders: [],
  clientGrowth: null,
})

// Helper function to validate and get stats data
const getValidStats = (statsResult: any) => {
  if (statsResult.status === 'fulfilled' && statsResult.value) {
    return {
      totalClients: statsResult.value.totalClients || 0,
      activeOrders: statsResult.value.activeOrders || 0,
      revenue: statsResult.value.revenue || 0,
      newClients: statsResult.value.newClients || 0,
      newClientsThisMonth: statsResult.value.newClientsThisMonth || 0,
      completedOrdersThisMonth: statsResult.value.completedOrdersThisMonth || 0,
      totalRevenue: statsResult.value.totalRevenue || 0,
      revenueGrowth: statsResult.value.revenueGrowth || 0,
      subscriptionPlan: statsResult.value.subscriptionPlan || 'Free Plan',
      clientsRemaining:
        statsResult.value.clientsRemaining !== undefined ? statsResult.value.clientsRemaining : 5,
    }
  }
  return getDefaultDashboardData().stats
}

// Helper function to validate and get array data
const getValidArray = (result: any, type: string) => {
  if (result.status === 'fulfilled' && Array.isArray(result.value)) {
    return result.value
  }
  console.warn(`Invalid data received for ${type}, using empty array`)
  return []
}

// Fetch all dashboard data in a single request
const { data: dashboardData, status } = useAsyncData('dashboard-data', fetchDashboardData, {
  default: () => ({
    stats: null,
    activities: [],
    dueOrders: [],
    clientGrowth: null,
  }),
  immediate: true,
  server: false, // Ensure this only runs on client side
})

// Initialize toast
const toast = useToast()

// Watch for changes in the async data
watch(
  () => status.value,
  newStatus => {
    if (newStatus === 'success' && dashboardData.value) {
      // Update store with the fetched data
      dashboardStore.setStats(dashboardData.value.stats || null)
      dashboardStore.setRecentActivity(dashboardData.value.activities || [])
      dashboardStore.setDueOrders(dashboardData.value.dueOrders || [])
      dashboardStore.setError(null)

      // Fetch client growth data if we have a period selected
      if (chartPeriod.value) {
        dashboardStore.fetchClientGrowth(chartPeriod.value)
      }
    } else if (newStatus === 'error') {
      console.error('Error fetching dashboard data')
      const errorMessage = 'Failed to fetch dashboard data. Using cached data if available.'
      dashboardStore.setError(errorMessage)
      toast.add({
        title: 'Warning',
        description: errorMessage,
        color: 'warning',
      })
    }
  },
  { immediate: true }
)

// Chart stats computed property
const chartStats = computed(() => ({
  totalGrowth: hasChartData.value ? (clientGrowth.value?.totalGrowth ?? 0) : 0,
  percentGrowth: hasChartData.value ? (clientGrowth.value?.percentGrowth ?? 0) : 0,
}))
</script>
