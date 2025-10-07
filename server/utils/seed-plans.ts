import { db } from './drizzle'
import { plans } from '../database/schema'
import { eq } from 'drizzle-orm'
import { allPlans } from '../../app/data/subscription-plans'

/**
 * Seed or update plans in the database from the subscription-plans.ts file
 * This ensures the database is always in sync with your code
 */
export async function seedPlans() {
  console.log('🌱 Seeding plans...')

  for (const plan of allPlans) {
    try {
      // Check if plan exists by slug
      const existing = await db.query.plans.findFirst({
        where: eq(plans.slug, plan.id),
      })

      const planData = {
        slug: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        interval: plan.interval,
        features: JSON.stringify(plan.features),
        isFeatured: plan.isFeatured || false,
        maxClients: plan.maxClients,
        updatedAt: new Date(),
      }

      if (existing) {
        // Update existing plan
        await db.update(plans).set(planData).where(eq(plans.id, existing.id))
        console.log(`✅ Updated plan: ${plan.name} (${plan.interval})`)
      } else {
        // Insert new plan
        await db.insert(plans).values({
          ...planData,
          createdAt: new Date(),
        })
        console.log(`✨ Created plan: ${plan.name} (${plan.interval})`)
      }
    } catch (error) {
      console.error(`❌ Error seeding plan ${plan.name}:`, error)
    }
  }

  console.log('✅ Plans seeded successfully!')
}
