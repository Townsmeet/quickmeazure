import { db } from '../../utils/drizzle'
import * as tables from '../../database/schema'

// Define interfaces for our data structures
interface OrderDetails {
  styleId?: number | null
  measurementId?: number | null
  depositAmount?: number
  balanceAmount?: number
  notes?: string | null
  [key: string]: any // Allow for additional properties
}

interface OrderUpdateData {
  status?: string
  description?: string | null
  dueDate?: string | null
  totalAmount?: number
  details?: OrderDetails
  updatedAt: Date
}

// Define event handler for individual order operations
export default defineEventHandler(async event => {
  const method = getMethod(event)
  const orderId = getRouterParam(event, 'id')

  // Get authenticated user from event context
  const auth = event.context.auth
  if (!auth || !auth.userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  if (!orderId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Order ID is required',
    })
  }

  // Verify order exists and belongs to this user
  const orderWithClient = await db
    .select({
      id: tables.orders.id,
      clientId: tables.orders.clientId,
      status: tables.orders.status,
      dueDate: tables.orders.dueDate,
      totalAmount: tables.orders.totalAmount,
      description: tables.orders.description,
      details: tables.orders.details,
      createdAt: tables.orders.createdAt,
      updatedAt: tables.orders.updatedAt,
      // Include client name
      clientName: tables.clients.name,
      // Include style if available
      styleName: tables.styles.name,
      styleImageUrl: tables.styles.imageUrl,
    })
    .from(tables.orders)
    .innerJoin(tables.clients, eq(tables.orders.clientId, tables.clients.id))
    .leftJoin(
      tables.styles,
      eq(
        sql`CAST(json_extract(${tables.orders.details}, '$.styleId') AS INTEGER)`,
        tables.styles.id
      )
    )
    .where(and(eq(tables.orders.id, parseInt(orderId)), eq(tables.clients.userId, auth.userId)))

  if (orderWithClient.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Order not found',
    })
  }

  // Handle GET request to fetch a single order
  if (method === 'GET') {
    // Extract values from details JSON (stored as text)
    const detailsText = orderWithClient[0].details as unknown as string | null
    const details = (detailsText ? JSON.parse(detailsText) : {}) as OrderDetails
    return {
      success: true,
      data: {
        ...orderWithClient[0],
        measurementId: details.measurementId,
        styleId: details.styleId,
        depositAmount: details.depositAmount || 0,
        balanceAmount: details.balanceAmount || 0,
        notes: details.notes,
      },
    }
  }

  // Handle PATCH request to update order
  if (method === 'PATCH' || method === 'PUT') {
    try {
      const body = await readBody(event)
      console.log('Received update data:', JSON.stringify(body, null, 2))

      // Get existing order details
      const currentDetailsText = orderWithClient[0].details as unknown as string | null
      const currentDetails = (
        currentDetailsText ? JSON.parse(currentDetailsText) : {}
      ) as OrderDetails

      // Create updated details object
      const updatedDetails: OrderDetails = {
        ...currentDetails,
        ...(body.styleId !== undefined && {
          styleId: body.styleId === '' ? null : parseInt(body.styleId),
        }),
        ...(body.measurementId !== undefined && {
          measurementId: body.measurementId === '' ? null : parseInt(body.measurementId),
        }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.depositAmount !== undefined && { depositAmount: Number(body.depositAmount) || 0 }),
      }

      // Create a new update data object with explicit values
      const finalUpdateData: OrderUpdateData = {
        // Only include fields that were sent
        ...(body.status !== undefined && { status: body.status }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.totalAmount !== undefined && { totalAmount: Number(body.totalAmount) || 0 }),

        // Set updatedAt timestamp
        updatedAt: new Date(Date.now()),
      }

      // If details were updated, include them
      if (JSON.stringify(currentDetails) !== JSON.stringify(updatedDetails)) {
        finalUpdateData.details = JSON.stringify(updatedDetails) as unknown as any
      }

      // Handle measurementId separately due to validation requirement
      if (body.measurementId !== undefined && body.measurementId !== currentDetails.measurementId) {
        // Additional check to ensure measurement belongs to this client
        const measurement = await db.query.tables.measurements.findFirst({
          where: and(
            eq(tables.measurements.id, parseInt(body.measurementId)),
            eq(tables.measurements.clientId, orderWithClient[0].clientId)
          ),
        })

        if (!measurement && body.measurementId) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Measurement does not exist or does not belong to this client',
          })
        }
      }

      // Handle due date separately to avoid getTime errors
      if (body.dueDate !== undefined) {
        if (body.dueDate === null || body.dueDate === '') {
          finalUpdateData.dueDate = null
        } else if (typeof body.dueDate === 'number') {
          // Parse as date string instead of Date object to match schema
          finalUpdateData.dueDate = new Date(body.dueDate).toISOString().split('T')[0]
        } else {
          // Don't try to parse the date, just use null
          finalUpdateData.dueDate = null
        }
      }

      // Calculate balance amount
      if (finalUpdateData.totalAmount !== undefined || updatedDetails.depositAmount !== undefined) {
        const totalAmount =
          finalUpdateData.totalAmount !== undefined
            ? Number(finalUpdateData.totalAmount)
            : Number(orderWithClient[0].totalAmount)

        const depositAmount =
          updatedDetails.depositAmount !== undefined
            ? Number(updatedDetails.depositAmount || 0)
            : Number(currentDetails.depositAmount || 0)

        updatedDetails.balanceAmount = totalAmount - depositAmount

        // Update the details object with new balance
        if (!finalUpdateData.details) {
          finalUpdateData.details = JSON.stringify(updatedDetails) as unknown as any
        }
      }

      console.log('Final update data:', finalUpdateData)

      // If no fields to update, return existing order
      if (Object.keys(finalUpdateData).length === 0) {
        // Extract values from details JSON
        const detailsText2 = orderWithClient[0].details as unknown as string | null
        const details = (detailsText2 ? JSON.parse(detailsText2) : {}) as OrderDetails
        return {
          success: true,
          data: {
            ...orderWithClient[0],
            measurementId: details.measurementId,
            styleId: details.styleId,
            depositAmount: details.depositAmount || 0,
            balanceAmount: details.balanceAmount || 0,
            notes: details.notes,
          },
        }
      }

      // Perform update
      console.log(`Executing UPDATE for order ${orderId} with data:`, finalUpdateData)

      // Use try/catch specifically for the database operation
      try {
        await db
          .update(tables.orders)
          .set(finalUpdateData)
          .where(eq(tables.orders.id, parseInt(orderId)))

        console.log('Order updated successfully')
      } catch (dbError: any) {
        console.error('Database operation failed:', dbError)
        throw new Error(`Database operation failed: ${dbError.message || 'Unknown error'}`)
      }

      // Return updated order with combined data
      const updatedOrderData = {
        ...orderWithClient[0],
        ...finalUpdateData,
        // Extract fields from details
        measurementId: updatedDetails.measurementId,
        styleId: updatedDetails.styleId,
        depositAmount: updatedDetails.depositAmount || 0,
        balanceAmount: updatedDetails.balanceAmount || 0,
        notes: updatedDetails.notes,
      }

      return {
        success: true,
        data: updatedOrderData,
      }
    } catch (error: any) {
      console.error('Error updating order:', error)
      if (error.statusCode) {
        throw error // Re-throw validation errors
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update order',
        message: 'Failed to update order',
      }
    }
  }

  // Handle DELETE request to delete order
  if (method === 'DELETE') {
    try {
      await db.delete(tables.orders).where(eq(tables.orders.id, parseInt(orderId)))
      return {
        success: true,
        data: { deleted: true },
      }
    } catch (error: any) {
      console.error('Error deleting order:', error)
      if (error.statusCode) {
        throw error // Re-throw validation errors
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete order',
        message: 'Failed to delete order',
      }
    }
  }

  // If method is not supported
  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed',
  })
})
