// Plan interface for our application
export interface Plan {
  id: string
  name: string
  description: string
  price: number
  interval: 'month' | 'annual'
  features: string[]
  maxClients: number
  isFeatured?: boolean
  isPopular?: boolean
}

// Base monthly plans
const basePlans = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    price: 0,
    features: ['Up to 50 clients', 'Email support (24h response)'],
    maxClients: 50,
    isFeatured: false,
    isPopular: false,
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'For growing fashion businesses',
    price: 4000,
    features: ['Up to 500 clients', 'WhatsApp/email support (1h response)'],
    maxClients: 500,
    isFeatured: true,
    isPopular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'For established fashion businesses',
    price: 10000,
    features: ['Unlimited clients', 'WhatsApp/email support (1h response)'],
    maxClients: -1, // Unlimited
    isFeatured: false,
    isPopular: false,
  },
]

// Monthly plans
export const monthlyPlans: Plan[] = basePlans.map(plan => ({
  ...plan,
  interval: 'month' as const,
}))

// Annual plans (15% discount - equivalent to 2 months free)
export const annualPlans: Plan[] = basePlans.map(plan => ({
  ...plan,
  interval: 'annual' as const,
  price: plan.price === 0 ? 0 : Math.round(plan.price * 10.2), // 10.2 months instead of 12 (15% discount)
}))

// All plans combined
export const allPlans = [...monthlyPlans, ...annualPlans]

// Helper functions
export const formatPrice = (price: number): string => {
  if (price === 0) return '₦0'
  return `₦${price.toLocaleString()}`
}

export const formatBillingCycle = (interval: 'month' | 'annual'): string => {
  return interval === 'month' ? '/month' : '/year'
}

export const formatBillingPeriod = (interval: 'month' | 'annual'): string => {
  return interval === 'month' ? 'billed monthly' : 'billed annually'
}

export const getPlanById = (
  id: string,
  interval: 'month' | 'annual' = 'month'
): Plan | undefined => {
  const plans = interval === 'month' ? monthlyPlans : annualPlans
  return plans.find(plan => plan.id === id)
}

export const getPlans = (interval: 'month' | 'annual' = 'month'): Plan[] => {
  return interval === 'month' ? monthlyPlans : annualPlans
}

// Calculate savings for annual plans
export const getAnnualSavings = (planId: string): number => {
  const monthlyPlan = getPlanById(planId, 'month')
  const annualPlan = getPlanById(planId, 'annual')

  if (!monthlyPlan || !annualPlan || monthlyPlan.price === 0) return 0

  const monthlyYearlyTotal = monthlyPlan.price * 12
  const annualTotal = annualPlan.price

  return monthlyYearlyTotal - annualTotal
}

export const getSavingsPercentage = (): number => {
  return 15 // 15% savings on annual plans
}
