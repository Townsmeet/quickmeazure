<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold">Measurement Templates</h2>
      <UButton icon="i-heroicons-plus" color="primary" @click="isCreateModalOpen = true">
        New Template
      </UButton>
    </div>

    <!-- Tabs -->
    <UTabs v-model="activeTab" :items="tabs">
      <template #default="{ item }">
        <span class="flex items-center gap-2">
          <UIcon :name="item.icon" class="h-4 w-4" />
          {{ item.label }}
        </span>
      </template>

      <template #item="{ item }">
        <div v-if="item.key === 'active'" class="space-y-4">
          <!-- Default Templates -->
          <div v-if="defaultTemplates.length > 0">
            <h3 class="text-lg font-medium mb-3">Default Templates</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <MeasurementTemplateCard
                v-for="template in defaultTemplates"
                :key="template.id"
                :template="template"
                @edit="openEditModal(template)"
                @archive="handleArchive(template.id, false)"
              />
            </div>
          </div>

          <!-- Custom Templates -->
          <div v-if="customTemplates.length > 0">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-lg font-medium">Custom Templates</h3>
              <span class="text-sm text-gray-500">{{ customTemplates.length }} templates</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <MeasurementTemplateCard
                v-for="template in customTemplates"
                :key="template.id"
                :template="template"
                @edit="openEditModal(template)"
                @archive="handleArchive(template.id, false)"
                @delete="handleDelete(template.id)"
              />
            </div>
          </div>

          <UPagination
            v-if="customTemplates.length > 0"
            v-model="page"
            :page-count="pageCount"
            :total="totalTemplates"
            class="mt-6"
          />

          <UCard v-else class="text-center py-12">
            <UIcon name="i-heroicons-document-text" class="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 class="text-lg font-medium text-gray-900 mb-1">No templates yet</h3>
            <p class="text-gray-500 mb-4">Create your first measurement template to get started</p>
            <UButton icon="i-heroicons-plus" color="primary" @click="isCreateModalOpen = true">
              New Template
            </UButton>
          </UCard>
        </div>

        <div v-else-if="item.key === 'archived'" class="space-y-4">
          <div
            v-if="archivedTemplates.length > 0"
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <MeasurementTemplateCard
              v-for="template in archivedTemplates"
              :key="template.id"
              :template="template"
              @edit="openEditModal(template)"
              @unarchive="handleArchive(template.id, true)"
              @delete="handleDelete(template.id)"
            />
          </div>
          <UCard v-else class="text-center py-12">
            <UIcon name="i-heroicons-archive-box" class="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 class="text-lg font-medium text-gray-900 mb-1">No archived templates</h3>
            <p class="text-gray-500">You don't have any archived templates</p>
          </UCard>
        </div>
      </template>
    </UTabs>

    <!-- Create/Edit Modal -->
    <MeasurementTemplateForm
      v-model:is-open="isFormModalOpen"
      :template="editingTemplate"
      @saved="handleTemplateSaved"
    />

    <!-- Delete Confirmation -->
    <UModal v-model="isDeleteModalOpen">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Delete Template</h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="isDeleteModalOpen = false"
            />
          </div>
        </template>

        <p class="mb-6">
          Are you sure you want to delete this template? This action cannot be undone.
        </p>

        <div class="flex justify-end gap-3">
          <UButton color="gray" variant="ghost" @click="isDeleteModalOpen = false">
            Cancel
          </UButton>
          <UButton color="red" :loading="isDeleting" @click="confirmDelete">
            Delete Template
          </UButton>
        </div>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMeasurementTemplatesStore } from '~/store'

const props = defineProps({
  initialTemplates: {
    type: Array as () => MeasurementTemplate[],
    default: () => [],
  },
})

const emit = defineEmits(['refresh'])

const {
  templates,
  _loading,
  _error,
  fetchTemplates,
  archiveTemplate,
  unarchiveTemplate,
  deleteTemplate,
} = useMeasurementTemplatesStore()

// Tabs
const activeTab = ref('active')
const tabs = [
  { key: 'active', label: 'Active', icon: 'i-heroicons-document-text' },
  { key: 'archived', label: 'Archived', icon: 'i-heroicons-archive-box' },
]

// Pagination
const page = ref(1)
const pageCount = 10

// Modals
const isFormModalOpen = ref(false)
const isCreateModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const isDeleting = ref(false)
const templateToDelete = ref<number | null>(null)

// Editing
const editingTemplate = ref<MeasurementTemplate | null>(null)

// Computed
const defaultTemplates = computed(() => templates.value.filter(t => t.isDefault && !t.isArchived))

const customTemplates = computed(() => {
  const start = (page.value - 1) * pageCount
  const end = start + pageCount
  return templates.value.filter(t => !t.isDefault && !t.isArchived).slice(start, end)
})

const archivedTemplates = computed(() => templates.value.filter(t => t.isArchived))

const totalTemplates = computed(
  () => templates.value.filter(t => !t.isDefault && !t.isArchived).length
)

// Methods
const openEditModal = (template: MeasurementTemplate) => {
  editingTemplate.value = template
  isFormModalOpen.value = true
}

const handleTemplateSaved = () => {
  isFormModalOpen.value = false
  editingTemplate.value = null
  fetchTemplates()
  emit('refresh')
}

const handleArchive = async (templateId: number, unarchive = false) => {
  try {
    if (unarchive) {
      await unarchiveTemplate(templateId)
    } else {
      await archiveTemplate(templateId)
    }
    await fetchTemplates(true) // Include archived
  } catch (err) {
    console.error('Error updating template archive status:', err)
  }
}

const handleDelete = (templateId: number) => {
  templateToDelete.value = templateId
  isDeleteModalOpen.value = true
}

const confirmDelete = async () => {
  if (!templateToDelete.value) return

  isDeleting.value = true

  try {
    await deleteTemplate(templateToDelete.value)
    await fetchTemplates(true) // Include archived
    isDeleteModalOpen.value = false
  } catch (err) {
    console.error('Error deleting template:', err)
  } finally {
    isDeleting.value = false
    templateToDelete.value = null
  }
}

// Lifecycle
onMounted(async () => {
  if (props.initialTemplates.length > 0) {
    templates.value = props.initialTemplates
  } else {
    await fetchTemplates()
  }
})

// Watch for create modal state
watch(isCreateModalOpen, val => {
  if (val) {
    editingTemplate.value = null
    isFormModalOpen.value = true
  }
})
</script>
