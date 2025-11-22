<template>
  <section id="features" class="py-12 bg-gray-50 dark:bg-gray-900">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        Everything You Need to Run Your Tailoring Business
      </h2>
      <p class="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
        Our all-in-one platform simplifies your workflow and helps you deliver exceptional service.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm dark:shadow-gray-700/50">
        <div
          class="h-12 w-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mb-4"
        >
          <UIcon name="i-heroicons-users" class="text-primary-600 text-xl" />
        </div>
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Client Management</h3>
        <p class="text-gray-600 dark:text-gray-300">
          Keep track of all your clients and their contact information in one centralized database.
        </p>
      </div>

      <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm dark:shadow-gray-700/50">
        <div
          class="h-12 w-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mb-4"
        >
          <UIcon name="i-heroicons-variable" class="text-primary-600 text-xl" />
        </div>
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Measurement Tracking</h3>
        <p class="text-gray-600 dark:text-gray-300">
          Record and organize all your client measurements with our easy-to-use digital system.
        </p>
      </div>

      <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm dark:shadow-gray-700/50">
        <div
          class="h-12 w-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mb-4"
        >
          <UIcon name="i-heroicons-shopping-bag" class="text-primary-600 text-xl" />
        </div>
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Order Management</h3>
        <p class="text-gray-600 dark:text-gray-300">
          Create and track orders from start to finish, including payment status and delivery dates.
        </p>
      </div>

      <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm dark:shadow-gray-700/50">
        <div
          class="h-12 w-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mb-4"
        >
          <UIcon name="i-heroicons-swatch" class="text-primary-600 text-xl" />
        </div>
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Style Catalog</h3>
        <p class="text-gray-600 dark:text-gray-300">
          Create a digital catalog of your designs and styles to easily reference during client
          consultations.
        </p>
      </div>

      <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm dark:shadow-gray-700/50">
        <div
          class="h-12 w-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mb-4"
        >
          <UIcon name="i-heroicons-currency-dollar" class="text-primary-600 text-xl" />
        </div>
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Payment Tracking</h3>
        <p class="text-gray-600 dark:text-gray-300">
          Record full and partial payments, and keep track of outstanding balances for each order.
        </p>
      </div>

      <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm dark:shadow-gray-700/50">
        <div
          class="h-12 w-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mb-4"
        >
          <UIcon name="i-heroicons-chart-bar" class="text-primary-600 text-xl" />
        </div>
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Business Insights</h3>
        <p class="text-gray-600 dark:text-gray-300">
          Gain valuable insights into your business performance with our analytics dashboard.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
const _features = [
  {
    icon: 'i-heroicons-user-group',
    title: 'Client Management',
    description: "Store all your clients' personal details in one secure place for easy access.",
  },
  {
    icon: 'i-heroicons-variable',
    title: 'Measurement Tracking',
    description: 'Record and access detailed measurements for each client with just a few clicks.',
  },
  {
    icon: 'i-heroicons-swatch',
    title: 'Style Catalog',
    description: 'Create a catalog of your styles and designs to show clients and track orders.',
  },
  {
    icon: 'i-heroicons-shopping-bag',
    title: 'Order Management',
    description:
      'Keep track of all your orders, their status, and due dates in one organized system.',
  },
  {
    icon: 'i-heroicons-currency-dollar',
    title: 'Payment Tracking',
    description: 'Record deposits and balances, and keep your finances organized with ease.',
  },
  {
    icon: 'i-heroicons-device-phone-mobile',
    title: 'Mobile Friendly',
    description: 'Access your client data and measurements from anywhere on any device.',
  },
]
</script>
