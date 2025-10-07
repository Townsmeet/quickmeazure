<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">Measurement Templates</h2>
        <p class="mt-1 text-sm text-gray-500">
          Manage your measurement templates for different garment types.
        </p>
      </div>
      <UButton color="primary" icon="i-heroicons-plus" @click="isCreateTemplateModalOpen = true">
        New Template
      </UButton>
    </div>

    <!-- Templates List -->
    <UTabs v-model="activeTemplateTab" :items="templateTabs">
      <template #default="{ item, selected }">
        <div class="flex items-center gap-x-2">
          <span class="truncate">{{ item.label }}</span>
          <span
            v-if="item.count !== undefined"
            class="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium"
            :class="selected ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-800'"
          >
            {{ item.count }}
          </span>
        </div>
      </template>

      <template #_item>
        <div
          v-if="filteredTemplates.length > 0"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4"
        >
          <MeasurementTemplateCard
            v-for="template in filteredTemplates"
            :key="template.id"
            :template="template"
            @edit="openEditTemplate"
            @archive="handleArchiveTemplate"
            @unarchive="handleUnarchiveTemplate"
            @delete="confirmDeleteTemplate"
          />
        </div>

        <div v-else class="text-center py-12">
          <UIcon name="i-heroicons-ruler" class="mx-auto h-12 w-12 text-gray-300" />
          <h3 class="mt-2 text-sm font-medium text-gray-900">No templates</h3>
          <p class="mt-1 text-sm text-gray-500">
            {{
              activeTemplateTab === 'archived'
                ? 'No archived templates'
                : 'Get started by creating a new template'
            }}
          </p>
          <div v-if="activeTemplateTab !== 'archived'" class="mt-6">
            <UButton @click="isCreateTemplateModalOpen = true">
              <UIcon name="i-heroicons-plus" class="h-5 w-5 mr-2" />
              New Template
            </UButton>
          </div>
        </div>
      </template>
    </UTabs>

    <!-- Create/Edit Template Modal -->
    <UModal v-model="isTemplateModalOpen">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              {{ editingTemplate ? 'Edit Template' : 'New Measurement Template' }}
            </h3>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="closeTemplateModal"
            />
          </div>
        </template>

        <MeasurementTemplateForm
          v-if="isTemplateModalOpen"
          :template="editingTemplate"
          @saved="handleTemplateSaved"
          @cancel="closeTemplateModal"
        />
      </UCard>
    </UModal>

    <!-- Delete Confirmation Dialog -->
    <UModal v-model="isDeleteConfirmOpen">
      <UCard :ui="{ ring: 'ring-1 ring-red-100', divide: 'divide-y divide-red-100' }">
        <template #header>
          <div class="flex items-center">
            <UIcon name="i-heroicons-exclamation-triangle" class="mr-2 text-red-500 h-6 w-6" />
            <h3 class="text-lg font-semibold text-red-600">Delete Template</h3>
          </div>
        </template>

        <div class="py-4">
          <p class="text-gray-700 mb-3">
            Are you sure you want to delete the template "{{ templateToDelete?.name }}"?
          </p>
          <UAlert
            icon="i-heroicons-exclamation-triangle"
            color="error"
            variant="soft"
            title="This action cannot be undone"
            class="mt-2"
          >
            Deleting this template will remove it permanently.
          </UAlert>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="neutral" variant="ghost" @click="isDeleteConfirmOpen = false">
              Cancel
            </UButton>
            <UButton
              color="error"
              icon="i-heroicons-trash"
              :loading="isDeleting"
              @click="handleDeleteTemplate"
            >
              Delete Template
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { useToast } from '#imports'
import type { MeasurementTemplate } from '~/types/measurement'

// Components
import MeasurementTemplateCard from './MeasurementTemplateCard.vue'
import MeasurementTemplateForm from './MeasurementTemplateForm.vue'

// Template state
const {
  templates,
  isLoading,
  error,
  fetchTemplates: fetchTemplatesFromAPI,
  deleteTemplate,
  setDefaultTemplate,
  archiveTemplate,
  unarchiveTemplate,
} = useMeasurementTemplates()
const toast = useToast()

// Fetch templates on mount
const loadTemplates = async () => {
  await fetchTemplatesFromAPI()
}

// Initial fetch
onMounted(loadTemplates)

// UI state
const activeTemplateTab = ref('active')
const isCreateTemplateModalOpen = ref(false)
const isTemplateModalOpen = computed({
  get: () => isCreateTemplateModalOpen.value || !!editingTemplate.value,
  set: value => {
    isCreateTemplateModalOpen.value = value
    if (!value) editingTemplate.value = null
  },
})
const editingTemplate = ref<MeasurementTemplate | null>(null)
const isDeleting = ref(false)
const isDeleteConfirmOpen = ref(false)
const templateToDelete = ref<MeasurementTemplate | null>(null)

// Computed
const templateTabs = computed(() => [
  {
    key: 'active',
    label: 'Active',
    count: templates.value.filter(t => !t.archived).length,
  },
  {
    key: 'archived',
    label: 'Archived',
    count: templates.value.filter(t => t.archived).length,
  },
])

const filteredTemplates = computed(() => {
  return templates.value.filter(template => {
    if (activeTemplateTab.value === 'active') return !template.archived
    if (activeTemplateTab.value === 'archived') return template.archived
    return true
  })
})

// Methods
const openEditTemplate = (template: MeasurementTemplate) => {
  editingTemplate.value = { ...template }
  isTemplateModalOpen.value = true
}

const closeTemplateModal = () => {
  isTemplateModalOpen.value = false
  editingTemplate.value = null
}

const handleTemplateSaved = async () => {
  closeTemplateModal()
  await loadTemplates()
}

const handleArchiveTemplate = async (id: number) => {
  const success = await archiveTemplate(id)

  if (success) {
    toast.add({
      title: 'Template archived',
      description: 'The template has been moved to the archive',
      icon: 'i-heroicons-check-circle',
      color: 'primary',
    })
  } else {
    toast.add({
      title: 'Error archiving template',
      description: 'Please try again',
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle',
    })
  }
}

const handleUnarchiveTemplate = async (id: number) => {
  const success = await unarchiveTemplate(id)

  if (success) {
    toast.add({
      title: 'Template restored',
      description: 'The template has been restored to active templates',
      icon: 'i-heroicons-check-circle',
      color: 'primary',
    })
  } else {
    toast.add({
      title: 'Error restoring template',
      description: 'Please try again',
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle',
    })
  }
}

const confirmDeleteTemplate = (template: MeasurementTemplate) => {
  templateToDelete.value = template
  isDeleteConfirmOpen.value = true
}

const handleDeleteTemplate = async () => {
  if (!templateToDelete.value) return

  isDeleting.value = true

  const success = await deleteTemplate(templateToDelete.value.id)

  if (success) {
    toast.add({
      title: 'Template deleted',
      description: 'The template has been permanently removed',
      icon: 'i-heroicons-check-circle',
      color: 'primary',
    })

    isDeleteConfirmOpen.value = false
    templateToDelete.value = null
  } else {
    toast.add({
      title: 'Error deleting template',
      description: 'Please try again',
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle',
    })
  }

  isDeleting.value = false
}

// Watch for changes in the active tab to refresh data
watch(activeTemplateTab, loadTemplates)
</script>
