import type { H3Event } from 'h3'
import { readMultipartFormData } from 'h3'

/**
 * Extract a file from multipart form data
 * @param event - The H3Event object
 * @returns An object containing the file buffer, filename, and content type
 */
export async function extractFileFromMultipart(event: H3Event) {
  try {
    console.log('Attempting to extract file from multipart form data')
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
      console.log('No form data found')
      return null
    }

    console.log(
      'Form data parts:',
      formData.map(part => ({
        name: part.name,
        filename: part.filename,
        type: part.type,
        size: part.data?.length || 0,
      }))
    )

    // Try finding parts with specific names first (file or image)
    let filePart = formData.find(part => part.name === 'file' || part.name === 'image')

    // If no match by common names, fallback to any part with a filename
    if (!filePart) {
      filePart = formData.find(part => part.filename)
    }

    if (!filePart || !filePart.filename) {
      console.log('No file part found in multipart form data')
      return null
    }

    console.log('Found file part:', {
      name: filePart.name,
      filename: filePart.filename,
      type: filePart.type,
      size: filePart.data?.length || 0,
    })

    return {
      buffer: filePart.data,
      filename: filePart.filename,
      contentType: filePart.type || 'application/octet-stream',
    }
  } catch (error) {
    console.error('Error extracting file from multipart form data:', error)
    return null
  }
}

/**
 * Extract field values from multipart form data
 * @param event - The H3Event object
 * @returns An object containing the field names and values
 */
export async function extractFieldsFromMultipart(event: H3Event) {
  try {
    console.log('Attempting to extract fields from multipart form data')
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
      console.log('No form data found for field extraction')
      return {}
    }

    const fields: Record<string, string> = {}

    // Process each part
    for (const part of formData) {
      // Skip file parts
      if (part.filename) continue

      // If it has a name, treat it as a field
      if (part.name) {
        fields[part.name] = part.data.toString()
      }
    }

    console.log('Extracted fields:', fields)
    return fields
  } catch (error) {
    console.error('Error extracting fields from multipart form data:', error)
    return {}
  }
}
/**
 * Extract multiple files from multipart form data
 * @param event - The H3Event object
 * @returns An array of objects containing file buffers, filenames, and content types
 */
export async function extractFilesFromMultipart(event: H3Event) {
  try {
    console.log('Attempting to extract multiple files from multipart form data')
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
      console.log('No form data found')
      return []
    }

    console.log(
      'Form data parts:',
      formData.map(part => ({
        name: part.name,
        filename: part.filename,
        type: part.type,
        size: part.data?.length || 0,
      }))
    )

    // Find all parts that have filenames and are image files
    const fileParts = formData.filter(
      part =>
        part.filename &&
        part.name &&
        (part.name.startsWith('image_') || part.name === 'image' || part.name === 'file')
    )

    if (fileParts.length === 0) {
      console.log('No file parts found in multipart form data')
      return []
    }

    console.log(`Found ${fileParts.length} file parts`)

    return fileParts.map(filePart => ({
      buffer: filePart.data,
      filename: filePart.filename!,
      contentType: filePart.type || 'application/octet-stream',
      fieldName: filePart.name,
    }))
  } catch (error) {
    console.error('Error extracting files from multipart form data:', error)
    return []
  }
}
