import { db } from '../database'
import { plans } from '../database/schema'

async function seedPlans() {
  console.log('Seeding plans...')

  try {
    // Check if plans already exist
    const existingPlans = await db.select().from(plans)

    if (existingPlans.length > 0) {
      console.log('Plans already exist, skipping seed')
      return
    }

    // Insert initial plans
    await db.insert(plans).values([
      {
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
      {
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
      {
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
    ])

    console.log('Plans seeded successfully')
  } catch (error) {
    console.error('Error seeding plans:', error)
  }
}

// Run the seed function
seedPlans()
