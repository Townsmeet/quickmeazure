import { db } from '../../utils/drizzle'
import { and, eq, sql, asc, desc } from 'drizzle-orm'
import * as tables from '../../database/schema'
import {
  extractFileFromMultipart,
  extractFilesFromMultipart,
  extractFieldsFromMultipart,
} from '../../utils/multipart'
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

      // Process the styles data to parse measurements, imageUrls, and tags
      const processedStyles = stylesData.map(style => ({
        ...style,
        measurements: style.details
          ? (() => {
              try {
                return JSON.parse(style.details)
              } catch (e) {
                return null
              }
            })()
          : null,
        imageUrls: style.imageUrls
          ? (() => {
              try {
                return JSON.parse(style.imageUrls)
              } catch (e) {
                return style.imageUrl ? [style.imageUrl] : []
              }
            })()
          : style.imageUrl
            ? [style.imageUrl]
            : [],
        tags: style.tags
          ? (() => {
              try {
                return JSON.parse(style.tags)
              } catch (e) {
                return []
              }
            })()
          : [],
      }))

      // Get total count
      const countResult = await countQuery
      const total = countResult[0]?.count || 0

      // Calculate total pages
      const totalPages = Math.ceil(total / limit)

      // Return data with pagination info
      return {
        success: true,
        data: processedStyles,
        pagination: {
          page,
          limit,
          total: total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      }
    } catch (error) {
      console.error('Error fetching styles:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch styles',
        message: 'Failed to fetch styles',
      }
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
      let styleType = null
      let styleTags: string[] = []
      let styleCategory = null
      let styleStatus = 'draft'
      let styleNotes = null
      let styleMeasurements = null
      const imageUrls: string[] = []

      if (isMultipart) {
        console.log('Processing multipart form data')
        try {
          // Parse multipart form data
          const fields = await extractFieldsFromMultipart(event)
          console.log('Extracted fields:', fields)

          const files = await extractFilesFromMultipart(event)
          console.log(`Extracted ${files.length} files`)

          styleName = fields.name || ''
          styleDescription = fields.description || null
          styleType = fields.type || null
          styleCategory = fields.category || null
          styleStatus = fields.status || 'draft'
          styleNotes = fields.notes || null

          // Parse tags if provided
          if (fields.tags) {
            try {
              styleTags = JSON.parse(fields.tags)
            } catch (e) {
              console.error('Failed to parse tags:', e)
            }
          }

          // Parse measurements if provided
          if (fields.measurements) {
            try {
              styleMeasurements = JSON.parse(fields.measurements)
            } catch (e) {
              console.error('Failed to parse measurements:', e)
            }
          }

          // Handle multiple file uploads to S3
          if (files && files.length > 0) {
            console.log(`Processing ${files.length} files for upload`)

            for (const file of files) {
              if (file.buffer && file.buffer.length > 0) {
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
                  const uploadedUrl = await uploadFileToS3(file.buffer, file.filename, contentType)
                  imageUrls.push(uploadedUrl)
                  console.log('Successfully uploaded to S3, imageUrl:', uploadedUrl)
                } catch (s3Error: any) {
                  console.error('S3 upload error:', s3Error)
                  throw createError({
                    statusCode: 500,
                    statusMessage: `S3 upload failed: ${s3Error.message}`,
                  })
                }
              }
            }
          } else {
            console.error('No valid files found in multipart data')
            throw createError({
              statusCode: 400,
              statusMessage: 'At least one image is required',
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
        styleType = body.type || null

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
              const uploadedUrl = await uploadFileToS3(buffer, `image.${fileExt}`, contentType)
              imageUrls.push(uploadedUrl)
              console.log('Successfully uploaded base64 image to S3, imageUrl:', uploadedUrl)
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

      if (imageUrls.length === 0) {
        console.error('No images uploaded')
        throw createError({
          statusCode: 400,
          statusMessage: 'At least one image is required',
        })
      }

      console.log('Creating new style in database:', {
        name: styleName,
        description: styleDescription ? 'provided' : 'not provided',
        imageCount: imageUrls.length,
      })

      // Create new style - noting the id field is a serial in the schema, not a UUID
      const newStyle = {
        // Let the database handle the id field
        userId: String(userId),
        name: styleName,
        description: styleDescription,
        imageUrl: imageUrls.length > 0 ? imageUrls[0] : null, // Keep first image for backward compatibility
        imageUrls: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
        type: styleType,
        tags: styleTags.length > 0 ? JSON.stringify(styleTags) : null,
        category: styleCategory,
        status: styleStatus,
        notes: styleNotes,
        details: styleMeasurements ? JSON.stringify(styleMeasurements) : null,
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
      return { success: true, data: { ...newStyle, id: styleId } }
    } catch (error: any) {
      console.error('Error creating style:', error)
      if (error.statusCode) {
        throw error // Re-throw validation errors
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create style',
        message: 'Failed to create style',
      }
    }
  }

  // If method is not supported
  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed',
  })
})
