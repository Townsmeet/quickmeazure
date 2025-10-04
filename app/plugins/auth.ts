import { defineNuxtPlugin } from '#app'
import { useAuthStore } from '~/store/modules/auth'

export default defineNuxtPlugin(async ({ $pinia }) => {
  // Initialize auth store on app startup
  const authStore = useAuthStore($pinia)

  // Initialize the auth store (will restore session from localStorage if available)
  if (import.meta.client) {
    authStore.init()
    console.log('Auth plugin initialized, status:', authStore.status)
  }

  // For backward compatibility, provide the auth store as $auth
  return {
    provide: {
      auth: authStore,
    },
  }
})
