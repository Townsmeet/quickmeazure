import type { H3Event, EventHandlerRequest } from 'h3'
import { createError } from 'h3'
import type { ApiResponse } from '~/types/api'
import { getRecentActivity, type ActivityItem } from '../../repositories/dashboardRepository'

export default defineEventHandler(
  async (event: H3Event<EventHandlerRequest>): Promise<ApiResponse<ActivityItem[]>> => {
    try {
      // Get authenticated user from event context
      const auth = event.context.auth
      if (!auth || !auth.userId) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Unauthorized',
        })
      }

      const query = getQuery(event)
      const limit = parseInt((query.limit as string) || '10')

      const activities = await getRecentActivity(auth.userId, limit)

      return {
        success: true,
        data: activities,
      }
    } catch (error: unknown) {
      console.error('Error in dashboard recent activity endpoint:', error)

      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }

      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch recent activities',
        message: 'Failed to fetch recent activities',
        statusCode: 500,
      }
    }
  }
)
