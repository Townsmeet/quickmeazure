<template>
  <UCard class="border-0 shadow-md">
    <template #header>
      <div class="flex items-start justify-between">
        <div class="flex items-center space-x-4">
          <USkeleton class="h-12 w-12 rounded-full" />
          <div class="flex-1 space-y-2">
            <USkeleton class="h-5 w-28" />
            <USkeleton class="h-4 w-20" />
          </div>
        </div>
        <USkeleton class="h-8 w-8 rounded" />
      </div>
    </template>

    <div class="space-y-4">
      <div class="space-y-3">
        <div class="flex items-center space-x-3">
          <USkeleton class="h-4 w-4" />
          <USkeleton class="h-4 w-40" />
        </div>
        <div class="flex items-center space-x-3">
          <USkeleton class="h-4 w-4" />
          <USkeleton class="h-4 w-32" />
        </div>
        <div class="flex items-center space-x-3">
          <USkeleton class="h-4 w-4" />
          <USkeleton class="h-4 w-28" />
        </div>
      </div>

      <div class="pt-4 border-t border-gray-100">
        <div class="flex items-center gap-4">
          <USkeleton class="h-4 w-16" />
          <USkeleton class="h-4 w-20" />
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
// Minimal skeleton for client cards
</script>
