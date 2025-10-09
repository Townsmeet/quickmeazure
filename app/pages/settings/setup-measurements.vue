<template>
  <div class="container mx-auto p-4 md:p-6">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Measurement Templates</h1>
        <p class="text-gray-600 mt-1">
          Manage your measurement templates for different clothing types
        </p>
      </div>
      <UButton icon="i-heroicons-plus" color="primary" @click="openCreateDialog">
        New Template
      </UButton>
    </div>

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
    <TemplateDialog v-model="showDialog" :template="editingTemplate" @submit="handleSubmit" />

    <!-- Delete Confirmation -->
    <UModal v-model="showDeleteConfirm">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Delete Template</h3>
        </template>

        <p class="text-gray-600">
          Are you sure you want to delete this template? This action cannot be undone.
        </p>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="showDeleteConfirm = false">
              Cancel
            </UButton>
            <UButton color="red" :loading="isDeleting" @click="deleteTemplate"> Delete </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { MeasurementTemplate } from '~/types/measurement'

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
        fields: [
          { id: 1, name: 'Chest', unit: 'cm' },
          { id: 2, name: 'Neck', unit: 'cm' },
          { id: 3, name: 'Sleeve Length', unit: 'cm' },
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
        fields: [
          { id: 4, name: 'Bust', unit: 'cm' },
          { id: 5, name: 'Waist', unit: 'cm' },
          { id: 6, name: 'Hips', unit: 'cm' },
          { id: 7, name: 'Length', unit: 'cm' },
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
