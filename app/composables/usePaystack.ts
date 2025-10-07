import { initializePaystackPayment } from '../utils/paystack'

interface PaymentOptions {
  amount: number
  planId: string
  planName: string
  billingPeriod: string
  onSuccess?: () => void
  onError?: (error: unknown) => void
  onClose?: () => void
}

export const usePaystack = () => {
  const { user } = useAuth()
  const config = useRuntimeConfig()

  /**
   * Process payment with Paystack
   */
  const processPayment = async (options: PaymentOptions) => {
    try {
      // Check if user is logged in and has email
      if (!user.value?.email) {
        throw new Error('User email not available')
      }

      // Initialize Paystack payment
      initializePaystackPayment({
        key: config.public.paystackKey as string,
        email: user.value.email,
        amount: options.amount * 100, // Convert naira to kobo for Paystack
        currency: 'NGN',
        metadata: {
          plan_id: options.planId,
          plan_name: options.planName,
          billing_period: options.billingPeriod,
          user_id: user.value.id?.toString() || '',
        },
        callback: async response => {
          if (response.status === 'success') {
            // Verify payment with our server
            try {
              const verificationResult = await $fetch('/api/payments/verify', {
                method: 'POST',
                body: {
                  reference: response.reference,
                  plan_id: options.planId,
                  billing_period: options.billingPeriod,
                },
              })

              if (verificationResult.success) {
                if (options.onSuccess) {
                  options.onSuccess()
                }
              } else {
                throw new Error(verificationResult.message || 'Payment verification failed')
              }
            } catch (error) {
              if (options.onError) {
                options.onError(error)
              }
            }
          } else {
            if (options.onError) {
              options.onError(new Error('Payment failed'))
            }
          }
        },
        onClose: () => {
          // Payment window was closed
          console.log('Payment window closed')
          if (options.onClose) {
            options.onClose()
          }
        },
      })
    } catch (error) {
      if (options.onError) {
        options.onError(error)
      }
    }
  }

  /**
   * Process payment method verification with Paystack
   */
  const processPaymentMethodVerification = async (options: {
    email?: string
    onSuccess?: () => void
    onError?: (error: unknown) => void
  }) => {
    console.log('processPaymentMethodVerification called with options:', options)
    try {
      // Check if user is logged in and has email
      if (!user.value?.email) {
        throw new Error('User email not available')
      }

      console.log('Initializing Paystack payment for verification')
      // Initialize Paystack payment for 50 naira
      initializePaystackPayment({
        key: config.public.paystackKey as string,
        email: user.value.email,
        amount: 50 * 100, // 50 naira converted to kobo for verification
        currency: 'NGN',
        metadata: {
          purpose: 'payment_method_verification',
          user_id: user.value.id?.toString() || '',
        },
        callback: async response => {
          if (response.status === 'success') {
            // Verify payment with our server
            try {
              const verificationResult = await $fetch('/api/payments/verify-payment-method', {
                method: 'POST',
                body: {
                  reference: response.reference,
                },
              })

              console.log('Verification result:', verificationResult)

              // Check if the verification was successful
              if (verificationResult.success === true) {
                if (options.onSuccess) {
                  options.onSuccess()
                }
              } else {
                throw new Error('Payment verification failed')
              }
            } catch (error) {
              if (options.onError) {
                options.onError(error)
              }
            }
          } else {
            if (options.onError) {
              options.onError(new Error('Payment failed'))
            }
          }
        },
        onClose: () => {
          // Payment window was closed
          console.log('Payment window closed')
        },
      })
    } catch (error) {
      if (options.onError) {
        options.onError(error)
      }
    }
  }

  console.log('usePaystack composable initialized')

  return {
    processPayment,
    processPaymentMethodVerification,
  }
}
