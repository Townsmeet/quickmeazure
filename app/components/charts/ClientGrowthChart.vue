<template>
  <div
    class="growth-chart-container"
    style="position: relative; height: 100%"
    role="region"
    aria-label="Client growth chart"
    :aria-busy="isLoading"
    tabindex="0"
  >
    <Bar
      ref="chartInstance"
      :data="chartData"
      :options="chartOptions"
      :height="null"
      :width="null"
    />
  </div>
</template>

<script setup>
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'
import { Bar } from 'vue-chartjs'
import { computed, onMounted, ref, watch, nextTick } from 'vue'

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

// Chart instance ref
const chartInstance = ref(null)

// Loading state
const isLoading = ref(false)

// Props from parent
const props = defineProps({
  period: {
    type: String,
    default: '30days',
  },
  realData: {
    type: Object,
    default: () => ({
      labels: [],
      data: [],
      totalGrowth: 0,
      percentGrowth: 0,
    }),
  },
  hasRealData: {
    type: Boolean,
    default: false,
  },
})

// Demo data for different periods
const demoData = {
  '7days': {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    data: [1, 0, 1, 2, 0, 1, 2],
    totalGrowth: 7,
    percentGrowth: 30,
  },
  '30days': {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
    data: [2, 3, 1, 4, 2],
    totalGrowth: 12,
    percentGrowth: 25,
  },
  '90days': {
    labels: ['Jan', 'Feb', 'Mar'],
    data: [4, 6, 5],
    totalGrowth: 15,
    percentGrowth: 40,
  },
  year: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    data: [1, 2, 3, 4, 3, 2, 5, 6, 4, 3, 5, 7],
    totalGrowth: 45,
    percentGrowth: 60,
  },
}

// Choose data source based on props without side effects
const chartData = computed(() => {
  // Choose data source based on whether we have real data
  const dataSource = props.hasRealData
    ? props.realData
    : demoData[props.period] || demoData['30days'] // Fallback to 30 days if period is invalid

  // Ensure we have valid data structure
  const labels = dataSource?.labels || []
  const data = dataSource?.data || []

  return {
    labels,
    datasets: [
      {
        label: 'New Clients',
        data, // Use the extracted data array
        backgroundColor: props.hasRealData
          ? 'rgba(79, 70, 229, 0.7)' // Primary color for bars
          : 'rgba(156, 163, 175, 0.7)', // Gray for demo data bars
        borderColor: props.hasRealData
          ? 'rgba(79, 70, 229, 1)' // Primary color for bar border
          : 'rgba(156, 163, 175, 1)', // Gray for demo data bar border
        data: dataSource.data,
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: props.hasRealData
          ? 'rgba(79, 70, 229, 0.9)'
          : 'rgba(156, 163, 175, 0.9)',
        maxBarThickness: 40,
      },
    ],
  }
})

// Chart options - simplified since we have global defaults
const chartOptions = computed(() => {
  return {
    plugins: {
      legend: {
        display: false, // Hide the legend for this chart
      },
      tooltip: {
        callbacks: {
          title: function (_tooltipItems) {
            return 'New Clients'
          },
          label: function (context) {
            return `${context.label}: ${context.raw} client${context.raw !== 1 ? 's' : ''}`
          },
        },
      },
    },
    // Accessibility options
    accessibility: {
      enabled: true,
    },
  }
})

// Watch for changes in props that would affect the chart data
watch([() => props.hasRealData, () => props.realData, () => props.period], () => {
  // Show loading state when data changes
  isLoading.value = true

  // Set loading to false after short delay to ensure chart has time to update
  setTimeout(() => {
    isLoading.value = false
  }, 300)
})

// Fix accessibility after chart renders
onMounted(() => {
  nextTick(() => {
    // Find canvas element inside component
    const chartCanvas = document.querySelector('.growth-chart-container canvas')
    if (chartCanvas) {
      // Remove aria-hidden attribute if it exists
      if (chartCanvas.hasAttribute('aria-hidden')) {
        chartCanvas.removeAttribute('aria-hidden')
      }

      // Add appropriate ARIA attributes
      chartCanvas.setAttribute('role', 'img')
      chartCanvas.setAttribute('aria-label', 'Chart showing client growth over time')
    }
  })
})

// Watch for period changes
watch(
  () => props.period,
  () => {
    // Show loading indicator when period changes
    isLoading.value = true

    // Give chart time to update
    nextTick(() => {
      setTimeout(() => {
        isLoading.value = false
      }, 300)
    })
  }
)

// Expose stats for parent component
const clientStats = computed(() => {
  if (props.hasRealData) {
    return {
      totalGrowth: props.realData.totalGrowth || 0,
      percentGrowth: props.realData.percentGrowth || 0,
    }
  } else {
    return {
      totalGrowth: demoData[props.period].totalGrowth,
      percentGrowth: demoData[props.period].percentGrowth,
    }
  }
})

// Expose to parent component
defineExpose({
  clientStats,
})
</script>
