import type { Order as _Order } from './order'
import type { Client as _Client } from './client'

export interface DashboardStats {
  totalClients: number
  newClientsThisMonth: number
  activeOrders: number
  completedOrdersThisMonth: number
  totalRevenue: number
  revenueGrowth: number
  subscriptionPlan: string
  clientsRemaining: number | 'unlimited'
}

export interface ActivityItem {
  id: string
  type: string
  description: string
  timestamp: string
  userId: string
  userName: string
  userAvatar?: string
  link?: string
}

export interface ClientGrowthData {
  labels: string[]
  data: number[]
  totalGrowth: number
  percentGrowth: number
}

export type ChartPeriod = '7days' | '30days' | '90days' | 'year'
