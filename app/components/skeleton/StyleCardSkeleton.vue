<template>
  <UCard class="border-0 shadow-md overflow-hidden">
    <template #header>
      <div class="p-0">
        <USkeleton class="h-48 w-full" />
      </div>
    </template>

    <div class="space-y-4">
      <div>
        <USkeleton class="h-6 w-3/4 mb-2" />
        <USkeleton class="h-4 w-full" />
        <USkeleton class="h-4 w-2/3" />
      </div>

      <div class="flex items-center justify-between pt-4 border-t border-gray-100">
        <div class="flex items-center space-x-2">
          <USkeleton class="h-4 w-4" />
          <USkeleton class="h-4 w-16" />
        </div>
        <USkeleton class="h-8 w-8 rounded" />
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
// Style skeleton matches the style card layout
</script>
