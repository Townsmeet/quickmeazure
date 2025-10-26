/**
 * Utility function to process timestamp fields and ensure they are properly formatted
 * as Unix timestamps (seconds since epoch) for consistent API responses
 */
export function processTimestamp(timestamp: any): number {
  if (typeof timestamp === 'number') {
    return timestamp
  }

  if (typeof timestamp === 'string') {
    // If it's a numeric string, parse it
    if (/^\d+$/.test(timestamp)) {
      return parseInt(timestamp, 10)
    }
    // Otherwise treat as ISO string
    return Math.floor(new Date(timestamp).getTime() / 1000)
  }

  // Fallback for Date objects or other types
  return Math.floor(new Date(timestamp).getTime() / 1000)
}

/**
 * Process an object with timestamp fields
 */
export function processTimestamps<T extends Record<string, any>>(
  obj: T,
  timestampFields: (keyof T)[] = ['createdAt', 'updatedAt']
): T {
  const processed = { ...obj }

  for (const field of timestampFields) {
    if (processed[field] !== undefined && processed[field] !== null) {
      processed[field] = processTimestamp(processed[field]) as T[keyof T]
    }
  }

  return processed
}
