<template>
  <div class="space-y-6">
    <PageHeader title="Billing & Subscription" />
    <SettingsBillingForm />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'setup-required'],
  layout: 'dashboard',
})
</script>
