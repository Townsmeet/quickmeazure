// Import the Plan type from subscription types
import type { Plan } from '../types/subscription'

// Define plan type that extends the Plan interface
type LocalPlan = Omit<Plan, 'interval'> & {
  interval: 'month' | 'year' // Local interval format
}

// Define the base monthly plans
export const monthlyPlans: LocalPlan[] = [
  {
    id: 1,
    name: 'Growth',
    description: 'Basic plan for solo tailors just getting started',
    price: 0,
    interval: 'month',
    maxClients: 50,
    isActive: true,
    isFeatured: false,
    features: {
      clients: true,
      styles: true,
      orders: true,
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Professional',
    description: 'Perfect for growing tailor businesses',
    price: 3000,
    interval: 'month',
    maxClients: 200,
    isActive: true,
    isFeatured: true,
    features: {
      clients: true,
      styles: true,
      orders: true,
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Enterprise',
    description: 'For established tailor businesses with multiple staff',
    price: 5000,
    interval: 'month',
    maxClients: -1, // Unlimited
    isActive: true,
    isFeatured: false,
    features: {
      clients: true,
      styles: true,
      orders: true,
      team: true,
    },
    createdAt: new Date().toISOString(),
  },
]

// Create annual plans (with separate fixed DB IDs)
export const annualPlans: LocalPlan[] = [
  {
    ...monthlyPlans[0],
    id: 1, // Use ID 1 for annual Growth plan
    price: Math.round(monthlyPlans[0].price * 10), // Annual price = 10 months (2 months free)
    interval: 'year',
  },
  {
    ...monthlyPlans[1],
    id: 4, // Use ID 4 for annual Professional plan (from DB)
    price: Math.round(monthlyPlans[1].price * 10), // Annual price = 10 months (2 months free)
    interval: 'year',
  },
  {
    ...monthlyPlans[2],
    id: 5, // Use ID 5 for annual Enterprise plan (from DB)
    price: Math.round(monthlyPlans[2].price * 10), // Annual price = 10 months (2 months free)
    interval: 'year',
  },
]

// Format price for display
export const formatPrice = (price: number | undefined | null, _isAnnual = false): string => {
  if (price === undefined || price === null) return '₦0'

  return `₦${price.toLocaleString()}`
}

/**
 * Convert local plan format to the Plan format used in the application
 */
export const convertToAppPlan = (localPlan: LocalPlan): Plan => {
  return {
    ...localPlan,
    // Convert interval from 'month'/'year' to 'monthly'/'annual'
    interval: localPlan.interval === 'month' ? 'monthly' : 'annual',
    // Ensure all required fields are present
    limits: {
      clients: localPlan.maxClients || 0,
      styles: 100, // Default value
      storage: 100, // Default value in MB
    },
  }
}
