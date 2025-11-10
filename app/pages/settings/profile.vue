<template>
  <div class="space-y-6">
    <PageHeader title="Business Profile" description="This is your public tailor shop profile." />
    <SettingsProfileForm />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'setup-required'],
  layout: 'dashboard',
})
</script>
