// Accessibility fixes for Nuxt UI elements
export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    // Fix for modal dialogs that might use aria-hidden incorrectly
    const fixModalAccessibility = () => {
      // Specifically check the #__nuxt root element first
      const nuxtRoot = document.getElementById('__nuxt')
      if (nuxtRoot) {
        // Always remove aria-hidden from the root element regardless of its current value
        // This is a more aggressive approach to ensure it never has aria-hidden
        if (nuxtRoot.hasAttribute('aria-hidden')) {
          nuxtRoot.removeAttribute('aria-hidden')
        }
        if (nuxtRoot.hasAttribute('data-aria-hidden')) {
          nuxtRoot.removeAttribute('data-aria-hidden')
        }

        // Add a property observer to prevent aria-hidden from being added back
        if (!nuxtRoot._accessibilityObserverSet) {
          Object.defineProperty(nuxtRoot, 'aria-hidden', {
            get: function () {
              return null
            },
            set: function () {
              console.warn(
                'Attempted to set aria-hidden on #__nuxt root element, which is not allowed for accessibility'
              )
              return null
            },
            configurable: true,
          })
          nuxtRoot._accessibilityObserverSet = true
        }
      }

      // Fix all elements that might have focus inside an aria-hidden container
      const ariaHiddenElements = document.querySelectorAll('[aria-hidden="true"]')

      ariaHiddenElements.forEach(el => {
        // If this is the root element or contains the root element, always remove aria-hidden
        if (el.id === '__nuxt' || el.contains(document.getElementById('__nuxt'))) {
          el.removeAttribute('aria-hidden')
          return
        }

        // Check if this element contains any focusable elements
        const focusableElements = el.querySelectorAll(
          'a, button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
        )

        if (focusableElements.length > 0) {
          // If it contains focusable elements, use inert instead of aria-hidden
          el.removeAttribute('aria-hidden')
          // Only use inert if it's supported by the browser
          if ('inert' in HTMLElement.prototype) {
            el.setAttribute('inert', '')
          }
        }
      })

      // Fix any canvas elements that should never have aria-hidden
      const canvasElements = document.querySelectorAll('canvas')
      canvasElements.forEach(canvas => {
        if (canvas.hasAttribute('aria-hidden')) {
          canvas.removeAttribute('aria-hidden')
        }

        // Add appropriate role if missing
        if (!canvas.hasAttribute('role')) {
          canvas.setAttribute('role', 'img')
        }
      })
    }

    // Run fix immediately without waiting for DOMContentLoaded
    // This helps catch early rendering issues
    fixModalAccessibility()

    // Also run on DOMContentLoaded for safety
    window.addEventListener('DOMContentLoaded', () => {
      fixModalAccessibility()
      // Run again after a short delay to catch any late UI updates
      setTimeout(fixModalAccessibility, 100)
      setTimeout(fixModalAccessibility, 500)
      setTimeout(fixModalAccessibility, 1000)
    })

    // Run fix after route changes
    const router = useRouter()
    router.afterEach(() => {
      // Run immediately and then again after short delays
      fixModalAccessibility()
      setTimeout(fixModalAccessibility, 100)
      setTimeout(fixModalAccessibility, 500)
    })

    // Run fix on any user interaction that might change focus
    document.addEventListener('click', () => {
      setTimeout(fixModalAccessibility, 50)
    })

    document.addEventListener(
      'focus',
      () => {
        setTimeout(fixModalAccessibility, 50)
      },
      true
    )

    // Fix after UI state changes by watching for DOM mutations
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(mutations => {
        // Check for any attribute changes or node additions that might affect accessibility
        const shouldFix = mutations.some(mutation => {
          return (
            (mutation.type === 'attributes' &&
              (mutation.attributeName === 'aria-hidden' ||
                mutation.attributeName === 'data-aria-hidden')) ||
            mutation.type === 'childList'
          )
        })

        if (shouldFix) {
          fixModalAccessibility()
        }
      })

      // Start observing immediately
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['aria-hidden', 'data-aria-hidden'],
        childList: true,
        subtree: true,
      })
    }

    // Set an interval to periodically check and fix accessibility issues
    // This is a fallback in case other methods miss something
    const intervalId = setInterval(fixModalAccessibility, 2000)

    // Clean up the interval when the window is unloaded
    window.addEventListener('beforeunload', () => {
      if (intervalId) clearInterval(intervalId)
    })
  }
})
