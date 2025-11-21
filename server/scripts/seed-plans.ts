import { db } from '../database'
import { plans } from '../database/schema'
import { eq, and } from 'drizzle-orm'

async function seedPlans() {
  console.log('Seeding plans...')

  try {
    // Upsert (insert or update) both monthly and annual plans for each tier
    const planData = [
      // Free Monthly
      {
        slug: 'free',
        name: 'Free',
        description: 'Perfect for small tailoring businesses',
        price: 0,
        interval: 'month',
        features: JSON.stringify(['Basic measurements', 'Payment tracking']),
        isActive: true,
        isFeatured: false,
        maxClients: 100,
        maxStyles: 10,
        maxStorage: 100,
      },
      // Free Annual
      {
        slug: 'free',
        name: 'Free',
        description: 'Perfect for small tailoring businesses',
        price: 0,
        interval: 'annual',
        features: JSON.stringify(['Basic measurements', 'Payment tracking']),
        isActive: true,
        isFeatured: false,
        maxClients: 100,
        maxStyles: 10,
        maxStorage: 100,
      },
      // Standard Monthly
      {
        slug: 'standard',
        name: 'Standard',
        description: 'For growing tailoring businesses',
        price: 5000,
        interval: 'month',
        features: JSON.stringify([
          'Advanced measurements',
          'Payment tracking',
          'Style catalog',
          'Email notifications',
        ]),
        isActive: true,
        isFeatured: true,
        maxClients: 500,
        maxStyles: 50,
        maxStorage: 500,
      },
      // Standard Annual
      {
        slug: 'standard',
        name: 'Standard',
        description: 'For growing tailoring businesses',
        price: 50000, // Example: annual price (10x monthly)
        interval: 'annual',
        features: JSON.stringify([
          'Advanced measurements',
          'Payment tracking',
          'Style catalog',
          'Email notifications',
        ]),
        isActive: true,
        isFeatured: true,
        maxClients: 500,
        maxStyles: 50,
        maxStorage: 500,
      },
      // Premium Monthly
      {
        slug: 'premium',
        name: 'Premium',
        description: 'For established tailoring businesses',
        price: 10000,
        interval: 'month',
        features: JSON.stringify([
          'Advanced measurements',
          'Payment tracking',
          'Style catalog',
          'Email notifications',
          'Analytics dashboard',
          'Priority support',
        ]),
        isActive: true,
        isFeatured: false,
        maxClients: -1, // Unlimited
        maxStyles: -1, // Unlimited
        maxStorage: 2000,
      },
      // Premium Annual
      {
        slug: 'premium',
        name: 'Premium',
        description: 'For established tailoring businesses',
        price: 100000, // Example: annual price (10x monthly)
        interval: 'annual',
        features: JSON.stringify([
          'Advanced measurements',
          'Payment tracking',
          'Style catalog',
          'Email notifications',
          'Analytics dashboard',
          'Priority support',
        ]),
        isActive: true,
        isFeatured: false,
        maxClients: -1, // Unlimited
        maxStyles: -1, // Unlimited
        maxStorage: 2000,
      },
    ]

    for (const plan of planData) {
      // Upsert by slug and interval
      const existing = await db.query.plans.findFirst({
        where: (fields, { eq, and }) =>
          and(eq(fields.slug, plan.slug), eq(fields.interval, plan.interval)),
      })
      if (existing) {
        await db
          .update(plans)
          .set(plan)
          .where(and(eq(plans.slug, plan.slug), eq(plans.interval, plan.interval)))
        console.log(`✅ Updated plan: ${plan.name} (${plan.interval})`)
      } else {
        await db.insert(plans).values(plan)
        console.log(`✨ Created plan: ${plan.name} (${plan.interval})`)
      }
    }

    console.log('✅ Plans seeded successfully!')
  } catch (error) {
    console.error('Error seeding plans:', error)
  }
}

// Run the seed function
seedPlans()
