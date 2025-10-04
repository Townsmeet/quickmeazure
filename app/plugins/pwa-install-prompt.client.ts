// This plugin handles the PWA installation prompt
// It only runs on the client side

import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin(nuxtApp => {
  // Only run on client side
  if (import.meta.server) return

  // Create global state for the PWA installation prompt
  const pwaPromptEvent = useState('pwaPromptEvent', () => null)
  const showPwaPrompt = useState('showPwaPrompt', () => false)

  // Listen for the beforeinstallprompt event
  const setupInstallPrompt = () => {
    window.addEventListener('beforeinstallprompt', e => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()

      // Store the event for later use
      pwaPromptEvent.value = e

      // Check if user has previously dismissed the prompt
      const hasUserDismissed = localStorage.getItem('pwaPromptDismissed') === 'true'

      // Check if the app was recently installed
      const installedTime = localStorage.getItem('pwaInstalled')
      const isRecentlyInstalled =
        installedTime && Date.now() - parseInt(installedTime) < 30 * 24 * 60 * 60 * 1000

      // Only show the prompt if not dismissed and not recently installed
      if (!hasUserDismissed && !isRecentlyInstalled) {
        // Wait a few seconds before showing
        setTimeout(() => {
          showPwaPrompt.value = true
        }, 3000)
      }
    })

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      // Mark as installed
      localStorage.setItem('pwaInstalled', Date.now().toString())
      // Hide the prompt
      showPwaPrompt.value = false
      // Clear the event
      pwaPromptEvent.value = null
    })
  }

  // Initialize when the app is mounted
  nuxtApp.hook('app:mounted', () => {
    // Check if already in standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone ||
      document.referrer.includes('android-app://')

    if (!isStandalone) {
      setupInstallPrompt()
    }
  })

  return {
    provide: {
      pwaInstall: {
        // Expose the state
        get isPromptVisible() {
          return showPwaPrompt.value
        },

        // Method to show the browser's install prompt
        showInstallPrompt: async () => {
          if (!pwaPromptEvent.value) return

          // Show the browser's install prompt
          pwaPromptEvent.value.prompt()

          // Wait for user response
          const { outcome } = await pwaPromptEvent.value.userChoice

          // Hide our custom prompt
          showPwaPrompt.value = false

          // If installed, mark as installed
          if (outcome === 'accepted') {
            localStorage.setItem('pwaInstalled', Date.now().toString())
          }

          // Clear the event
          pwaPromptEvent.value = null
        },

        // Method to dismiss our custom prompt
        dismissPrompt: () => {
          // Hide the prompt
          showPwaPrompt.value = false

          // Remember that the user dismissed it
          localStorage.setItem('pwaPromptDismissed', 'true')

          // Allow showing again after 30 days
          setTimeout(
            () => {
              localStorage.removeItem('pwaPromptDismissed')
            },
            30 * 24 * 60 * 60 * 1000
          )
        },
      },
    },
  }
})
