<template>
  <USlideover
    :open="isOpen"
    title="Edit Client"
    side="right"
    @update:open="value => !value && $emit('close')"
  >
    <template #body>
      <div v-if="localClient" class="space-y-6">
        <UForm :state="localClient" class="space-y-4">
          <!-- Client Information -->
          <div class="space-y-4">
            <h4 class="text-lg font-medium text-gray-900 dark:text-white">Client Information</h4>

            <UFormField label="Full Name" name="name" required>
              <UInput v-model="localClient.name" placeholder="Enter full name" class="w-full" />
            </UFormField>

            <UFormField label="Gender" name="gender" required>
              <URadioGroup v-model="clientGender" :items="genderOptions" orientation="horizontal" />
            </UFormField>

            <UFormField label="Email" name="email">
              <UInput
                v-model="localClient.email"
                type="email"
                placeholder="Enter email address"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Phone" name="phone">
              <UInput v-model="localClient.phone" placeholder="Enter phone number" class="w-full" />
            </UFormField>

            <UFormField label="Address" name="address">
              <UTextarea v-model="localClient.address" placeholder="Enter address" class="w-full" />
            </UFormField>

            <UFormField label="Notes" name="notes">
              <UTextarea
                v-model="localClient.notes"
                placeholder="Add any notes about this client"
                :rows="3"
                class="w-full"
              />
            </UFormField>
          </div>

          <!-- Measurements -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h4 class="text-lg font-medium text-gray-900 dark:text-white">
                Measurements
                <span v-if="localClient.measurement"> ({{ commonUnitDisplay }}) </span>
              </h4>
            </div>

            <div v-if="localClient.measurement && localClient.measurement.values">
              <!-- Measurements Grid -->
              <div class="grid grid-cols-2 gap-4">
                <UFormField
                  v-for="[key, measurement] in Object.entries(
                    localClient.measurement.values
                  ).filter(([k]) => k !== '_template')"
                  :key="key"
                  :label="
                    typeof measurement === 'object' && measurement.name ? measurement.name : key
                  "
                  :name="`measurement.${key}`"
                >
                  <div class="flex gap-2">
                    <UInput
                      :model-value="getMeasurementValue(key)"
                      type="number"
                      step="0.1"
                      class="flex-1"
                      @update:model-value="setMeasurementValue(key, $event)"
                    />
                  </div>
                </UFormField>
              </div>

              <!-- Measurement Notes -->
              <UFormField label="Measurement Notes" name="measurement.notes" class="mt-4">
                <UTextarea
                  v-model="localClient.measurement.notes"
                  placeholder="Add any notes about these measurements"
                  class="w-full"
                  :rows="3"
                />
              </UFormField>
            </div>

            <div v-else class="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <UIcon name="i-heroicons-ruler" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p class="text-gray-500">No measurements recorded yet</p>
            </div>
          </div>
        </UForm>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end space-x-3">
        <UButton
color="neutral"
variant="outline"
:disabled="isSaving"
@click="$emit('close')">
          Cancel
        </UButton>
        <UButton
          color="primary"
          :loading="isSaving"
          :disabled="!localClient"
          :trailing-icon="isSaving ? 'i-heroicons-arrow-path' : undefined"
          @click="handleSave"
        >
          <span v-if="!isSaving">Save Changes</span>
          <span v-else>Saving...</span>
        </UButton>
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import type { Client } from '~/types/client'

interface Props {
  isOpen: boolean
  client: Client | null
  isSaving?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'save', client: Client): void
}

const props = withDefaults(defineProps<Props>(), {
  isSaving: false,
})
const emit = defineEmits<Emits>()

// Loading state exposed to the template
const isSaving = computed(() => props.isSaving)

// Gender options
const genderOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
]

// Local reactive copy of client data to avoid prop mutation
const localClient = ref<Client | null>(null)

// Watch for changes in the client prop and update local copy
watch(
  () => props.client,
  newClient => {
    if (newClient) {
      // Create a deep copy to avoid reference issues
      localClient.value = JSON.parse(JSON.stringify(newClient))
    } else {
      localClient.value = null
    }
  },
  { immediate: true, deep: true }
)

// Computed property for gender to handle null values
const clientGender = computed({
  get: () => localClient.value?.gender || '',
  set: (value: string) => {
    if (localClient.value) {
      localClient.value.gender = value
    }
  },
})

// Save handler with loading state
const handleSave = async () => {
  if (!localClient.value) return

  emit('save', localClient.value)
}

const commonUnitDisplay = computed(() => {
  if (!localClient.value?.measurement?.values?._template?.unit) return 'in'
  return localClient.value.measurement.values._template.unit
})

// Helper methods for safe measurement value access
const getMeasurementValue = (key: string) => {
  if (!localClient.value?.measurement?.values?.[key]) {
    return 0
  }
  const measurement = localClient.value.measurement.values[key]
  return typeof measurement === 'object' ? measurement.value || 0 : measurement
}

const setMeasurementValue = (key: string, value: number) => {
  if (!localClient.value?.measurement?.values?.[key]) {
    return
  }
  const measurement = localClient.value.measurement.values[key]
  if (typeof measurement === 'object') {
    measurement.value = value
  }
}
</script>
