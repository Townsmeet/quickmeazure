<template>
  <UModal :open="isOpen" @update:open="value => (isOpen = value)">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Add Payment Method</h3>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-heroicons-x-mark-20-solid"
              class="-my-1"
              @click="isOpen = false"
            />
          </div>
        </template>

        <div class="space-y-6">
          <!-- Authorization Notice -->
          <div
            class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
          >
            <div class="flex">
              <UIcon
                name="i-heroicons-information-circle"
                class="w-5 h-5 text-blue-400 mt-0.5 mr-3"
              />
              <div>
                <h4 class="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Payment Authorization
                </h4>
                <p class="mt-1 text-sm text-blue-700 dark:text-blue-300">
                  We'll charge ₦50 to verify your payment method. This amount will be refunded
                  immediately after verification.
                </p>
              </div>
            </div>
          </div>

          <!-- Payment Summary -->
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Authorization Summary
            </h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Authorization Amount:</span>
                <span class="font-medium text-gray-900 dark:text-white">₦50.00</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Refund:</span>
                <span class="font-medium text-green-600 dark:text-green-400"
                  >₦50.00 (Immediate)</span
                >
              </div>
              <div class="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-2">
                <span class="font-medium text-gray-900 dark:text-white">Net Charge:</span>
                <span class="font-medium text-gray-900 dark:text-white">₦0.00</span>
              </div>
            </div>
          </div>

          <!-- Payment Methods Info -->
          <div class="space-y-3">
            <h4 class="text-sm font-medium text-gray-900 dark:text-white">
              Supported Payment Methods
            </h4>
            <div class="grid grid-cols-1 gap-2">
              <div class="flex items-center text-sm">
                <UIcon name="i-heroicons-credit-card" class="w-4 h-4 text-gray-500 mr-2" />
                <span class="text-gray-600 dark:text-gray-400"
                  >Debit/Credit Cards (Visa, Mastercard, Verve)</span
                >
              </div>
              <div class="flex items-center text-sm">
                <UIcon name="i-heroicons-building-library" class="w-4 h-4 text-gray-500 mr-2" />
                <span class="text-gray-600 dark:text-gray-400">Bank Transfer</span>
              </div>
              <div class="flex items-center text-sm">
                <UIcon name="i-heroicons-device-phone-mobile" class="w-4 h-4 text-gray-500 mr-2" />
                <span class="text-gray-600 dark:text-gray-400">USSD Banking</span>
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end space-x-3">
            <UButton
color="neutral"
variant="outline"
:disabled="loading"
@click="isOpen = false">
              Cancel
            </UButton>
            <UButton color="primary" :loading="loading" @click="initializePaystack">
              Authorize Payment Method
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'added'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Reactive state
const loading = ref(false)

// Toast for notifications
const toast = useToast()

// Computed
const isOpen = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

// Methods
async function initializePaystack() {
  loading.value = true

  try {
    const { processPaymentMethodVerification } = usePaystack()

    await processPaymentMethodVerification({
      onSuccess: () => {
        emit('added')
        toast.add({
          title: 'Success',
          description: 'Payment method authorized and added successfully',
          color: 'success',
        })
        loading.value = false
      },
      onError: error => {
        console.error('Payment verification error:', error)
        toast.add({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Payment verification failed',
          color: 'error',
        })
        loading.value = false
      },
    })
  } catch (error) {
    console.error('Error initializing payment:', error)
    toast.add({
      title: 'Error',
      description: error instanceof Error ? error.message : 'Failed to initialize payment',
      color: 'error',
    })
    loading.value = false
  }
}
</script>
