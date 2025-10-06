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
      return {
        ...clientData[0],
        measurement: measurementData.length > 0 ? measurementData[0] : null,
      }
    } catch (error) {
      console.error('Error fetching client:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch client',
      })
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

      // Handle tables.measurements
      if (body.tables.measurements) {
        // Check if measurement exists for this client
        const existingMeasurement = await db
          .select()
          .from(tables.measurements)
          .where(eq(tables.measurements.clientId, id))
          .limit(1)

        // Process tables.measurements for the new schema
        const processedMeasurements = {
          // Store all tables.measurements in the values field
          values: body.tables.measurements.values || {},
          notes: body.tables.measurements.notes || null,
          lastUpdated: new Date(),
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

      // Return updated client with tables.measurements
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

      return {
        ...updatedClient[0],
        measurement: updatedMeasurement.length > 0 ? updatedMeasurement[0] : null,
      }
    } catch (error) {
      console.error('Error updating client:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update client',
      })
    }
  }

  // Handle DELETE request to delete a client
  if (method === 'DELETE') {
    try {
      // Delete associated tables.measurements first (to maintain referential integrity)
      await db.delete(tables.measurements).where(eq(tables.measurements.clientId, id))

      // Delete client
      await db.delete(tables.clients).where(eq(tables.clients.id, id))

      return { success: true }
    } catch (error) {
      console.error('Error deleting client:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to delete client',
      })
    }
  }

  // If method not supported
  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed',
  })
})
