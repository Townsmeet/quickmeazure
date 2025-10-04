import { ref, computed, watch, readonly, shallowRef } from 'vue'
import type { Ref } from 'vue'
import type { AsyncData } from 'nuxt/app'

// Generic interfaces for list data management
export interface ListFilters {
  page: number
  limit: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  [key: string]: unknown
}

export interface ListResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNextPage?: boolean
    hasPrevPage?: boolean
  }
}

export interface ListState<T> {
  items: Ref<T[]>
  totalCount: Ref<number>
  currentPage: Ref<number>
  pageSize: Ref<number>
  search: Ref<string>
  sortBy: Ref<string>
  isLoading: Ref<boolean>
  isFilterOpen: Ref<boolean>
  additionalFilters: Ref<Record<string, unknown>>
  hasActiveFilters: Ref<boolean>
  activeFiltersCount: Ref<number>
}

export interface ListActions {
  handleSearch: (value: string) => void
  handleSort: (value: string) => void
  handlePageChange: (page: number) => void
  resetFilters: () => void
  refresh: () => Promise<void>
}

export interface UseListDataOptions<T> {
  endpoint: string
  defaultPageSize?: number
  defaultSortBy?: string
  filterKeys?: string[]
  transform?: (item: unknown) => T
  serverSide?: boolean
  sortByMapping?: Record<string, { sortBy: string; sortOrder: string }>
}

/**
 * Unified composable for list data management
 * Provides consistent patterns for fetching, filtering, sorting, and pagination
 */
export function useListData<T = unknown>(
  options: UseListDataOptions<T>
): {
  state: ListState<T>
  actions: ListActions
  data: AsyncData<ListResponse<T>, Error | null>
  setFilter: (key: string, value: unknown) => void
  getFilter: (key: string) => unknown
  additionalFilters: Readonly<Ref<Record<string, unknown>>>
} {
  const {
    endpoint,
    defaultPageSize = 10,
    defaultSortBy = 'createdAt-desc',
    filterKeys = [],
    transform,
    serverSide = false,
    sortByMapping = {},
  } = options

  // Reactive state
  const items = shallowRef<T[]>([])
  const totalCount = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(defaultPageSize)
  const search = ref('')
  const sortBy = ref(defaultSortBy)
  const isLoading = ref(false)
  const isFilterOpen = ref(false)

  // Additional filters (dynamic based on filterKeys)
  const additionalFilters = ref<Record<string, unknown>>({})

  // Initialize additional filters
  filterKeys.forEach(key => {
    additionalFilters.value[key] = null
  })

  // Computed filters for API
  const apiFilters = computed(() => {
    const filters: ListFilters = {
      page: currentPage.value,
      limit: pageSize.value,
    }

    if (search.value) {
      filters.search = search.value
    }

    // Parse sortBy to extract field and order
    if (sortBy.value) {
      if (sortByMapping[sortBy.value]) {
        // Use custom mapping if available
        const mapping = sortByMapping[sortBy.value]
        filters.sortBy = mapping.sortBy
        filters.sortOrder = mapping.sortOrder as 'asc' | 'desc'
      } else {
        // Default parsing
        const [field, order] = sortBy.value.split('-')
        filters.sortBy = field
        filters.sortOrder = (order as 'asc' | 'desc') || 'asc'
      }
    }

    // Add additional filters
    Object.entries(additionalFilters.value).forEach(([key, value]) => {
      if (
        value !== null &&
        value !== undefined &&
        value !== '' &&
        value !== 'all' &&
        value !== 'any'
      ) {
        filters[key] = value
      }
    })

    return filters
  })

  // Computed properties
  const hasActiveFilters = computed(() => {
    return (
      search.value !== '' ||
      sortBy.value !== defaultSortBy ||
      Object.values(additionalFilters.value).some(
        value =>
          value !== null &&
          value !== undefined &&
          value !== '' &&
          value !== 'all' &&
          value !== 'any'
      )
    )
  })

  const activeFiltersCount = computed(() => {
    let count = 0
    if (search.value) count++
    if (sortBy.value !== defaultSortBy) count++

    Object.values(additionalFilters.value).forEach(value => {
      if (
        value !== null &&
        value !== undefined &&
        value !== '' &&
        value !== 'all' &&
        value !== 'any'
      ) {
        count++
      }
    })

    return count
  })

  // Data fetching with useAsyncData
  const asyncData = useAsyncData<ListResponse<T>>(
    `${endpoint}-${JSON.stringify(apiFilters.value)}`,
    async () => {
      const response = await $fetch<ListResponse<T>>(endpoint, {
        method: 'GET',
        params: apiFilters.value,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response || !response.data) {
        throw new Error(`Failed to fetch data from ${endpoint}`)
      }

      return response
    },
    {
      server: serverSide,
      default: () => ({
        data: [],
        pagination: {
          page: 1,
          limit: defaultPageSize,
          totalCount: 0,
          totalPages: 0,
        },
      }),
      watch: [apiFilters],
    }
  )

  const { data, pending, error, refresh } = asyncData

  // Watch for data changes and update local state
  watch(
    data,
    newData => {
      if (newData) {
        items.value = transform ? newData.data.map(transform) : (newData.data as T[])
        totalCount.value = newData.pagination.totalCount
      }
    },
    { immediate: true }
  )

  // Watch for loading state
  watch(
    pending,
    newPending => {
      isLoading.value = newPending
    },
    { immediate: true }
  )

  // Handle errors
  watch(
    error,
    newError => {
      if (newError) {
        console.error(`Error fetching data from ${endpoint}:`, newError)
        useToast().add({
          title: 'Error',
          description: 'Failed to load data. Please try again.',
          color: 'error',
        })
      }
    },
    { immediate: true }
  )

  // Actions
  const handleSearch = (value: string) => {
    search.value = value
    currentPage.value = 1
  }

  const handleSort = (value: string) => {
    sortBy.value = value
    currentPage.value = 1
  }

  const handlePageChange = (page: number) => {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetFilters = () => {
    search.value = ''
    sortBy.value = defaultSortBy
    currentPage.value = 1
    isFilterOpen.value = false

    // Reset additional filters
    filterKeys.forEach(key => {
      additionalFilters.value[key] = null
    })
  }

  // Expose filter setters for additional filters
  const setFilter = (key: string, value: unknown) => {
    if (filterKeys.includes(key)) {
      additionalFilters.value[key] = value
      currentPage.value = 1
    }
  }

  const getFilter = (key: string) => {
    return additionalFilters.value[key]
  }

  return {
    state: {
      items,
      totalCount,
      currentPage,
      pageSize,
      search,
      sortBy,
      isLoading,
      isFilterOpen,
      additionalFilters,
      hasActiveFilters,
      activeFiltersCount,
    },
    actions: {
      handleSearch,
      handleSort,
      handlePageChange,
      resetFilters,
      refresh,
    },
    data: asyncData,
    // Additional utilities
    setFilter,
    getFilter,
    additionalFilters: readonly(additionalFilters),
  }
}
