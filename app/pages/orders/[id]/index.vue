<script setup>
// Redirect from /orders/[id] to /orders/[id]/detail
const route = useRoute()
const router = useRouter()

// On component mount, redirect to the detail page
onMounted(() => {
  router.replace(`/orders/${route.params.id}/detail`)
})
</script>

<template>
  <div class="flex justify-center items-center min-h-[200px]">
    <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400" />
  </div>
</template>
