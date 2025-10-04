import { eq, count, exists, desc, asc, sql, and } from 'drizzle-orm'
import { defineEventHandler, createError } from 'h3'
import { useDrizzle, tables } from '../../utils/drizzle'
import { ok, badRequest } from '../../validators'
import { z } from 'zod'

// Define event handler for GET requests
export default defineEventHandler(async event => {
  const method = getMethod(event)

  // Get authenticated user from event context
  const auth = event.context.auth
  console.log('Auth context:', auth)
  if (!auth || !auth.userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }
  console.log('Authenticated user ID:', auth.userId)

  const db = useDrizzle()

  // Handle GET request to fetch all clients
  if (method === 'GET') {
    try {
      // Validate query parameters
      const QuerySchema = z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(10),
        sortField: z.enum(['name', 'email', 'createdAt', 'updatedAt']).default('name'),
        sortOrder: z.enum(['asc', 'desc']).default('asc'),
        search: z.string().trim().optional(),
        hasOrders: z.union([z.literal('true'), z.literal('false')]).optional(),
      })
      const q = QuerySchema.parse(getQuery(event))
      const { page, limit, sortField, sortOrder, search } = q
      const hasOrdersFilter = q.hasOrders ? q.hasOrders === 'true' : undefined

      // Debug: Log query parameters
      console.log('Query parameters:', {
        page,
        limit,
        sortField,
        sortOrder,
        search,
        hasOrdersFilter,
      })

      // Calculate offset
      const offset = (page - 1) * limit

      // Build where conditions for filtering
      const whereConditions = []

      // Always filter by user ID (Better Auth string id)
      whereConditions.push(eq(tables.clients.userId, String(auth.userId)))
      console.log('Where conditions for user ID:', auth.userId)

      // Add search condition if provided
      if (search && search.trim() !== '') {
        whereConditions.push(
          sql`(lower(${tables.clients.name}) like ${`%${search.toLowerCase()}%`} OR 
              lower(${tables.clients.email}) like ${`%${search.toLowerCase()}%`} OR 
              ${tables.clients.phone} like ${`%${search}%`})`
        )
      }

      // Add orders filter if provided
      if (hasOrdersFilter !== undefined) {
        if (hasOrdersFilter) {
          whereConditions.push(
            exists(db.select().from(tables.orders).where(eq(tables.orders.clientId, tables.clients.id)))
          )
        } else {
          whereConditions.push(
            sql`NOT ${exists(db
              .select()
              .from(tables.orders)
              .where(eq(tables.orders.clientId, tables.clients.id)))}`
          )
        }
      }

      // Debug: Log whereConditions before building query
      console.log('whereConditions array:', whereConditions)
      console.log('whereConditions length:', whereConditions.length)

      // Build base query with all conditions
      const baseQuery = db
        .select({
          id: tables.clients.id,
          name: tables.clients.name,
          email: tables.clients.email,
          phone: tables.clients.phone,
          address: tables.clients.address,
          notes: tables.clients.notes,
          createdAt: tables.clients.createdAt,

          // Check if client has orders
          hasOrders: exists(
            db.select().from(tables.orders).where(eq(tables.orders.clientId, tables.clients.id))
          ),
        })
        .from(tables.clients)
        .where(and(...whereConditions))

      // Build count query with same conditions
      const countQuery = db
        .select({
          count: count(),
        })
        .from(tables.clients)
        .where(and(...whereConditions))

      // Determine sort direction
      const sortDirection = sortOrder === 'asc' ? asc : desc

      // Apply sorting
      let orderByClause
      switch (sortField) {
        case 'name':
          orderByClause = sortDirection(tables.clients.name)
          break
        case 'email':
          orderByClause = sortDirection(tables.clients.email)
          break
        case 'createdAt':
          orderByClause = sortDirection(tables.clients.createdAt)
          break
        case 'updatedAt':
          orderByClause = sortDirection(tables.clients.createdAt)
          break
        default:
          orderByClause = sortDirection(tables.clients.name)
          break
      }

      // Apply sorting, pagination, and execute query
      const clientsData = await baseQuery.orderBy(orderByClause).limit(limit).offset(offset)
      console.log('Query result - clients data:', clientsData)
      console.log('Number of clients found:', clientsData.length)

      // Get total count
      const totalCountResult = await countQuery
      const totalCount = totalCountResult[0]?.count || 0
      console.log('Total count result:', totalCountResult)
      console.log('Total count:', totalCount)

      // Calculate total pages
      const totalPages = Math.ceil(totalCount / limit)

      return ok({
        items: clientsData,
        pagination: { page, limit, totalCount, totalPages },
      })
    } catch (error) {
      console.error('Error fetching clients:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch clients',
      })
    }
  }

  // Handle POST request to create a new client
  if (method === 'POST') {
    try {
      const BodySchema = z.object({
        name: z.string().min(1),
        email: z.string().email().nullable().optional(),
        phone: z.string().max(40).nullable().optional(),
        address: z.string().max(200).nullable().optional(),
        notes: z.string().max(2000).nullable().optional(),
        measurements: z
          .object({
            values: z.record(z.any()).optional(),
            notes: z.string().nullable().optional(),
            additionalMeasurements: z.record(z.any()).optional(),
          })
          .optional(),
      })
      const body = BodySchema.parse(await readBody(event))

      // Create new client
      const newClient = await db
        .insert(tables.clients)
        .values({
          name: body.name,
          email: body.email || null,
          phone: body.phone || null,
          address: body.address || null,
          notes: body.notes || null,
          userId: String(auth.userId),
        })
        .returning()

      // If client was created successfully and measurements are provided
      if (newClient.length > 0 && body.measurements) {
        const clientId = newClient[0].id

        // Process measurements for the current database schema
        const processedMeasurements = {
          clientId,
          // Store all measurements in the values field
          values: {} as Record<string, any>,
          notes: body.measurements.notes || null,
          lastUpdated: new Date(),
        }

        // Extract values from the client request
        // If the client is sending data in the new format (with values field)
        if (body.measurements.values) {
          processedMeasurements.values = body.measurements.values
        }
        // Handle legacy format where measurements are sent as individual fields
        else {
          // Remove non-measurement fields
          const { notes: _notes, templateId: _templateId, ...measurementData } = body.measurements

          // Process each measurement field
          Object.entries(measurementData).forEach(([key, value]) => {
            // Skip empty values and non-measurement fields
            if (value === null || value === '' || typeof value === 'object' || value === undefined)
              return

            // Add to values with basic metadata
            processedMeasurements.values[key] = {
              value: parseFloat(String(value)),
              unit: 'in', // Default unit
              name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
            }
          })

          // If additionalMeasurements exists, merge it into values
          if (body.measurements.additionalMeasurements) {
            Object.entries(body.measurements.additionalMeasurements).forEach(([key, value]) => {
              processedMeasurements.values[key] = value
            })
          }
        }

        // Create measurement record
        await db.insert(tables.measurements).values(processedMeasurements)
      }

      return ok(newClient[0])
    } catch (error) {
      console.error('Error creating client:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create client',
      })
    }
  }

  // If method is not supported
  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed',
  })
})
