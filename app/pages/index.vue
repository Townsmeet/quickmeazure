<template>
  <div>
    <HeroSection />
    <FeaturesSection />
    <PricingSection />
    <!-- <TestimonialsSection /> -->
    <CtaSection />
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'default',
})

// SEO Meta Tags
useSeoMeta({
  title: 'QuickMeazure - Modern Tailor Business Management Software',
  description:
    'Streamline your tailoring business with QuickMeazure. Manage clients, track measurements, process orders, and handle payments effortlessly. Perfect for tailors, fashion designers, and clothing businesses.',
  ogTitle: 'QuickMeazure - Modern Tailor Business Management Software',
  ogDescription:
    'Streamline your tailoring business with QuickMeazure. Manage clients, track measurements, process orders, and handle payments effortlessly.',
  ogType: 'website',
  ogUrl: 'https://quickmeazure.com',
  ogSiteName: 'QuickMeazure',
  twitterCard: 'summary_large_image',
  twitterTitle: 'QuickMeazure - Modern Tailor Business Management Software',
  twitterDescription:
    'Streamline your tailoring business with QuickMeazure. Manage clients, track measurements, process orders, and handle payments effortlessly.',
})

defineOgImage({
  url: '/sewingmachine.png',
  alt: 'Sewing Machine',
})

// Dynamic OG Image
defineOgImageComponent('Nuxt', {
  title: 'QuickMeazure 👋',
  description: 'Modern Tailor Business Management',
  theme: '#0d9488',
})

// Structured Data - Organization
useSchemaOrg([
  {
    '@type': 'Organization',
    name: 'QuickMeazure',
    url: 'https://quickmeazure.com',
    logo: 'https://quickmeazure.com/logo.png',
    description:
      'Modern tailor business management software for tracking clients, measurements, orders, and payments.',
    sameAs: [
      // Add social media links when available
    ],
  },
  {
    '@type': 'SoftwareApplication',
    name: 'QuickMeazure',
    applicationCategory: 'BusinessApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'NGN',
    },
    operatingSystem: 'Web',
  },
])
</script>
