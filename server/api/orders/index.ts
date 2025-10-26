import { eq, and, desc, asc, sql, count } from 'drizzle-orm'
import { defineEventHandler, createError, getMethod, getQuery, readBody } from 'h3'
import { db } from '../../utils/drizzle'
import * as tables from '../../database/schema'
import { z } from 'zod'
import { processTimestamps } from '../../utils/timestamps'

// Define event handler for orders API
export default defineEventHandler(async event => {
  const method = getMethod(event)

  // Get authenticated user from event context
  const auth = event.context.auth
  if (!auth || !auth.userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  // Handle GET request to fetch all orders
  if (method === 'GET') {
    try {
      // Validate query parameters
      const QuerySchema = z.object({
        clientId: z.coerce.number().int().optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(10),
        sortField: z
          .enum(['createdAt', 'updatedAt', 'dueDate', 'status', 'totalAmount', 'client'])
          .default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
        search: z.string().trim().optional(),
        status: z.string().trim().optional(),
        dueDateStart: z.string().optional(),
        dueDateEnd: z.string().optional(),
      })
      const {
        clientId,
        page,
        limit,
        sortField,
        sortOrder,
        search,
        status,
        dueDateStart,
        dueDateEnd,
      } = QuerySchema.parse(getQuery(event))

      // Validate pagination parameters
      if (isNaN(page) || page < 1) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid page parameter',
        })
      }

      if (isNaN(limit) || limit < 1 || limit > 100) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid limit parameter (must be between 1 and 100)',
        })
      }

      // Calculate offset
      const offset = (page - 1) * limit

      // Build where conditions for filtering
      const whereConditions = []

      // Always filter by user ID (via clients table) - Better Auth string id
      whereConditions.push(eq(tables.clients.userId, String(auth.userId)))

      // Add client filter if provided
      if (clientId) {
        whereConditions.push(eq(tables.orders.clientId, clientId))
      }

      // Add search filter if provided
      if (search && search.trim() !== '') {
        whereConditions.push(
          sql`(lower(${tables.clients.name}) like ${`%${search.toLowerCase()}%`} OR
               ${tables.orders.id} like ${`%${search}%`})`
        )
      }

      // Add status filter if provided
      if (status) {
        whereConditions.push(eq(tables.orders.status, status))
      }

      // Add due date range filters if provided
      if (dueDateStart) {
        whereConditions.push(sql`${tables.orders.dueDate} >= ${dueDateStart}`)
      }

      if (dueDateEnd) {
        whereConditions.push(sql`${tables.orders.dueDate} <= ${dueDateEnd}`)
      }

      // Build base query with all conditions
      const baseQuery = db
        .select({
          id: tables.orders.id,
          clientId: tables.orders.clientId,
          dueDate: tables.orders.dueDate,
          totalAmount: tables.orders.totalAmount,
          status: tables.orders.status,
          description: tables.orders.description,
          details: tables.orders.details,
          createdAt: tables.orders.createdAt,
          updatedAt: tables.orders.updatedAt,
          // Include client name for display
          clientName: tables.clients.name,
          // Include style name if available
          styleName: tables.styles.name,
          styleImageUrl: tables.styles.imageUrl,
        })
        .from(tables.orders)
        .innerJoin(tables.clients, eq(tables.orders.clientId, tables.clients.id))
        .leftJoin(tables.measurements, eq(tables.measurements.clientId, tables.clients.id))
        .leftJoin(
          tables.styles,
          eq(
            tables.styles.id,
            sql`CAST(json_extract(${tables.orders.details}, '$.styleId') AS INTEGER)`
          )
        )
        .where(and(...whereConditions))

      // Build count query with same conditions
      const countQuery = db
        .select({
          count: count(),
        })
        .from(tables.orders)
        .innerJoin(tables.clients, eq(tables.orders.clientId, tables.clients.id))
        .where(and(...whereConditions))

      // Determine sort direction
      const sortDirection = sortOrder === 'asc' ? asc : desc

      // Apply sorting
      let orderByClause
      switch (sortField) {
        case 'client':
          orderByClause = sortDirection(tables.clients.name)
          break
        case 'dueDate':
          orderByClause = sortDirection(tables.orders.dueDate)
          break
        case 'status':
          orderByClause = sortDirection(tables.orders.status)
          break
        case 'totalAmount':
          orderByClause = sortDirection(tables.orders.totalAmount)
          break
        case 'createdAt':
          orderByClause = sortDirection(tables.orders.createdAt)
          break
        case 'updatedAt':
          orderByClause = sortDirection(tables.orders.updatedAt)
          break
        default:
          orderByClause = sortDirection(tables.orders.createdAt)
          break
      }

      // Apply sorting, pagination, and execute query
      const ordersData = await baseQuery.orderBy(orderByClause).limit(limit).offset(offset)

      // Get total count
      const countResult = await countQuery
      const total = countResult[0]?.count || 0

      // Calculate total pages
      const totalPages = Math.ceil(total / limit)

      // Parse details JSON text and process timestamps
      const items = ordersData.map(o => {
        let details: any = null
        if (typeof o.details === 'string' && o.details) {
          try {
            details = JSON.parse(o.details as unknown as string)
          } catch {
            details = o.details
          }
        }

        // Process timestamps to ensure proper formatting
        return processTimestamps({ ...o, details }, ['createdAt', 'updatedAt'])
      })

      // Return data with pagination info
      return {
        success: true,
        data: items,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch orders',
        message: 'Failed to fetch orders',
      }
    }
  }

  // Handle POST request to create a new order
  if (method === 'POST') {
    try {
      const BodySchema = z.object({
        clientId: z.coerce.number().int(),
        totalAmount: z.coerce.number(),
        dueDate: z.string().nullable().optional(),
        status: z.string().default('Pending').optional(),
        description: z.string().nullable().optional(),
        styleId: z.coerce.number().int().nullable().optional(),
        measurementId: z.coerce.number().int().nullable().optional(),
        depositAmount: z.coerce.number().nullable().optional(),
        notes: z.string().nullable().optional(),
      })
      const body = BodySchema.parse(await readBody(event))

      // Verify client exists and belongs to user
      const clientExists = await db
        .select()
        .from(tables.clients)
        .where(
          and(eq(tables.clients.id, body.clientId), eq(tables.clients.userId, String(auth.userId)))
        )

      if (clientExists.length === 0) {
        throw createError({ statusCode: 404, statusMessage: 'Client not found' })
      }

      // Store additional details in the details JSON text field
      const orderDetails = {
        styleId: body.styleId ?? null,
        measurementId: body.measurementId ?? null,
        depositAmount: body.depositAmount ?? 0,
        balanceAmount: body.totalAmount - (body.depositAmount ?? 0),
        notes: body.notes ?? null,
      }

      // Create new order
      const newOrder = {
        clientId: body.clientId,
        dueDate: body.dueDate ?? null,
        totalAmount: body.totalAmount,
        status: body.status ?? 'Pending',
        description: body.description ?? null,
        details: JSON.stringify(orderDetails),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = await db.insert(tables.orders).values(newOrder).returning()
      const insertedOrder = result[0]

      // Enrich with client and style info
      let styleName: string | null = null
      let styleImageUrl: string | null = null
      if (body.styleId) {
        const s = await db
          .select({ name: tables.styles.name, imageUrl: tables.styles.imageUrl })
          .from(tables.styles)
          .where(eq(tables.styles.id, body.styleId))
          .limit(1)
        styleName = s[0]?.name ?? null
        styleImageUrl = s[0]?.imageUrl ?? null
      }

      return {
        success: true,
        data: {
          ...insertedOrder,
          details: orderDetails,
          clientName: clientExists[0].name,
          styleName,
          styleImageUrl,
        },
      }
    } catch (error) {
      console.error('Error creating order:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create order',
        message: 'Failed to create order',
      }
    }
  }

  // If method is not supported
  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed',
  })
})
