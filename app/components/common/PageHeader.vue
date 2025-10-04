<template>
  <div class="fixed top-0 right-0 left-0 md:left-64 z-40 bg-white">
    <div class="relative px-6 py-4">
      <div class="flex flex-row justify-between gap-2 sm:items-center">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-gray-800 group">
            {{ title }}
          </h1>
        </div>
        <slot name="actions">
          <UButton
            v-if="primaryAction"
            :to="primaryAction.to"
            color="primary"
            size="lg"
            class="self-start sm:self-auto px-3 sm:px-4 py-1.5 sm:py-2 shadow-sm hover:shadow-md transition-shadow"
            @click="primaryAction.onClick && primaryAction.onClick()"
          >
            {{ primaryAction.label }}
          </UButton>
        </slot>
      </div>
      <!-- Bottom border line -->
      <div class="absolute bottom-0 left-0 right-0 h-px bg-gray-200"></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  /**
   * The main title of the page
   */
  title: {
    type: String,
    required: true,
  },

  /**
   * Optional primary action button configuration
   */
  primaryAction: {
    type: Object,
    default: null,
    // Expected shape:
    // {
    //   label: 'Button Text',
    //   to: '/some/route',  // optional, for router-link
    //   onClick: () => {}   // optional, for click handler
    // }
  },
})
</script>
