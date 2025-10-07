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
definePageMeta({
  layout: 'default',
})

const { isAuthenticated } = useAuth()

// Check if user is logged in, if so redirect to dashboard
onMounted(() => {
  if (isAuthenticated.value) {
    navigateTo('/dashboard')
  }
})
</script>
