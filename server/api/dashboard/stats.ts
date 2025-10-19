import type { H3Event, EventHandlerRequest } from 'h3'
import { createError } from 'h3'
import type { ApiResponse } from '~/types/api'
import { getDashboardStats, type DashboardStats } from '../../repositories/dashboardRepository'

export default defineEventHandler(
  async (event: H3Event<EventHandlerRequest>): Promise<ApiResponse<DashboardStats>> => {
    try {
      // Authentication check
      const auth = event.context.auth
      if (!auth?.userId) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Unauthorized',
        })
      }

      const stats = await getDashboardStats(auth.userId)

      return {
        success: true,
        data: stats,
      }
    } catch (error) {
      console.error('Error in dashboard stats endpoint:', error)

      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }

      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard statistics',
        message: 'Failed to fetch dashboard statistics',
        statusCode: 500,
      }
    }
  }
)
