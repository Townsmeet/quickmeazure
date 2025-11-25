<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <img src="/logo.png" alt="QuickMeazure Logo" class="h-8 w-auto md:hidden" />
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Templates</h1>
        </div>
        <div class="flex gap-3">
          <UButton color="primary" size="lg" @click="openCreateDialog"> New Template </UButton>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <TemplateCardSkeleton v-for="i in 6" :key="i" />
    </div>

    <!-- Templates List -->
    <div
      v-else-if="!isLoading && templates.length > 0"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <TemplateCard
        v-for="template in templates"
        :key="template.id"
        :template="template"
        @edit="openEditDialog"
        @delete="confirmDelete"
        @set-default="handleSetDefault"
        @archive="handleArchive"
        @unarchive="handleUnarchive"
      />
    </div>

    <!-- Empty State: no error, just empty -->
    <div
      v-else-if="!isLoading && !error && templates.length === 0"
      class="flex items-center justify-center min-h-[60vh]"
    >
      <div class="max-w-xl mx-auto text-center">
        <UEmpty
          icon="i-heroicons-document-text"
          title="No templates yet"
          description="Get started by creating your first measurement template."
          :actions="[
            {
              icon: 'i-heroicons-plus',
              label: 'Create Template',
              onClick: openCreateDialog,
            },
          ]"
        />
      </div>
    </div>

    <!-- Error State: actual errors only -->
    <div v-else-if="!isLoading && error" class="flex items-center justify-center min-h-[60vh]">
      <div class="max-w-xl mx-auto text-center">
        <UEmpty
          icon="i-heroicons-document-text"
          title="Unable to load templates"
          description="We encountered an error while loading your templates. Please try refreshing the page."
          :actions="[
            {
              icon: 'i-heroicons-arrow-path',
              label: 'Refresh',
              onClick: () => refreshTemplates(),
            },
          ]"
        />
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <TemplateDialog
      v-model:open="dialogOpen"
      :template="editingTemplate"
      @submit="handleTemplateSubmit"
    />

    <!-- Delete Confirmation Modal -->
    <TemplateDeleteDialog
      v-model:open="confirmDeleteOpen"
      :loading="isDeleting"
      @confirm="deleteTemplateHandler"
    />
  </div>
</template>

<script setup lang="ts">
import TemplateDialog from '~/components/measurements/TemplateDialog.vue'
import TemplateDeleteDialog from '~/components/measurements/TemplateDeleteDialog.vue'
import type { MeasurementTemplate, MeasurementField } from '~/types'
import { ref } from 'vue'

definePageMeta({ middleware: 'auth', layout: 'dashboard' })

// Composable for CRUD actions
const {
  templates,
  isLoading,
  error,
  createTemplate,
  updateTemplate,
  deleteTemplate: deleteTemplateApi,
  setDefaultTemplate,
  archiveTemplate,
  unarchiveTemplate,
  refreshTemplates,
} = useMeasurementTemplates()

// Toast notifications
const toast = useToast()

// State
const dialogOpen = ref(false)
const confirmDeleteOpen = ref(false)
const isDeleting = ref(false)
const editingTemplate = ref<MeasurementTemplate | null>(null)
const templateToDelete = ref<string | null>(null)

function openCreateDialog() {
  editingTemplate.value = null
  dialogOpen.value = true
}

function openEditDialog(template: MeasurementTemplate) {
  editingTemplate.value = {
    ...template,
    fields: template.fields.map(field => ({ ...field })),
  } as MeasurementTemplate
  dialogOpen.value = true
}

async function handleTemplateSubmit(templateData: {
  name: string
  unit: string
  description?: string
  gender: string
  fields: MeasurementField[]
}) {
  console.log('Submitting template data:', templateData)
  await processTemplateSubmit({
    ...templateData,
    fields: templateData.fields.map((field, idx) => ({
      name: field.name,
      isRequired: field.isRequired,
      displayOrder: idx,
      category: field.category || 'upper',
    })),
  })
}

function confirmDelete(id: string) {
  templateToDelete.value = id
  confirmDeleteOpen.value = true
}

async function deleteTemplateHandler() {
  if (!templateToDelete.value) return
  try {
    isDeleting.value = true
    const success = await deleteTemplateApi(Number(templateToDelete.value))
    if (success) {
      confirmDeleteOpen.value = false
      templateToDelete.value = null
      await refreshTemplates()
      toast.add({
        title: 'Template deleted',
        description: 'Template has been successfully deleted.',
        color: 'success',
      })
    } else {
      toast.add({
        title: 'Delete failed',
        description: 'Failed to delete template. Please try again.',
        color: 'error',
      })
    }
  } catch (_e) {
    toast.add({
      title: 'Delete failed',
      description: 'An error occurred while deleting the template.',
      color: 'error',
    })
  } finally {
    isDeleting.value = false
  }
}

async function handleSetDefault(id: number) {
  try {
    const success = await setDefaultTemplate(id)
    if (success) {
      await refreshTemplates()
      toast.add({
        title: 'Default template set',
        description: 'Template has been set as your default template.',
        color: 'success',
      })
    } else {
      toast.add({
        title: 'Failed to set default',
        description: 'Could not set template as default. Please try again.',
        color: 'error',
      })
    }
  } catch (e) {
    console.error('Failed to set default template:', e)
    toast.add({
      title: 'Error setting default',
      description: 'An error occurred while setting the default template.',
      color: 'error',
    })
  }
}

async function handleArchive(id: number) {
  try {
    const success = await archiveTemplate(id)
    if (success) {
      await refreshTemplates()
      toast.add({
        title: 'Template archived',
        description: 'Template has been successfully archived.',
        color: 'success',
      })
    } else {
      toast.add({
        title: 'Archive failed',
        description: 'Could not archive template. Please try again.',
        color: 'error',
      })
    }
  } catch (e) {
    console.error('Failed to archive template:', e)
    toast.add({
      title: 'Error archiving template',
      description: 'An error occurred while archiving the template.',
      color: 'error',
    })
  }
}

async function handleUnarchive(id: number) {
  try {
    const success = await unarchiveTemplate(id)
    if (success) {
      await refreshTemplates()
      toast.add({
        title: 'Template unarchived',
        description: 'Template has been successfully unarchived.',
        color: 'success',
      })
    } else {
      toast.add({
        title: 'Unarchive failed',
        description: 'Could not unarchive template. Please try again.',
        color: 'error',
      })
    }
  } catch (e) {
    console.error('Failed to unarchive template:', e)
    toast.add({
      title: 'Error unarchiving template',
      description: 'An error occurred while unarchiving the template.',
      color: 'error',
    })
  }
}

interface CreateFieldData {
  name: string
  isRequired: boolean
  displayOrder: number
  category: string
}

async function processTemplateSubmit(templateData: {
  name: string
  unit: string
  description?: string
  gender: string
  fields: CreateFieldData[]
}) {
  try {
    if (editingTemplate.value) {
      const response = await updateTemplate(Number(editingTemplate.value.id), {
        name: templateData.name,
        unit: templateData.unit,
        gender: templateData.gender as 'male' | 'female' | 'unisex',
        fields: templateData.fields,
        description: templateData.description,
      })
      if (response.success) {
        dialogOpen.value = false
        editingTemplate.value = null
        await refreshTemplates()
        toast.add({
          title: 'Template updated',
          description: 'Template has been successfully updated.',
          color: 'success',
        })
      } else {
        toast.add({
          title: 'Update failed',
          description: response.message || 'Failed to update template. Please try again.',
          color: 'error',
        })
      }
    } else {
      const response = await createTemplate({
        name: templateData.name,
        unit: templateData.unit,
        gender: templateData.gender as 'male' | 'female' | 'unisex',
        description: templateData.description,
        fields: templateData.fields,
      })
      if (response.success) {
        dialogOpen.value = false
        editingTemplate.value = null
        await refreshTemplates()

        // If this was the first template, refresh user session to update hasCompletedSetup
        const setupCompleted = (response as any).setupCompleted || false
        if (setupCompleted) {
          const { init } = useAuth()
          await init(true)
        }

        toast.add({
          title: 'Template created',
          description: 'Template has been successfully created.',
          color: 'success',
        })
      } else {
        toast.add({
          title: 'Creation failed',
          description: response.message || 'Failed to create template. Please try again.',
          color: 'error',
        })
      }
    }
  } catch (e) {
    console.error('Template submit error:', e)
    toast.add({
      title: 'Error saving template',
      description: 'An error occurred while saving the template.',
      color: 'error',
    })
  }
}
</script>
