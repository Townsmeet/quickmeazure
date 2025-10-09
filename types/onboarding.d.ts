// Type definitions for onboarding components
declare module '#app' {
  interface NuxtApp {
    $toast: any // Adjust the type based on your toast implementation
  }
}

declare module '@nuxt/schema' {
  interface RuntimeConfig {
    // Add any runtime config types here
    public: {
      appName: string
      appUrl: string
    }
  }
}

export {}
