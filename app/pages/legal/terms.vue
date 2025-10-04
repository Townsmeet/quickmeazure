<template>
  <div class="container mx-auto px-4 py-12">
    <div class="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-md">
      <h1 class="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>

      <div class="prose prose-lg max-w-none">
        <p class="text-gray-600">Last updated: {{ new Date().toLocaleDateString() }}</p>

        <h2 class="text-xl font-semibold mt-8 mb-4">1. Introduction</h2>
        <p>
          Welcome to QuickMeazure. These Terms of Service govern your use of our website and
          services. By accessing or using QuickMeazure, you agree to be bound by these Terms.
        </p>

        <h2 class="text-xl font-semibold mt-8 mb-4">2. Definitions</h2>
        <p>
          "Service" refers to the QuickMeazure application, which allows tailors and fashion
          designers to manage client measurements, styles, and orders.
        </p>
        <p>"User," "You," and "Your" refers to the individual or entity using our Service.</p>
        <p>"Company," "We," "Us," and "Our" refers to QuickMeazure.</p>

        <h2 class="text-xl font-semibold mt-8 mb-4">3. Account Registration</h2>
        <p>
          To use certain features of the Service, you must register for an account. You agree to
          provide accurate information during the registration process and to keep your account
          information updated.
        </p>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials and
          for all activities that occur under your account.
        </p>

        <h2 class="text-xl font-semibold mt-8 mb-4">4. Subscription Plans</h2>
        <p>
          QuickMeazure offers different subscription plans with varying features and limitations.
          The details of each plan are provided during the registration process.
        </p>
        <p>
          We reserve the right to modify, terminate, or otherwise amend our offered subscription
          plans at any time.
        </p>

        <h2 class="text-xl font-semibold mt-8 mb-4">5. Client Data</h2>
        <p>
          You retain all rights to the client data you store on QuickMeazure. You are solely
          responsible for the accuracy and content of this data.
        </p>
        <p>
          We will not use your client data for any purpose other than providing and improving our
          Service to you.
        </p>

        <h2 class="text-xl font-semibold mt-8 mb-4">6. Acceptable Use</h2>
        <p>You agree not to use the Service to:</p>
        <ul class="list-disc ml-6 my-4">
          <li>Violate any applicable laws or regulations</li>
          <li>Infringe on the intellectual property rights of others</li>
          <li>Transmit any material that is defamatory, offensive, or otherwise objectionable</li>
          <li>
            Attempt to interfere with or disrupt the Service or servers connected to the Service
          </li>
          <li>Attempt to reverse engineer, decompile, or disassemble any portion of the Service</li>
        </ul>

        <h2 class="text-xl font-semibold mt-8 mb-4">7. Termination</h2>
        <p>
          We may terminate or suspend your account and access to the Service immediately, without
          prior notice or liability, for any reason, including if you breach these Terms.
        </p>
        <p>Upon termination, your right to use the Service will immediately cease.</p>

        <h2 class="text-xl font-semibold mt-8 mb-4">8. Limitation of Liability</h2>
        <p>
          In no event shall QuickMeazure, its directors, employees, partners, agents, suppliers, or
          affiliates be liable for any indirect, incidental, special, consequential, or punitive
          damages, including without limitation, loss of profits, data, use, goodwill, or other
          intangible losses.
        </p>

        <h2 class="text-xl font-semibold mt-8 mb-4">9. Changes to Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. We will provide notice of
          significant changes by posting the new Terms on this page and updating the "Last updated"
          date.
        </p>
        <p>
          Your continued use of the Service after any such changes constitutes your acceptance of
          the new Terms.
        </p>

        <h2 class="text-xl font-semibold mt-8 mb-4">10. Contact Us</h2>
        <p>
          If you have any questions about these Terms, please contact us at
          support@quickmeazure.com.
        </p>
      </div>

      <div class="mt-10 text-center">
        <UButton to="/" color="gray" variant="ghost"> Return to Home </UButton>
      </div>
    </div>
  </div>
</template>

<script setup>
// Set page metadata
useHead({
  title: 'Terms of Service - QuickMeazure',
  meta: [
    {
      name: 'description',
      content: 'Terms of Service for QuickMeazure, a tailor measurement management application.',
    },
  ],
})

// Set layout for this page
definePageMeta({
  layout: 'default',
})
</script>
