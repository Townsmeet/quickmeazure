<template>
  <section class="py-[3rem]">
    <h2 class="text-[1.875rem] font-bold text-center mb-[3rem]">Trusted by Tailors Everywhere</h2>

    <div class="grid md:grid-cols-3 gap-[2rem]">
      <div
        v-for="(testimonial, index) in testimonials"
        :key="index"
        class="bg-white p-[1.5rem] rounded-lg shadow-md"
      >
        <div class="flex items-center mb-[1rem]">
          <div class="text-[#FBBF24] flex">
            <UIcon v-for="i in testimonial.rating" :key="i" name="i-heroicons-star" />
          </div>
        </div>
        <p class="text-[#4B5563] mb-[1rem]">
          {{ testimonial.quote }}
        </p>
        <div class="flex items-center">
          <div class="w-[2.5rem] h-[2.5rem] bg-[#D1D5DB] rounded-full mr-[0.75rem]" />
          <div>
            <h4 class="font-medium">
              {{ testimonial.name }}
            </h4>
            <p class="text-[0.875rem] text-[#6B7280]">
              {{ testimonial.title }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const testimonials = [
  {
    rating: 5,
    quote:
      '"QuickMeazure has transformed how I manage my tailoring business. I can access client measurements instantly and never mix up orders anymore."',
    name: 'Adebayo Johnson',
    title: 'Fashion Designer, Lagos',
  },
  {
    rating: 5,
    quote:
      '"The payment tracking feature has helped me stay on top of my finances. I know exactly who has paid and who still owes a balance."',
    name: 'Chioma Okafor',
    title: 'Tailor, Abuja',
  },
  {
    rating: 5,
    quote:
      '"As my business grew, I upgraded to the Premium plan. The unlimited client capacity and analytics have been worth every penny."',
    name: 'Emmanuel Nwachukwu',
    title: 'Fashion House Owner, Port Harcourt',
  },
]
</script>
