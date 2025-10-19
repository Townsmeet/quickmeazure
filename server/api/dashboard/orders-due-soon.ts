import type { H3Event, EventHandlerRequest } from 'h3'
import { createError } from 'h3'
import type { ApiResponse } from '~/types/api'
import { getOrdersDueSoon, type DueOrder } from '../../repositories/dashboardRepository'

export default defineEventHandler(
  async (event: H3Event<EventHandlerRequest>): Promise<ApiResponse<DueOrder[]>> => {
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

      const dueOrders = await getOrdersDueSoon(auth.userId, limit)

      return {
        success: true,
        data: dueOrders,
      }
    } catch (error: any) {
      console.error('Dashboard orders due soon API error:', error)

      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }

      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch orders due soon',
        message: 'Failed to fetch orders due soon',
        statusCode: 500,
      }
    }
  }
)
