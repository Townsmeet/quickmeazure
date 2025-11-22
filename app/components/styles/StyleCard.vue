<template>
  <div
    class="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-600 h-96 flex flex-col"
  >
    <!-- Image Section -->
    <div class="relative cursor-pointer" @click="$emit('click', style)">
      <!-- Single Image -->
      <div v-if="getImageCount(style) === 1" class="relative h-80">
        <img
          v-if="getFirstImageUrl(style)"
          :src="getFirstImageUrl(style)"
          :alt="style.name"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div
          v-else
          class="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
        >
          <UIcon name="i-heroicons-photo" class="w-12 h-12 text-gray-400" />
        </div>
      </div>

      <!-- Multiple Images with Carousel -->
      <div
        v-else-if="getImageCount(style) > 1"
        class="relative h-80 carousel-container overflow-hidden"
      >
        <div class="h-80 w-full overflow-hidden">
          <UCarousel
            v-if="getAllImageUrls(style).length > 0"
            v-slot="{ item }"
            :items="getAllImageUrls(style)"
            arrows
            dots
            loop
            auto-play
            class="w-full h-80"
            :prev="{ size: 'xs', color: 'neutral', variant: 'solid' }"
            :next="{ size: 'xs', color: 'neutral', variant: 'solid' }"
            :ui="{
              root: 'h-80 max-h-80',
              viewport: 'h-80 max-h-80 overflow-hidden',
              container: 'h-80 max-h-80',
              item: 'h-80 max-h-80',
              prev: 'absolute top-1/2 left-2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg',
              next: 'absolute top-1/2 right-2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg',
              dots: 'absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity',
              dot: 'w-2 h-2 bg-white/60 hover:bg-white',
            }"
          >
            <img
              :src="item"
              :alt="style.name"
              class="w-full h-80 max-h-80 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </UCarousel>
        </div>

        <!-- Multiple images indicator -->
        <div
          class="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm"
        >
          <UIcon name="i-heroicons-photo" class="w-3 h-3" />
          {{ getImageCount(style) }}
        </div>
      </div>

      <!-- No Image -->
      <div v-else class="w-full h-80 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        <UIcon name="i-heroicons-photo" class="w-12 h-12 text-gray-400" />
      </div>

      <!-- Hover Overlay -->
      <div
        class="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      ></div>
    </div>

    <!-- Footer -->
    <div
      class="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-700"
    >
      <span class="text-sm font-medium text-gray-900 dark:text-white truncate flex-1 mr-3">
        {{ style.name }}
      </span>

      <!-- Actions Menu -->
      <UDropdownMenu :items="actions" :popper="{ placement: 'bottom-end' }">
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-heroicons-ellipsis-horizontal"
          size="xs"
          @click.stop
        />
      </UDropdownMenu>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Style } from '~/types/style'

const props = defineProps<{
  style: Style
}>()

const emit = defineEmits<{
  (e: 'click' | 'view' | 'edit' | 'delete', style: Style): void
}>()

// Helper functions for multiple images
const getFirstImageUrl = (style: any) => {
  if (style.imageUrls && Array.isArray(style.imageUrls) && style.imageUrls.length > 0) {
    return style.imageUrls[0]
  }
  return style.imageUrl || null
}

const getAllImageUrls = (style: any): string[] => {
  if (style.imageUrls && Array.isArray(style.imageUrls) && style.imageUrls.length > 0) {
    return style.imageUrls.filter((url: any) => url && typeof url === 'string')
  }
  return style.imageUrl && typeof style.imageUrl === 'string' ? [style.imageUrl] : []
}

const getImageCount = (style: any) => {
  if (style.imageUrls && Array.isArray(style.imageUrls)) {
    return style.imageUrls.length
  }
  return style.imageUrl ? 1 : 0
}

const actions = [
  [
    {
      label: 'View Details',
      icon: 'i-heroicons-eye',
      onSelect: () => emit('view', props.style),
    },
    {
      label: 'Edit',
      icon: 'i-heroicons-pencil',
      onSelect: () => emit('edit', props.style),
    },
  ],
  [
    {
      label: 'Delete',
      icon: 'i-heroicons-trash',
      color: 'error' as const,
      onSelect: () => emit('delete', props.style),
    },
  ],
]
</script>

<style scoped>
/* Smooth image loading */
img {
  transition: opacity 0.3s ease;
}

img[src=''] {
  opacity: 0;
}

/* Ensure carousel doesn't overflow */
.carousel-container {
  height: 320px !important;
  max-height: 320px !important;
  overflow: hidden !important;
}

/* Force carousel components to respect height */
:deep(.carousel-container *) {
  max-height: 320px !important;
}
</style>
