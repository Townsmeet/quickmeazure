import type { H3Event, EventHandlerRequest } from 'h3'
import { createError } from 'h3'
import { count } from 'drizzle-orm'
import { db } from '../../utils/drizzle'
import * as tables from '../../database/schema'

interface GrowthItem {
  date: string
  count: number
}

interface ClientGrowthResponse {
  labels: string[]
  data: number[]
  totalGrowth: number
  percentGrowth: number
}

export default defineCachedEventHandler(async (event: H3Event<EventHandlerRequest>) => {
  try {
    console.log('Client growth API endpoint called')

    // Get authenticated user from event context
    const auth = event.context.auth
    if (!auth || !auth.userId) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized',
      })
    }

    const userId = auth.userId
    console.log('User ID:', userId)

    // Parse query params
    const queryParams = getQuery(event)
    const period = (queryParams.period as string) || '30days'
    console.log('Period requested:', period)

    // Calculate date ranges based on period
    const now = new Date()
    let startDate: Date
    let groupingFormat: string
    const labels: string[] = []

    switch (period) {
      case '7days':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
        groupingFormat = 'day'

        // Generate daily labels for the last 7 days
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now)
          d.setDate(now.getDate() - i)
          labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
        }
        break

      case '30days':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 30)
        groupingFormat = 'day'

        // Generate weekly labels for the last 30 days
        for (let i = 4; i >= 0; i--) {
          const d = new Date(now)
          d.setDate(now.getDate() - i * 7)
          labels.push(`Week ${5 - i}`)
        }
        break

      case '90days':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 90)
        groupingFormat = 'month'

        // Generate monthly labels for the last 3 months
        for (let i = 2; i >= 0; i--) {
          const d = new Date(now)
          d.setMonth(now.getMonth() - i)
          labels.push(d.toLocaleDateString('en-US', { month: 'short' }))
        }
        break

      case 'year':
        startDate = new Date(now)
        startDate.setFullYear(now.getFullYear() - 1)
        groupingFormat = 'month'

        // Generate monthly labels for the last 12 months
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now)
          d.setMonth(now.getMonth() - i)
          labels.push(d.toLocaleDateString('en-US', { month: 'short' }))
        }
        break

      default:
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 30)
        groupingFormat = 'day'

        // Default to weekly labels for 30 days
        for (let i = 4; i >= 0; i--) {
          const d = new Date(now)
          d.setDate(now.getDate() - i * 7)
          labels.push(`Week ${5 - i}`)
        }
    }

    console.log('Date range:', {
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      groupingFormat,
      generatedLabels: labels,
    })

    // Format dates for SQL
    const startDateStr = startDate.toISOString()
    const nowStr = now.toISOString()

    // Get client counts by date group
    let clientGrowthData: GrowthItem[] = []

    try {
      if (groupingFormat === 'day') {
        // Daily grouping (for 7 or 30 days)
        console.log('Executing daily grouping query')
        const result = await db.execute(sql`
          SELECT 
            DATE_TRUNC('day', "created_at") as date,
            COUNT(*) as count
          FROM clients
          WHERE 
            "user_id" = ${userId} AND
            "created_at" >= ${startDateStr} AND
            "created_at" <= ${nowStr}
          GROUP BY DATE_TRUNC('day', "created_at")
          ORDER BY date ASC
        `)

        console.log('Daily query result:', result.rows)

        clientGrowthData = result.rows.map(row => ({
          date: row.date?.toString() || '',
          count: parseInt(row.count as string) || 0,
        }))
      } else {
        // Monthly grouping (for 90 days or year)
        console.log('Executing monthly grouping query')
        const result = await db.execute(sql`
          SELECT 
            DATE_TRUNC('month', "created_at") as date,
            COUNT(*) as count
          FROM clients
          WHERE 
            "user_id" = ${userId} AND
            "created_at" >= ${startDateStr} AND
            "created_at" <= ${nowStr}
          GROUP BY DATE_TRUNC('month', "created_at")
          ORDER BY date ASC
        `)

        console.log('Monthly query result:', result.rows)

        clientGrowthData = result.rows.map(row => ({
          date: row.date?.toString() || '',
          count: parseInt(row.count as string) || 0,
        }))
      }

      console.log('Processed growth data:', clientGrowthData)
    } catch (queryError) {
      console.error('Error executing client growth query:', queryError)
      // Return a default empty response rather than failing
      return {
        labels,
        data: new Array(labels.length).fill(0),
        totalGrowth: 0,
        percentGrowth: 0,
      } as ClientGrowthResponse
    }

    // Calculate total clients before the period for growth calculation
    const totalPreviousResult = await db
      .select({ count: count() })
      .from(tables.clients)
      .where(
        and(eq(tables.clients.userId, userId), sql`${tables.clients.createdAt} < ${startDateStr}`)
      )

    const totalPrevious = totalPreviousResult[0]?.count || 0
    console.log('Total previous clients:', totalPrevious)

    // Calculate total clients during the period
    const totalCurrentPeriod = clientGrowthData.reduce((sum, item) => sum + item.count, 0)
    console.log('Total new clients in period:', totalCurrentPeriod)

    // Calculate percentage growth
    let percentGrowth = 0
    if (totalPrevious > 0) {
      percentGrowth = Math.round((totalCurrentPeriod / totalPrevious) * 100)
    } else if (totalCurrentPeriod > 0) {
      percentGrowth = 100 // If no previous clients, but new clients added, show 100%
    }
    console.log('Calculated percent growth:', percentGrowth)

    // Format the response based on the selected period
    let formattedData: number[] = []

    if (period === '7days') {
      // For 7 days, we want daily data
      formattedData = new Array(7).fill(0)

      clientGrowthData.forEach(item => {
        if (!item.date) return

        try {
          const date = new Date(item.date)
          const dayIndex = 6 - Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
          if (dayIndex >= 0 && dayIndex < 7) {
            formattedData[dayIndex] = item.count
          }
        } catch (error) {
          console.error('Error processing date:', item.date, error)
        }
      })
    } else if (period === '30days') {
      // For 30 days, we aggregate into weeks
      formattedData = new Array(5).fill(0)

      clientGrowthData.forEach(item => {
        if (!item.date) return

        try {
          const date = new Date(item.date)
          const dayDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
          if (dayDiff >= 0 && dayDiff <= 30) {
            const weekIndex = Math.min(4, Math.floor(dayDiff / 7))
            formattedData[4 - weekIndex] += item.count
          }
        } catch (error) {
          console.error('Error processing date:', item.date, error)
        }
      })
    } else if (period === '90days') {
      // For 90 days, we aggregate into months
      formattedData = new Array(3).fill(0)

      clientGrowthData.forEach(item => {
        if (!item.date) return

        try {
          const date = new Date(item.date)
          const monthsDiff =
            now.getMonth() - date.getMonth() + 12 * (now.getFullYear() - date.getFullYear())

          if (monthsDiff >= 0 && monthsDiff < 3) {
            formattedData[2 - monthsDiff] += item.count
          }
        } catch (error) {
          console.error('Error processing date:', item.date, error)
        }
      })
    } else if (period === 'year') {
      // For a year, we want monthly data
      formattedData = new Array(12).fill(0)

      clientGrowthData.forEach(item => {
        if (!item.date) return

        try {
          const date = new Date(item.date)
          const monthsDiff =
            now.getMonth() - date.getMonth() + 12 * (now.getFullYear() - date.getFullYear())

          if (monthsDiff >= 0 && monthsDiff < 12) {
            formattedData[11 - monthsDiff] += item.count
          }
        } catch (error) {
          console.error('Error processing date:', item.date, error)
        }
      })
    }

    // Make sure we always return data, even if empty
    const response = {
      labels,
      data: formattedData,
      totalGrowth: totalCurrentPeriod,
      percentGrowth,
    } as ClientGrowthResponse

    console.log('Client growth API response:', response)
    return response
  } catch (error: any) {
    console.error('Dashboard client growth API error:', error)

    // Return empty data instead of error to keep dashboard working
    return {
      labels: [],
      data: [],
      totalGrowth: 0,
      percentGrowth: 0,
    } as ClientGrowthResponse
  }
})
