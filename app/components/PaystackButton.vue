<template>
  <UButton
    :color="color"
    :variant="variant"
    :size="size"
    :icon="icon"
    :loading="loading"
    :disabled="disabled || loading"
    @click="initiatePayment"
  >
    <slot>Make Payment</slot>
  </UButton>
</template>

<script setup>
import { ref } from 'vue'
import { usePaystack } from '~/composables/usePaystack'
import { useAuthStore } from '~/store/modules/auth'
// Direct API calls instead of using useSubscriptionManagement

const props = defineProps({
  amount: {
    type: Number,
    required: true,
  },
  planId: {
    type: String,
    required: true,
  },
  planName: {
    type: String,
    required: true,
  },
  billingPeriod: {
    type: String,
    default: 'monthly',
  },
  color: {
    type: String,
    default: 'primary',
  },
  variant: {
    type: String,
    default: 'solid',
  },
  size: {
    type: String,
    default: 'md',
  },
  icon: {
    type: String,
    default: undefined,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['success', 'error'])

const loading = ref(false)
const { processPayment } = usePaystack()
const toast = useToast()
// Use direct $fetch calls instead of useSubscriptionManagement
const authStore = useAuthStore()

/**
 * Initiate payment with Paystack
 */
const initiatePayment = async () => {
  loading.value = true

  processPayment({
    amount: props.amount,
    planId: props.planId,
    planName: props.planName,
    billingPeriod: props.billingPeriod,
    onSuccess: async () => {
      loading.value = false

      // Reload subscription data using direct API call
      try {
        await $fetch('/api/subscriptions/current', {
          method: 'GET',
          headers: authStore.getAuthHeaders(),
        })
      } catch (error) {
        console.error('Failed to load subscription:', error)
      }

      toast.add({
        title: 'Payment Successful',
        description: `Your payment for the ${props.planName} plan was successful!`,
        color: 'green',
      })

      emit('success')
    },
    onError: error => {
      loading.value = false

      toast.add({
        title: 'Payment Failed',
        description: error.message || 'The payment was not successful. Please try again.',
        color: 'red',
      })

      emit('error', error)
    },
  })
}
</script>
