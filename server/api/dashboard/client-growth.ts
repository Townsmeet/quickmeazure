import type { H3Event, EventHandlerRequest } from 'h3'
import { createError } from 'h3'
import type { ApiResponse } from '~/types/api'
import { getClientGrowth, type ClientGrowthData } from '../../repositories/dashboardRepository'

type ChartPeriod = '7days' | '30days' | '90days' | '1year' | 'year'

export default defineEventHandler(
  async (event: H3Event<EventHandlerRequest>): Promise<ApiResponse<ClientGrowthData>> => {
    try {
      // Get authenticated user from event context
      const auth = event.context.auth
      if (!auth || !auth.userId) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Unauthorized',
        })
      }

      // Parse query params
      const queryParams = getQuery(event)
      const period = (queryParams.period as ChartPeriod) || '30days'

      const clientGrowthData = await getClientGrowth(auth.userId, period)

      return {
        success: true,
        data: clientGrowthData,
      }
    } catch (error: any) {
      console.error('Dashboard client growth API error:', error)

      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }

      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch client growth',
        message: 'Failed to fetch client growth',
        statusCode: 500,
      }
    }
  }
)
