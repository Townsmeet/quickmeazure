<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <PageHeader title="Settings" />

    <!-- Settings Tabs -->
    <UTabs :items="tabs" variant="link" class="w-full">
      <template #default="{ item }">
        <div class="flex items-center gap-x-2">
          <UIcon :name="item._icon" class="h-5 w-5" />
          <span>{{ item.label }}</span>
        </div>
      </template>

      <!-- Profile Tab -->
      <template #profile>
        <div class="py-6">
          <SettingsProfileForm />
        </div>
      </template>

      <!-- Security Tab -->
      <template #security>
        <div class="py-6">
          <SettingsSecurityForm />
        </div>
      </template>

      <!-- Measurements Tab -->
      <template #measurements>
        <div class="py-6">
          <UTabs :items="measurementsTabs" class="w-full">
            <template #units>
              <div class="py-6">
                <MeasurementSettings @saved="handleSettingsSaved" />
              </div>
            </template>
            <template #templates>
              <div class="py-6">
                <MeasurementTemplatesManager />
              </div>
            </template>
          </UTabs>
        </div>
      </template>

      <!-- Billing Tab -->
      <template #billing>
        <div class="py-6 space-y-6">
          <SettingsBillingForm />
        </div>
      </template>
    </UTabs>
  </div>
</template>

<script setup lang="ts">
import { useAppRoutes } from '~/composables/useRoutes'
import SettingsBillingForm from '~/components/settings/SettingsBillingForm.vue'

// Composable
const routes = useAppRoutes()

// Constants
const _DASHBOARD_PATH = routes.ROUTE_PATHS[routes.ROUTE_NAMES.DASHBOARD.INDEX] as string // Prefix with underscore to indicate it's intentionally unused

definePageMeta({
  middleware: ['auth'],
})

// Main tabs
const tabs = [
  {
    label: 'Profile',
    slot: 'profile',
    _icon: 'i-heroicons-user-circle', // Used in custom template
  },
  {
    label: 'Security',
    slot: 'security',
    _icon: 'i-heroicons-shield-check', // Used in custom template
  },
  {
    label: 'Measurements',
    slot: 'measurements',
    _icon: 'i-heroicons-square-3-stack-3d', // Used in custom template
  },
  {
    label: 'Billing',
    slot: 'billing',
    _icon: 'i-heroicons-credit-card', // Used in custom template
  },
]

// Measurements subtabs
const measurementsTabs = [
  { label: 'Units', slot: 'units' },
  { label: 'Templates', slot: 'templates' },
]

// Handle settings saved
const handleSettingsSaved = () => {
  // Use the Nuxt UI toast system for notifications
  useToast().add({
    title: 'Settings saved',
    description: 'Your settings have been updated successfully',
    icon: 'i-heroicons-check-circle',
    color: 'green',
  })
}
</script>
