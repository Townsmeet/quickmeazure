import { defineEventHandler, toWebRequest } from 'h3'
import { auth } from '../../utils/auth'

// Wrap Better Auth handler with Nuxt's event handler
export default defineEventHandler(async event => {
  // Convert H3 event to Web Request for Better Auth
  const request = toWebRequest(event)
  const response = await auth.handler(request)

  return response
})
