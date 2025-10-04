import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Types
import type { Style, StyleFilter } from '../../types/style'

export const useStyleStore = defineStore('style', () => {
  // State
  const styles = ref<Style[]>([])
  const currentStyle = ref<Style | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const totalCount = ref(0)
  const filters = ref<StyleFilter>({
    search: '',
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const pagination = ref({
    page: 1,
    pageSize: 10,
  })

  // Getters
  const filteredStyles = computed(() => {
    return styles.value.filter(style => {
      const matchesSearch =
        !filters.value.search ||
        style.name.toLowerCase().includes(filters.value.search.toLowerCase()) ||
        style.description?.toLowerCase().includes(filters.value.search.toLowerCase())

      const matchesStatus = filters.value.status === 'all' || style.status === filters.value.status

      return matchesSearch && matchesStatus
    })
  })

  const sortedAndPaginatedStyles = computed(() => {
    const sorted = [...filteredStyles.value].sort((a, b) => {
      let comparison = 0
      const aValue = a[filters.value.sortBy as keyof Style]
      const bValue = b[filters.value.sortBy as keyof Style]

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue)
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime()
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue
      }

      return filters.value.sortOrder === 'asc' ? comparison : -comparison
    })

    const start = (pagination.value.page - 1) * pagination.value.pageSize
    return sorted.slice(start, start + pagination.value.pageSize)
  })

  // State mutation methods
  const setStyles = (newStyles: Style[]) => {
    styles.value = newStyles
  }

  const addStyle = (style: Style) => {
    styles.value.unshift(style)
    totalCount.value += 1
  }

  const updateStyleInStore = (updatedStyle: Style) => {
    const index = styles.value.findIndex(s => s.id === updatedStyle.id)
    if (index !== -1) {
      styles.value[index] = updatedStyle
    }
    if (currentStyle.value?.id === updatedStyle.id) {
      currentStyle.value = updatedStyle
    }
  }

  const removeStyle = (styleId: string) => {
    const index = styles.value.findIndex(s => s.id === styleId)
    if (index !== -1) {
      styles.value.splice(index, 1)
      totalCount.value = Math.max(0, totalCount.value - 1)
    }
    if (currentStyle.value?.id === styleId) {
      currentStyle.value = null
    }
  }

  const setCurrentStyle = (style: Style | null) => {
    currentStyle.value = style
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const setError = (message: string | null) => {
    error.value = message
  }

  const setFilters = (newFilters: Partial<StyleFilter>) => {
    filters.value = { ...filters.value, ...newFilters }
    pagination.value.page = 1 // Reset to first page when filters change
  }

  const setPagination = (page: number, pageSize: number) => {
    pagination.value = { page, pageSize }
  }

  const resetState = () => {
    styles.value = []
    currentStyle.value = null
    isLoading.value = false
    error.value = null
    totalCount.value = 0
    filters.value = {
      search: '',
      status: 'all',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }
    pagination.value = {
      page: 1,
      pageSize: 10,
    }
  }

  return {
    // State
    styles,
    currentStyle,
    isLoading,
    error,
    totalCount,
    filters,
    pagination,

    // Getters
    filteredStyles,
    sortedAndPaginatedStyles,

    // Actions
    setStyles,
    addStyle,
    updateStyleInStore,
    removeStyle,
    setCurrentStyle,
    setLoading,
    setError,
    setFilters,
    setPagination,
    resetState,
  }
})
