<template>
  <div class="container mx-auto px-4 py-12">
    <div class="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-md">
      <h1 class="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>

      <div class="prose prose-lg max-w-none">
        <p class="text-gray-600">Last updated: {{ new Date().toLocaleDateString() }}</p>

        <h2 class="text-xl font-semibold mt-8 mb-4">1. Introduction</h2>
        <p>
          At QuickMeazure, we respect your privacy and are committed to protecting your personal
          data. This Privacy Policy explains how we collect, use, disclose, and safeguard your
          information when you use our service.
        </p>

        <h2 class="text-xl font-semibold mt-8 mb-4">2. Information We Collect</h2>
        <p>We collect several types of information, including:</p>
        <ul class="list-disc ml-6 my-4">
          <li>
            <strong>Personal Information:</strong> Name, email address, and payment information when
            you register for an account.
          </li>
          <li>
            <strong>Client Data:</strong> Information about your clients, including their
            measurements and style preferences.
          </li>
          <li>
            <strong>Usage Data:</strong> Information about how you access and use our service,
            including your IP address, browser type, and pages visited.
          </li>
          <li>
            <strong>Cookies and Similar Technologies:</strong> We use cookies to enhance your
            experience and collect information about how you use our service.
          </li>
        </ul>

        <h2 class="text-xl font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul class="list-disc ml-6 my-4">
          <li>Provide, maintain, and improve our service</li>
          <li>Process transactions and manage your account</li>
          <li>Send you technical notices, updates, and support messages</li>
          <li>Respond to your comments and questions</li>
          <li>Monitor and analyze trends, usage, and activities in connection with our service</li>
          <li>
            Detect, investigate, and prevent fraudulent transactions and other illegal activities
          </li>
        </ul>

        <h2 class="text-xl font-semibold mt-8 mb-4">4. How We Share Your Information</h2>
        <p>
          We do not sell, trade, or otherwise transfer your personal information to outside parties
          except in the following circumstances:
        </p>
        <ul class="list-disc ml-6 my-4">
          <li>
            <strong>Service Providers:</strong> We may share your information with third-party
            service providers who perform services on our behalf, such as payment processing and
            data analysis.
          </li>
          <li>
            <strong>Legal Requirements:</strong> We may disclose your information if required by law
            or in response to valid requests by public authorities.
          </li>
          <li>
            <strong>Business Transfers:</strong> If we are involved in a merger, acquisition, or
            asset sale, your information may be transferred as part of that transaction.
          </li>
          <li>
            <strong>With Your Consent:</strong> We may share your information with third parties
            when we have your consent to do so.
          </li>
        </ul>

        <h2 class="text-xl font-semibold mt-8 mb-4">5. Data Security</h2>
        <p>
          We implement appropriate technical and organizational measures to protect your personal
          information against unauthorized access, alteration, disclosure, or destruction.
        </p>
        <p>
          However, no method of transmission over the Internet or electronic storage is 100% secure,
          and we cannot guarantee absolute security.
        </p>

        <h2 class="text-xl font-semibold mt-8 mb-4">6. Data Retention</h2>
        <p>
          We will retain your personal information only for as long as necessary to fulfill the
          purposes outlined in this Privacy Policy, unless a longer retention period is required or
          permitted by law.
        </p>

        <h2 class="text-xl font-semibold mt-8 mb-4">7. Your Rights</h2>
        <p>
          Depending on your location, you may have certain rights regarding your personal
          information, including:
        </p>
        <ul class="list-disc ml-6 my-4">
          <li>The right to access your personal information</li>
          <li>The right to rectify inaccurate or incomplete information</li>
          <li>The right to erase your personal information</li>
          <li>The right to restrict processing of your personal information</li>
          <li>The right to data portability</li>
          <li>The right to object to processing of your personal information</li>
        </ul>

        <h2 class="text-xl font-semibold mt-8 mb-4">8. Children's Privacy</h2>
        <p>
          Our Service is not intended for individuals under the age of 18. We do not knowingly
          collect personal information from children under 18. If we become aware that we have
          collected personal information from a child under 18, we will take steps to delete that
          information.
        </p>

        <h2 class="text-xl font-semibold mt-8 mb-4">9. Changes to This Privacy Policy</h2>
        <p>
          We may update our Privacy Policy from time to time. We will notify you of any changes by
          posting the new Privacy Policy on this page and updating the "Last updated" date.
        </p>
        <p>You are advised to review this Privacy Policy periodically for any changes.</p>

        <h2 class="text-xl font-semibold mt-8 mb-4">10. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us at
          privacy@quickmeazure.com.
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
definePageMeta({
  layout: 'default',
})

// SEO Meta Tags
useSeoMeta({
  title: 'Privacy Policy - QuickMeazure',
  description:
    'Read our privacy policy to understand how QuickMeazure collects, uses, and protects your personal information and data.',
  ogTitle: 'Privacy Policy - QuickMeazure',
  ogDescription: 'Learn how QuickMeazure protects your privacy and handles your data.',
  robots: 'index, follow',
})

// Dynamic OG Image
defineOgImageComponent('NuxtSeo', {
  title: 'Privacy Policy',
  description: 'QuickMeazure',
})
</script>
