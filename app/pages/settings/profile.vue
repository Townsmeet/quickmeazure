<template>
  <div class="space-y-6">
    <PageHeader title="Profile Settings" />
    <SettingsProfileForm />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'setup-required'],
  layout: 'dashboard',
})
</script>
