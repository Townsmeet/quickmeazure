<template>
  <div>
    <HeroSection />
    <FeaturesSection />
    <PricingSection />
    <TestimonialsSection />
    <CtaSection />
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/store/modules/auth'

definePageMeta({
  layout: 'default',
})

const authStore = useAuthStore()
const { isLoggedIn } = storeToRefs(authStore)

// Check if user is logged in, if so redirect to dashboard
onMounted(() => {
  if (isLoggedIn.value) {
    console.log('User is logged in, redirecting to dashboard')
    navigateTo('/dashboard')
  }
})
</script>
