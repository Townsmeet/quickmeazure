import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// Initialize S3 client with credentials and with proper follow redirect settings
const s3Client = new S3Client({
  region: process.env.NUXT_AWS_REGION,
  credentials: {
    accessKeyId: process.env.NUXT_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.NUXT_AWS_SECRET_ACCESS_KEY || '',
  },
  endpoint: process.env.AWS_ENDPOINT_URL,
  forcePathStyle: true, // Required for some S3-compatible services
  followRegionRedirects: true, // Set to true to follow region redirects
})

// Bucket name for image storage
const BUCKET_NAME = process.env.NUXT_AWS_S3_BUCKET || 'quickmeazure-styles'

// URL construction based on bucket settings
const getS3Url = (key: string) => {
  // Standard AWS S3 URL pattern
  const region = process.env.NUXT_AWS_REGION

  // If the region is us-east-1, the URL doesn't include the region
  if (region === 'us-east-1') {
    return `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`
  }

  // For all other regions, include the region in the URL
  return `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`
}

/**
 * Upload a file to S3
 * @param fileBuffer - The file buffer to upload
 * @param fileName - The name to use for the file in S3
 * @param contentType - The content type of the file
 * @returns The URL of the uploaded file
 */
export async function uploadFileToS3(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  // Create a unique file name to prevent collisions
  const uniqueFileName = `${Date.now()}-${fileName}`

  // Log S3 configuration details (without secrets)
  console.log('S3 Upload Config:', {
    region: process.env.NUXT_AWS_REGION,
    bucket: BUCKET_NAME,
    endpoint: process.env.AWS_ENDPOINT_URL || 'default AWS endpoint',
    fileName: uniqueFileName,
    contentType,
  })

  try {
    // Upload the file to S3
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: uniqueFileName,
      Body: fileBuffer,
      ContentType: contentType,
    }

    const result = await s3Client.send(new PutObjectCommand(uploadParams))
    console.log('S3 upload successful:', result.$metadata)

    // Generate URL using the helper function
    const objectUrl = getS3Url(uniqueFileName)

    console.log('Generated S3 URL:', objectUrl)
    return objectUrl
  } catch (error: any) {
    console.error('Error uploading file to S3:', error)

    // More detailed error logging
    if (error.name === 'BucketNotFound') {
      console.error('The specified bucket does not exist')
    } else if (error.name === 'InvalidAccessKeyId') {
      console.error('The AWS access key ID is invalid')
    } else if (error.name === 'SignatureDoesNotMatch') {
      console.error('The request signature is invalid')
    } else if (error.name === 'PermanentRedirect' || error.$metadata?.httpStatusCode === 301) {
      console.error(
        `Bucket "${BUCKET_NAME}" exists but is in a different region. Updating to follow redirects.`
      )

      // Try to extract the correct region from the response
      const redirectRegion = error.message?.match(/endpoint-(\w+-\w+-\d+)/)?.[1]
      if (redirectRegion) {
        console.warn(`Consider updating your AWS_REGION to "${redirectRegion}" in .env file`)
      }
    } else if (error.message && error.message.includes('endpoint')) {
      console.error('Endpoint error. Check your AWS_ENDPOINT_URL in .env file')
    }

    throw new Error(`Failed to upload file to S3: ${error.message}`)
  }
}

/**
 * Extract the file extension from a file name
 * @param fileName - The file name
 * @returns The file extension
 */
export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || ''
}

/**
 * Get the content type for a file based on its extension
 * @param extension - The file extension
 * @returns The content type
 */
export function getContentType(extension: string): string {
  const contentTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
  }

  return contentTypes[extension] || 'application/octet-stream'
}
