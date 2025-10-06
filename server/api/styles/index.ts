// uuid import removed as it's not being used
import { db } from '../../utils/drizzle'
import * as tables from '../../database/schema'
import { extractFileFromMultipart, extractFieldsFromMultipart } from '../../utils/multipart'
import { uploadFileToS3, getFileExtension, getContentType } from '../../utils/s3'

// Define event handler for styles API
export default defineEventHandler(async event => {
  const method = getMethod(event)

  // Get user ID from auth context
  const auth = event.context.auth
  const userId = auth?.userId

  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  // Handle GET request to get all styles
  if (method === 'GET') {
    try {
      // Get the query parameters
      const query = getQuery(event)
      const page = parseInt((query.page as string) || '1')
      const limit = parseInt((query.limit as string) || '12')
      const sortField = (query.sortField as string) || 'createdAt'
      const sortOrder = (query.sortOrder as string) || 'desc'
      const search = query.search as string | undefined

      // Calculate offset for pagination
      const offset = (page - 1) * limit

      // Build query based on search parameter
      let stylesQuery = db.select().from(tables.styles).where(eq(tables.styles.userId, userId))

      // Apply search filter if provided
      if (search && search.trim() !== '') {
        stylesQuery = db
          .select()
          .from(tables.styles)
          .where(
            and(
              eq(tables.styles.userId, userId),
              sql`lower(${tables.styles.name}) like ${`%${search.toLowerCase()}%`}`
            )
          )
      }

      // Build count query to get total records (before pagination)
      const countQuery = db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(tables.styles)
        .where(
          and(
            eq(tables.styles.userId, userId),
            search && search.trim() !== ''
              ? sql`lower(${tables.styles.name}) like ${`%${search.toLowerCase()}%`}`
              : undefined
          )
        )

      // Determine sort direction
      const sortDirection = sortOrder === 'asc' ? asc : desc

      // Apply sorting
      let orderByClause
      switch (sortField) {
        case 'name':
          orderByClause = sortDirection(tables.styles.name)
          break
        case 'createdAt':
        default:
          orderByClause = sortDirection(tables.styles.createdAt)
          break
      }

      // Apply sorting, pagination, and execute query
      const stylesData = await stylesQuery.orderBy(orderByClause).limit(limit).offset(offset)

      // Get total count
      const countResult = await countQuery
      const total = countResult[0]?.count || 0

      // Calculate total pages
      const totalPages = Math.ceil(total / limit)

      // Return data with pagination info
      return {
        data: stylesData,
        pagination: {
          page,
          limit,
          totalCount: total,
          totalPages,
        },
      }
    } catch (error) {
      console.error('Error fetching styles:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch styles',
      })
    }
  }

  // Handle POST request to create a new style
  if (method === 'POST') {
    try {
      // Check if content type is multipart/form-data
      const contentType = event.node.req.headers['content-type'] || ''
      const isMultipart = contentType.includes('multipart/form-data')

      console.log('Creating style with content-type:', contentType)

      let styleName = ''
      let styleDescription = null
      let imageUrl = null

      if (isMultipart) {
        console.log('Processing multipart form data')
        try {
          // Parse multipart form data
          const fields = await extractFieldsFromMultipart(event)
          console.log('Extracted fields:', fields)

          const file = await extractFileFromMultipart(event)
          console.log(
            'Extracted file:',
            file
              ? {
                  filename: file.filename,
                  contentType: file.contentType,
                  bufferSize: file.buffer?.length || 0,
                }
              : 'No file found'
          )

          styleName = fields.name || ''
          styleDescription = fields.description || null

          // Handle file upload to S3 if a file was provided
          if (file && file.buffer && file.buffer.length > 0) {
            const fileExt = getFileExtension(file.filename)
            const contentType = getContentType(fileExt)

            console.log('Uploading file to S3:', {
              filename: file.filename,
              fileExt,
              contentType,
              bufferSize: file.buffer.length,
            })

            try {
              // Upload to S3
              imageUrl = await uploadFileToS3(file.buffer, file.filename, contentType)
              console.log('Successfully uploaded to S3, imageUrl:', imageUrl)
            } catch (s3Error: any) {
              console.error('S3 upload error:', s3Error)
              throw createError({
                statusCode: 500,
                statusMessage: `S3 upload failed: ${s3Error.message}`,
              })
            }
          } else {
            console.error('No valid file found in multipart data')
            throw createError({
              statusCode: 400,
              statusMessage: 'Image is required',
            })
          }
        } catch (multipartError: any) {
          console.error('Error processing multipart data:', multipartError)
          throw createError({
            statusCode: 500,
            statusMessage: `Multipart processing error: ${multipartError.message}`,
          })
        }
      } else {
        // Regular JSON body
        const body = await readBody(event)
        console.log('Received JSON body:', body)

        styleName = body.name
        styleDescription = body.description || null

        // If there's a base64 image, handle it
        if (body.imageBase64) {
          console.log('Processing base64 image')
          // Decode base64
          const matches = body.imageBase64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/)

          if (matches && matches.length === 3) {
            const contentType = matches[1]
            const buffer = Buffer.from(matches[2], 'base64')
            const fileExt = contentType.split('/')[1] || 'jpg'

            console.log('Uploading base64 image to S3:', {
              contentType,
              fileExt,
              bufferSize: buffer.length,
            })

            try {
              // Upload to S3
              imageUrl = await uploadFileToS3(buffer, `image.${fileExt}`, contentType)
              console.log('Successfully uploaded base64 image to S3, imageUrl:', imageUrl)
            } catch (s3Error: any) {
              console.error('S3 upload error for base64 image:', s3Error)
              throw createError({
                statusCode: 500,
                statusMessage: `S3 upload failed for base64 image: ${s3Error.message}`,
              })
            }
          } else {
            console.error('Invalid base64 image format')
            throw createError({
              statusCode: 400,
              statusMessage: 'Invalid image format',
            })
          }
        } else {
          console.error('No image provided in JSON body')
          throw createError({
            statusCode: 400,
            statusMessage: 'Image is required',
          })
        }
      }

      // Validate required fields
      if (!styleName) {
        console.error('Style name is missing')
        throw createError({
          statusCode: 400,
          statusMessage: 'Style name is required',
        })
      }

      if (!imageUrl) {
        console.error('Image URL is missing after processing')
        throw createError({
          statusCode: 400,
          statusMessage: 'Image upload failed',
        })
      }

      console.log('Creating new style in database:', {
        name: styleName,
        description: styleDescription ? 'provided' : 'not provided',
        imageUrl: imageUrl,
      })

      // Create new style - noting the id field is a serial in the schema, not a UUID
      const newStyle = {
        // Let the database handle the id field
        userId: String(userId),
        name: styleName,
        description: styleDescription,
        imageUrl: imageUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Insert and get the generated id
      const result = await db
        .insert(tables.styles)
        .values(newStyle)
        .returning({ id: tables.styles.id })
      const styleId = result[0]?.id

      console.log('Style created successfully with ID:', styleId)
      return { ...newStyle, id: styleId }
    } catch (error: any) {
      console.error('Error creating style:', error)
      if (error.statusCode) {
        throw error // Re-throw validation errors
      }
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to create style: ${error.message}`,
      })
    }
  }

  // If method is not supported
  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed',
  })
})
