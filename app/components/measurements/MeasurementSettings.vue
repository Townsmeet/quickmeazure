<template>
  <div class="max-w-4xl mx-auto">
    <!-- Settings Container -->
    <UCard class="mb-8">
      <template #header>
        <div class="flex items-center">
          <UIcon name="i-heroicons-cog-6-tooth" class="mr-2 text-primary-500 h-5 w-5" />
          <h2 class="text-xl font-semibold text-gray-900">Measurement Settings</h2>
        </div>
        <p class="mt-1 text-sm text-gray-500">
          Configure your preferred unit of measurement for all measurements.
        </p>
      </template>

      <UForm :state="settings" class="space-y-6" @submit="saveSettings">
        <!-- Default Unit -->
        <UFormField
          label="Default Unit"
          name="defaultUnit"
          help="This will be used for all new measurements"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
            <UCard
              v-for="unit in unitOptions"
              :key="unit.value"
              :ui="{
                body: 'p-4',
              }"
              :class="[
                'cursor-pointer transition-all hover:shadow-md',
                settings.defaultUnit === unit.value
                  ? 'ring-2 ring-primary-500 border-primary-500 bg-primary-50'
                  : 'hover:border-gray-300',
              ]"
              @click="settings.defaultUnit = unit.value as 'in' | 'cm'"
            >
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div
                    :class="[
                      'h-5 w-5 rounded-full border-2 flex items-center justify-center',
                      settings.defaultUnit === unit.value
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-gray-300',
                    ]"
                  >
                    <UIcon
                      v-if="settings.defaultUnit === unit.value"
                      name="i-heroicons-check"
                      class="h-3.5 w-3.5 text-white"
                    />
                  </div>
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-gray-900">
                    {{ unit.label }}
                  </h3>
                  <p class="text-xs text-gray-500">
                    {{ unit.description }}
                  </p>
                </div>
              </div>
            </UCard>
          </div>
        </UFormField>

        <!-- Form Actions -->
        <div class="flex justify-end pt-6">
          <UButton
type="submit"
:loading="isSaving"
icon="i-heroicons-check"
color="primary">
            Save Changes
          </UButton>
        </div>
      </UForm>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMeasurementSettings } from '~/composables/measurements/useMeasurementSettings'

const emit = defineEmits(['saved'])

const { settings, fetchSettings, updateSettings } = useMeasurementSettings()

const isSaving = ref(false)

const unitOptions = [
  {
    value: 'in',
    label: 'Inches (in)',
    description: 'Imperial system - standard in the US',
  },
  {
    value: 'cm',
    label: 'Centimeters (cm)',
    description: 'Metric system - used worldwide',
  },
]

// Fetch settings when component mounts
onMounted(async () => {
  await fetchSettings()
})

// Save settings
const saveSettings = async () => {
  isSaving.value = true

  try {
    await updateSettings({
      defaultUnit: settings.value.defaultUnit,
    })

    emit('saved')

    useToast().add({
      title: 'Settings saved',
      description: 'Your measurement preferences have been updated',
      icon: 'i-heroicons-check-circle',
      color: 'primary',
    })
  } catch (err) {
    console.error('Error saving settings:', err)
    useToast().add({
      title: 'Error saving settings',
      description: 'Please try again',
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle',
    })
  } finally {
    isSaving.value = false
  }
}
</script>
