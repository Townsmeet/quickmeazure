import { db } from '../../utils/drizzle'
import * as tables from '../../database/schema'
import { eq } from 'drizzle-orm'

// Define event handler
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

  // Get client ID from params
  const id = parseInt(event.context.params?.id || '')
  if (isNaN(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid client ID',
    })
  }

  // Verify client belongs to authenticated user
  const clientData = await db
    .select()
    .from(tables.clients)
    .where(eq(tables.clients.id, id))
    .limit(1)

  if (clientData.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Client not found',
    })
  }

  if (clientData[0].userId !== auth.userId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied',
    })
  }

  // Handle GET request to fetch a single client with tables.measurements
  if (method === 'GET') {
    try {
      // Get client measurement data
      const measurementData = await db
        .select()
        .from(tables.measurements)
        .where(eq(tables.measurements.clientId, id))
        .limit(1)

      // Combine client and measurement data
      const measurement = measurementData.length > 0 ? measurementData[0] : null

      // Parse JSON values if measurement exists
      if (measurement && measurement.values) {
        try {
          // Assign parsed object to a new property to avoid type conflict
          ;(measurement as any).parsedValues = JSON.parse(measurement.values)
        } catch (error) {
          if (typeof console !== 'undefined' && typeof console.error === 'function') {
            console.error('Failed to parse measurement values:', error)
          }
          ;(measurement as any).parsedValues = {}
        }
      }

      // Ensure gender is included in response (even if null)
      return {
        success: true,
        data: {
          ...clientData[0],
          gender: (clientData[0] as any).gender ?? null,
          measurement,
        },
      }
    } catch (error) {
      console.error('Error fetching client:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch client',
        message: 'Failed to fetch client',
      }
    }
  }

  // Handle PUT request to update a client and possibly its tables.measurements
  if (method === 'PUT') {
    try {
      const body = await readBody(event)

      // Validate required fields
      if (!body.name) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Name is required',
        })
      }

      // Update client
      await db
        .update(tables.clients)
        .set({
          name: body.name,
          email: body.email || null,
          phone: body.phone || null,
          address: body.address || null,
          notes: body.notes || null,
        })
        .where(eq(tables.clients.id, id))

      // Handle measurements
      if (body.measurements) {
        // Check if measurement exists for this client
        const existingMeasurement = await db
          .select()
          .from(tables.measurements)
          .where(eq(tables.measurements.clientId, id))
          .limit(1)

        // Process measurements for the new schema
        const processedMeasurements = {
          // Store all measurements in the values field as JSON string
          values: JSON.stringify(body.measurements.values || {}),
          notes: body.measurements.notes || null,
          updatedAt: new Date(),
        }

        // Update or create measurement
        if (existingMeasurement.length > 0) {
          // Update existing measurement
          await db
            .update(tables.measurements)
            .set(processedMeasurements)
            .where(eq(tables.measurements.clientId, id))
        } else {
          // Create new measurement
          await db.insert(tables.measurements).values({
            ...processedMeasurements,
            clientId: id,
          })
        }
      }

      // Return updated client with measurements
      const updatedClient = await db
        .select()
        .from(tables.clients)
        .where(eq(tables.clients.id, id))
        .limit(1)

      const updatedMeasurement = await db
        .select()
        .from(tables.measurements)
        .where(eq(tables.measurements.clientId, id))
        .limit(1)

      const measurement = updatedMeasurement.length > 0 ? updatedMeasurement[0] : null

      // Parse JSON values if measurement exists
      if (measurement && measurement.values) {
        try {
          ;(measurement as any).parsedValues = JSON.parse(measurement.values)
        } catch (error) {
          if (typeof console !== 'undefined' && typeof console.error === 'function') {
            console.error('Failed to parse measurement values:', error)
          }
          ;(measurement as any).parsedValues = {}
        }
      }

      return {
        success: true,
        data: {
          ...updatedClient[0],
          measurement,
        },
      }
    } catch (error) {
      console.error('Error updating client:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update client',
        message: 'Failed to update client',
      }
    }
  }

  // Handle DELETE request to delete a client
  if (method === 'DELETE') {
    try {
      // Delete associated measurements first (to maintain referential integrity)
      await db.delete(tables.measurements).where(eq(tables.measurements.clientId, id))

      // Delete client
      await db.delete(tables.clients).where(eq(tables.clients.id, id))

      return { success: true, data: { deleted: true } }
    } catch (error) {
      console.error('Error deleting client:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete client',
        message: 'Failed to delete client',
      }
    }
  }

  // If method not supported
  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed',
  })
})
