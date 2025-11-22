<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
    <!-- Dark mode toggle in top right -->
    <div class="absolute top-4 right-4 z-10">
      <ClientOnly v-if="!colorMode?.forced">
        <UButton
          :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
          color="neutral"
          variant="ghost"
          :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          class="flex items-center justify-center h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          @click="isDark = !isDark"
        />
      </ClientOnly>
    </div>

    <main class="flex-1 pt-4 px-4 sm:pt-8 sm:px-6">
      <slot />
    </main>
  </div>
</template>

<script setup>
// Color mode
const colorMode = useColorMode()
const isDark = computed({
  get() {
    return colorMode.value === 'dark'
  },
  set(_isDark) {
    colorMode.preference = _isDark ? 'dark' : 'light'
  },
})
</script>
