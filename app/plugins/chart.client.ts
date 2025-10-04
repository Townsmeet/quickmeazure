import { Chart } from 'chart.js'
import type { ChartOptions, Plugin } from 'chart.js'

// Empty state plugin for charts
const emptyStatePlugin: Plugin = {
  id: 'emptyState',
  beforeDraw: chart => {
    const datasets = chart.data.datasets

    // Check if all datasets are empty or contain only zeros
    const isEmpty = datasets.every(dataset => {
      const data = dataset.data as number[]
      return !data || data.length === 0 || data.every(value => value === 0)
    })

    // If chart is empty, show a message
    if (isEmpty) {
      const { ctx, width, height } = chart

      // Clear the canvas
      ctx.save()
      ctx.fillStyle = '#f9fafb' // Light gray background
      ctx.fillRect(0, 0, width, height)

      // Add text
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = '14px sans-serif'
      ctx.fillStyle = '#9ca3af' // Gray text
      ctx.fillText('No client data available', width / 2, height / 2 - 10)

      // Add smaller text
      ctx.font = '12px sans-serif'
      ctx.fillStyle = '#9ca3af'
      ctx.fillText('Demo data is shown', width / 2, height / 2 + 15)

      ctx.restore()

      // Return true to indicate we've painted something
      return true
    }
  },
}

// Accessibility fix plugin - removes aria-hidden from chart canvas elements
const accessibilityFixPlugin: Plugin = {
  id: 'accessibilityFix',
  start: chart => {
    // Get the canvas element
    const canvas = chart.canvas
    if (!canvas) return

    // Remove aria-hidden attribute if it exists
    if (canvas.hasAttribute('aria-hidden')) {
      canvas.removeAttribute('aria-hidden')
    }

    // Add appropriate ARIA attributes
    canvas.setAttribute('role', 'img')
    canvas.setAttribute('aria-label', chart.data.datasets[0]?.label || 'Chart')

    // Ensure parent elements don't have aria-hidden
    let parent = canvas.parentElement
    while (parent) {
      if (parent.hasAttribute('aria-hidden')) {
        parent.removeAttribute('aria-hidden')
      }
      parent = parent.parentElement
    }
  },
  // Apply on resize to ensure it persists
  resize: chart => {
    const canvas = chart.canvas
    if (!canvas) return

    if (canvas.hasAttribute('aria-hidden')) {
      canvas.removeAttribute('aria-hidden')
    }
  },
}

// Default chart configuration
const defaultOptions: Partial<ChartOptions> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      align: 'end',
      labels: {
        boxWidth: 10,
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 15,
        font: {
          size: 11,
        },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      padding: 10,
      titleFont: {
        size: 12,
      },
      bodyFont: {
        size: 11,
      },
      cornerRadius: 4,
      displayColors: true,
      boxWidth: 8,
      boxHeight: 8,
      boxPadding: 3,
      usePointStyle: true,
    },
  },
  animation: {
    duration: 500,
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: '#6b7280',
        font: {
          size: 10,
        },
      },
    },
    y: {
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
      },
      ticks: {
        color: '#6b7280',
        font: {
          size: 10,
        },
      },
    },
  },
}

// Theme colors that match the application's color scheme
const themeColors = [
  'rgba(79, 70, 229, 0.9)', // Primary color (indigo)
  'rgba(16, 185, 129, 0.9)', // Green
  'rgba(245, 158, 11, 0.9)', // Amber
  'rgba(239, 68, 68, 0.9)', // Red
  'rgba(59, 130, 246, 0.9)', // Blue
  'rgba(217, 70, 239, 0.9)', // Purple
]

export default defineNuxtPlugin(_nuxtApp => {
  // Register the plugins
  Chart.register(emptyStatePlugin)
  Chart.register(accessibilityFixPlugin)

  // Apply default options
  Chart.defaults.color = '#6b7280'
  Chart.defaults.font.family = 'Inter, sans-serif'
  Chart.defaults.borderColor = 'rgba(0, 0, 0, 0.05)'

  // Set theme colors as default
  if (Chart.defaults.datasets?.bar) {
    Chart.defaults.datasets.bar.backgroundColor = themeColors[0]
  }
  if (Chart.defaults.datasets?.line) {
    Chart.defaults.datasets.line.borderColor = themeColors[0]
  }
  if (Chart.defaults.datasets?.pie) {
    Chart.defaults.datasets.pie.backgroundColor = themeColors
  }
  if (Chart.defaults.datasets?.doughnut) {
    Chart.defaults.datasets.doughnut.backgroundColor = themeColors
  }

  // Merge default options with Chart.js defaults
  Chart.defaults.set({
    ...Chart.defaults,
    ...defaultOptions,
  })

  // Apply accessibility fix to existing DOM on page load
  if (import.meta.client) {
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        const canvasElements = document.querySelectorAll('canvas')
        canvasElements.forEach(canvas => {
          if (canvas.hasAttribute('aria-hidden')) {
            canvas.removeAttribute('aria-hidden')
          }

          // Check parent elements too
          let parent = canvas.parentElement
          while (parent) {
            if (parent.hasAttribute('aria-hidden')) {
              parent.removeAttribute('aria-hidden')
            }
            parent = parent.parentElement
          }
        })
      }, 500)
    })
  }
})
