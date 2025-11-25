<template>
  <UModal v-model:open="isOpen" :dismissible="false">
    <template #content>
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Delete Template</h3>
        </template>
        <p class="text-gray-600 dark:text-gray-400">
          Are you sure you want to delete this template? This action cannot be undone.
        </p>
        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="neutral" variant="outline" @click="cancel"> Cancel </UButton>
            <UButton color="error" :loading="loading" @click="confirm"> Delete </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  open: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'confirm'): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
})

function cancel() {
  emit('update:open', false)
}

function confirm() {
  emit('confirm')
}
</script>
