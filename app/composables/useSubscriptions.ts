import { useApi } from './useApi'

export type Subscription = {
  id: number
  userId: string
  planId: number
  status: string
  startDate: string | Date
  endDate?: string | Date | null
  billingPeriod: 'monthly' | 'annual'
  amount: number
  paymentReference?: string | null
  paymentMethod?: string | null
  nextBillingDate?: string | Date | null
  createdAt?: string | Date | null
  updatedAt?: string | Date | null
}

export function useSubscriptions() {
  const { request, loading, error } = useApi()

  async function create(input: {
    planId: number | string
    planName?: string
    paymentReference?: string
    billingPeriod: 'monthly' | 'annual'
    amount?: number
    cardDetails?: Record<string, any>
  }) {
    return await request<{ success: true; data: { subscription: Subscription; token: string } }>(
      '/api/subscriptions/create',
      {
        method: 'POST',
        body: input as any,
      }
    )
  }

  return { create, loading, error }
}
