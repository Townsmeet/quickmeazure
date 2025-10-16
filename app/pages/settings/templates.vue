<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <PageHeader
      title="Measurement Templates"
      :primary-action="{
        label: 'New Template',
        icon: 'i-heroicons-plus',
        onClick: openCreateDialog,
      }"
    />

    <div v-if="templates.length === 0" class="text-center py-12">
      <UIcon name="i-heroicons-document-text" class="w-12 h-12 text-gray-300 mx-auto" />
      <h3 class="mt-2 text-lg font-medium text-gray-900">No templates yet</h3>
      <p class="mt-1 text-gray-500">Get started by creating your first measurement template.</p>
      <UButton color="primary" class="mt-4" @click="openCreateDialog"> Create Template </UButton>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <TemplateCard
        v-for="template in templates"
        :key="template.id"
        :template="template"
        @edit="openEditDialog"
        @delete="confirmDelete"
      />
    </div>

    <!-- Create/Edit Dialog -->
    <UModal v-model:open="showDialog">
      <template #content>
        <TemplateDialog :template="editingTemplate" @submit="handleSubmit" />
      </template>
    </UModal>

    <!-- Delete Confirmation -->
    <UModal v-model:open="showDeleteConfirm">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Delete Template</h3>
          </template>

          <p class="text-gray-600">
            Are you sure you want to delete this template? This action cannot be undone.
          </p>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton color="neutral" variant="outline" @click="showDeleteConfirm = false">
                Cancel
              </UButton>
              <UButton color="error" :loading="isDeleting" @click="deleteTemplate">
                Delete
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { MeasurementTemplate } from '~/types/measurement'

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard',
})

// State
const showDialog = ref(false)
const showDeleteConfirm = ref(false)
const isDeleting = ref(false)
const isLoading = ref(true)
const editingTemplate = ref<MeasurementTemplate | null>(null)
const templateToDelete = ref<string | null>(null)
const templates = ref<MeasurementTemplate[]>([])

// Methods
const openCreateDialog = () => {
  editingTemplate.value = null
  showDialog.value = true
}

const openEditDialog = (template: MeasurementTemplate) => {
  editingTemplate.value = { ...template }
  showDialog.value = true
}

const confirmDelete = (id: string) => {
  templateToDelete.value = id
  showDeleteConfirm.value = true
}

const deleteTemplate = async () => {
  if (!templateToDelete.value) return

  try {
    isDeleting.value = true
    // TODO: Implement actual API call
    // await $fetch(`/api/templates/${templateToDelete.value}`, { method: 'DELETE' })
    templates.value = templates.value.filter(t => t.id !== templateToDelete.value)
    showDeleteConfirm.value = false
  } catch (error) {
    console.error('Failed to delete template:', error)
  } finally {
    isDeleting.value = false
  }
}

const handleSubmit = async (
  templateData: Omit<MeasurementTemplate, 'id' | 'createdAt' | 'updatedAt'>
) => {
  try {
    if (editingTemplate.value) {
      // Update existing template
      // const updated = await $fetch(`/api/measurement-templates/${editingTemplate.value.id}`, {
      //   method: 'PUT',
      //   body: templateData
      // })
      const updated = {
        ...templateData,
        id: editingTemplate.value.id,
        updatedAt: new Date().toISOString(),
      } as MeasurementTemplate

      const index = templates.value.findIndex(t => t.id === editingTemplate.value?.id)
      if (index !== -1) {
        templates.value[index] = updated
      }
    } else {
      // Create new template
      // const newTemplate = await $fetch('/api/templates', {
      //   method: 'POST',
      //   body: templateData
      // })
      const newTemplate = {
        ...templateData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        isDefault: false,
        userId: 'current-user-id',
      } as MeasurementTemplate
      templates.value.unshift(newTemplate)
    }

    showDialog.value = false
  } catch (error) {
    console.error('Failed to save template:', error)
  }
}

// Fetch templates on component mount
onMounted(async () => {
  try {
    // TODO: Replace with actual API call
    // templates.value = await $fetch('/api/templates')

    // Mock data for development
    templates.value = [
      {
        id: 1,
        name: "Men's Shirt",
        description: "Standard measurements for men's dress shirts",
        category: 'Shirts',
        unit: 'cm',
        fields: [
          { id: '1', name: 'Chest', category: 'upper', type: 'number', required: true, order: 1 },
          { id: '2', name: 'Neck', category: 'upper', type: 'number', required: true, order: 2 },
          {
            id: '3',
            name: 'Sleeve Length',
            category: 'upper',
            type: 'number',
            required: true,
            order: 3,
          },
        ],
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        isActive: true,
        isDefault: true,
        userId: 1,
      },
      {
        id: 2,
        name: "Women's Dress",
        description: "Standard measurements for women's dresses",
        category: 'Dresses',
        unit: 'cm',
        fields: [
          { id: '4', name: 'Bust', category: 'upper', type: 'number', required: true, order: 1 },
          { id: '5', name: 'Waist', category: 'lower', type: 'number', required: true, order: 2 },
          { id: '6', name: 'Hips', category: 'lower', type: 'number', required: true, order: 3 },
          { id: '7', name: 'Length', category: 'lower', type: 'number', required: false, order: 4 },
        ],
        createdAt: '2023-01-02T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z',
        isActive: true,
        isDefault: false,
        userId: 1,
      },
    ]
  } catch (error) {
    console.error('Failed to fetch templates:', error)
  } finally {
    isLoading.value = false
  }
})
</script>
