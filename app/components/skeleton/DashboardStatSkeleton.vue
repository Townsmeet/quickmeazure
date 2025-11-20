<template>
  <UCard class="bg-white">
    <template #header>
      <div class="flex justify-between items-center">
        <USkeleton class="h-4 w-32" />
        <USkeleton class="h-5 w-5" />
      </div>
    </template>

    <div class="text-3xl font-bold">
      <USkeleton class="h-10 w-32" />
    </div>

    <template #footer>
      <div class="text-sm text-gray-500">
        <USkeleton class="h-4 w-24" />
      </div>
    </template>
  </UCard>
</template>

<script setup lang="ts">
// Dashboard stat skeleton
</script>
