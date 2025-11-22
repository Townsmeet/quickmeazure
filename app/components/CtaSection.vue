<template>
  <section class="py-8 bg-gray-50 dark:bg-gray-900">
    <div class="max-w-6xl mx-auto px-4">
      <div
        class="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md dark:shadow-gray-700/50 border border-gray-200 dark:border-gray-700"
      >
        <div class="max-w-4xl mx-auto text-center">
          <span
            class="inline-block px-4 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium text-sm mb-4"
            >TAILORING REVOLUTION</span
          >

          <h2 class="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Transform Your <span class="text-primary-600">Tailoring Business</span>
          </h2>

          <p class="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-6">
            Join the community of professional tailors who have elevated their workflow with
            QuickMeazure's precision measurement tools.
          </p>

          <div class="flex flex-row items-center justify-center gap-4">
            <UButton to="/auth/register" color="primary" size="xl"> Start For Free </UButton>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
