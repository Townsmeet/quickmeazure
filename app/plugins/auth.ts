import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin(async () => {
  // Initialize auth composable on app startup
  if (import.meta.client) {
    const { init, isAuthenticated } = useAuth()
    await init()
    console.log('Auth plugin initialized, authenticated:', isAuthenticated.value)
  }
})
