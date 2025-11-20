<template>
  <UCard class="bg-white">
    <template #header>
      <div class="flex justify-between items-center">
        <USkeleton class="h-4 w-40" />
        <USkeleton class="h-6 w-24" />
      </div>
    </template>

    <div class="py-6">
      <div class="h-40 mb-4">
        <USkeleton class="h-full w-full" />
      </div>

      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <USkeleton class="h-4 w-3/4" />
          <USkeleton class="h-4 w-12" />
        </div>
        <div class="flex items-center justify-between">
          <USkeleton class="h-4 w-1/2" />
          <USkeleton class="h-4 w-20" />
        </div>
        <div class="flex items-center justify-between">
          <USkeleton class="h-4 w-2/3" />
          <USkeleton class="h-4 w-16" />
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
// Dashboard card skeleton (charts / activity)
</script>
