<script setup lang="ts">
import { useAppRoutes } from '~/composables/useRoutes'

// Composable
const routes = useAppRoutes()
const route = useRoute()
const router = useRouter()

// On component mount, redirect to the detail page
onMounted(() => {
  const detailPath = (
    routes.ROUTE_PATHS[routes.ROUTE_NAMES.DASHBOARD.STYLES.VIEW] as (params: {
      id: string
    }) => string
  )({ id: route.params.id as string })
  router.replace(detailPath)
})
</script>

<template>
  <div class="flex justify-center items-center min-h-[200px]">
    <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400" />
  </div>
</template>
