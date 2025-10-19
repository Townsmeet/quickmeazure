<template>
  <div class="space-y-6">
    <!-- Setup Modal (shown if setup is needed) -->
    <UModal v-model:open="showSetupModal">
      <template #content>
        <SetupModal />
      </template>
    </UModal>

    <!-- Page Header -->
    <PageHeader
      title="Dashboard"
      :primary-action="{
        label: 'Add Client',
        icon: 'i-heroicons-plus',
        to: '/clients/new',
      }"
    />

    <!-- Dashboard Content -->
    <div class="space-y-6">
      <div class="space-y-6">
        <div>
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <UCard class="bg-white">
              <template #header>
                <div class="flex justify-between items-center">
                  <h3 class="text-sm font-medium text-gray-500">Total Clients</h3>
                  <UIcon name="i-heroicons-users" class="text-primary-500" />
                </div>
              </template>
              <div class="text-3xl font-bold">{{ stats?.totalClients || 0 }}</div>
              <template #footer>
                <div class="text-sm text-gray-500">
                  <span class="text-green-500 font-medium"
                    >+{{ stats?.newClientsThisMonth || 0 }}</span
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
              <div class="text-3xl font-bold">{{ stats?.activeOrders || 0 }}</div>
              <template #footer>
                <div class="text-sm text-gray-500">
                  <span class="font-medium">
                    {{ stats?.completedOrdersThisMonth || 0 }}
                  </span>
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
              <div class="text-3xl font-bold">₦{{ formatNumber(stats?.totalRevenue || 0) }}</div>
              <template #footer>
                <div class="text-sm text-gray-500">
                  <span class="text-green-500 font-medium">+{{ stats?.revenueGrowth || 0 }}%</span>
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
                {{ stats?.subscriptionPlan || 'Free Plan' }}
              </div>
              <template #footer>
                <div class="text-sm text-gray-500">
                  <span v-if="stats?.clientsRemaining === Infinity">Unlimited clients</span>
                  <span v-else>{{ stats?.clientsRemaining || 0 }} clients remaining</span>
                </div>
              </template>
            </UCard>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div>
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Growth & Recent Activity</h2>
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Client Growth Chart -->
            <UCard class="lg:col-span-2 bg-white">
              <template #header>
                <div class="flex justify-between items-center">
                  <h3 class="text-sm font-medium text-gray-500">Client Growth</h3>
                  <USelect
                    v-model="chartPeriod"
                    :items="chartPeriodOptions"
                    size="sm"
                    class="w-40"
                    @update:model-value="updateChartData"
                  />
                </div>
              </template>
              <div class="h-80">
                <LineChart
                  v-if="chartData.length > 0"
                  :data="chartData"
                  :categories="chartCategories"
                  :height="300"
                  :x-formatter="xFormatter"
                  x-label="Period"
                  y-label="New Clients"
                />
                <div v-else class="h-full flex items-center justify-center text-gray-400">
                  No data available for the selected period
                </div>
              </div>
            </UCard>

            <!-- Recent Activity -->
            <UCard class="bg-white">
              <template #header>
                <div class="flex justify-between items-center">
                  <h3 class="text-sm font-medium text-gray-500">Recent Activity</h3>
                  <UButton
                    to="/activity"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    trailing-icon="i-heroicons-arrow-right"
                  >
                    View all
                  </UButton>
                </div>
              </template>
              <div class="space-y-4">
                <div v-if="recentActivity.length === 0" class="text-center py-8 text-gray-400">
                  No recent activity
                </div>
                <div
                  v-for="activity in recentActivity"
                  :key="activity.id"
                  class="flex items-start space-x-3"
                >
                  <div
                    class="flex-shrink-0 w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center"
                  >
                    <UIcon
                      :name="getActivityIcon(activity.type)"
                      class="h-4 w-4 text-primary-600"
                    />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-gray-900">
                      {{ activity.title }}
                    </p>
                    <p class="text-sm text-gray-500">{{ activity.description }}</p>
                    <p class="text-xs text-gray-400 mt-1">
                      {{ formatTimeAgo(activity.timestamp) }}
                    </p>
                  </div>
                </div>
              </div>
            </UCard>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div>
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Upcoming Due Orders</h2>
          <UCard class="bg-white">
            <template #header>
              <div class="flex justify-between items-center">
                <h3 class="text-sm font-medium text-gray-500">Upcoming Due Orders</h3>
                <UButton
                  to="/orders"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  trailing-icon="i-heroicons-arrow-right"
                >
                  View all
                </UButton>
              </div>
            </template>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Order ID
                    </th>
                    <th
                      scope="col"
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Client
                    </th>
                    <th
                      scope="col"
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Due Date
                    </th>
                    <th
                      scope="col"
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th scope="col" class="relative px-6 py-3">
                      <span class="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-if="dueOrders.length === 0">
                    <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">
                      No due orders
                    </td>
                  </tr>
                  <tr v-for="order in dueOrders" :key="order.id" class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{{ order.id }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ order.clientName }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <UBadge :color="getDueDateColor(order.dueDate)" variant="subtle">
                        {{ formatDueDate(order.dueDate) }}
                      </UBadge>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <UBadge
                        :color="getStatusColor(order.status).color"
                        variant="subtle"
                        :class="`bg-${getStatusColor(order.status).color}-50 text-${getStatusColor(order.status).color}-700`"
                      >
                        {{ order.status }}
                      </UBadge>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <UButton
                        :to="`/orders/${order.id}`"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                      >
                        View
                      </UButton>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTimeAgo } from '@vueuse/core'
import type { ChartPeriod } from '~/types/dashboard'

definePageMeta({
  middleware: ['auth', 'setup-required'],
  layout: 'dashboard',
})

// Initialize dashboard composable
const {
  stats,
  recentActivity,
  dueOrders,
  clientGrowth,
  chartPeriod,
  isLoading: _isDashboardLoading,
  fetchDashboardData,
} = useDashboard()

const { user } = useAuth()

// Set page metadata
useHead({
  title: 'Dashboard',
})

// Chart period options
const chartPeriodOptions = [
  { label: 'Last 7 days', value: '7days' },
  { label: 'Last 30 days', value: '30days' },
  { label: 'Last 90 days', value: '90days' },
  { label: 'Last year', value: 'year' },
]

// Prepare chart data for nuxt-charts
const chartData = computed(() => {
  if (!clientGrowth.value?.labels?.length || !clientGrowth.value?.data?.length) {
    return []
  }

  return clientGrowth.value.labels.map((label, index) => ({
    period: label,
    clients: clientGrowth.value.data[index] || 0,
  }))
})

// Chart categories configuration
const chartCategories = {
  clients: {
    name: 'New Clients',
    color: '#4f46e5', // Primary color
  },
}

// X-axis formatter
const xFormatter = (i: number) => chartData.value[i]?.period || ''

// Update chart data when period changes
const updateChartData = async (period: string | ChartPeriod | null | undefined) => {
  if (!period && period !== '') return // Handle null/undefined/empty string cases

  try {
    await fetchDashboardData(period as ChartPeriod)
  } catch (error) {
    console.error('Error updating chart data:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to update chart data',
      color: 'error',
    })
  }
}

// Format number with thousands separator
const formatNumber = (number: number) => {
  if (number === null || number === undefined) return '0'
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// Format due date
const formatDueDate = (date: string | undefined | null): string => {
  if (!date) return 'No date set'

  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dueDate = new Date(date)
    const dueDateNoTime = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())

    const diffTime = dueDateNoTime.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays === -1) return 'Yesterday'
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`

    return `In ${diffDays} days`
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Invalid date'
  }
}

// Get color for due date badge
const getDueDateColor = (
  date: string | undefined | null
): 'error' | 'warning' | 'info' | 'success' | 'neutral' => {
  if (!date) return 'neutral'

  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dueDate = new Date(date)
    const dueDateNoTime = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())

    const diffTime = dueDateNoTime.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'error' // Past due (red)
    if (diffDays === 0) return 'warning' // Due today (orange)
    if (diffDays <= 3) return 'warning' // Due in 1-3 days (yellow)
    if (diffDays <= 7) return 'info' // Due in 4-7 days (blue)
    return 'success' // Due in more than 7 days (green)
  } catch (error) {
    console.error('Error getting due date color:', error)
    return 'neutral'
  }
}

type BadgeColor = 'error' | 'success' | 'warning' | 'info' | 'neutral' | 'primary' | 'secondary'

// Get color for status badge
const getStatusColor = (status: string): { color: BadgeColor; icon: string } => {
  if (!status) return { color: 'neutral', icon: 'i-heroicons-question-mark-circle' }

  switch (status.toLowerCase()) {
    case 'completed':
      return { color: 'success', icon: 'i-heroicons-check-circle' }
    case 'in progress':
      return { color: 'primary', icon: 'i-heroicons-arrow-path' }
    case 'pending':
      return { color: 'warning', icon: 'i-heroicons-clock' }
    case 'cancelled':
      return { color: 'error', icon: 'i-heroicons-x-circle' }
    default:
      return { color: 'neutral', icon: 'i-heroicons-question-mark-circle' }
  }
}

// Get icon for activity type
const getActivityIcon = (type: string) => {
  switch (type) {
    case 'order':
      return 'i-heroicons-shopping-bag'
    case 'client':
      return 'i-heroicons-user'
    case 'payment':
      return 'i-heroicons-credit-card'
    default:
      return 'i-heroicons-bell'
  }
}

// Format time ago
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  return useTimeAgo(date).value
}

// Initialize toast
const toast = useToast()

// Watch for changes in the async data
watch(
  () => [stats.value, recentActivity.value, dueOrders.value, clientGrowth.value],
  () => {
    if (stats.value && recentActivity.value && dueOrders.value && clientGrowth.value) {
      // Data has been loaded, you can perform any additional logic here
    }
  },
  { immediate: true }
)

// Setup modal state
const showSetupModal = ref(true)

// Check if we should show setup modal
const checkSetupStatus = () => {
  if (user.value?.hasCompletedSetup) {
    showSetupModal.value = false
  }
}

// Check setup status when component mounts
onMounted(() => {
  checkSetupStatus()
})
</script>
