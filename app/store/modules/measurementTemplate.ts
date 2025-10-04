import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MeasurementTemplate } from '../../types/measurement'

export const useMeasurementTemplateStore = defineStore('measurementTemplate', () => {
  // State
  const templates = ref<MeasurementTemplate[]>([])
  const currentTemplate = ref<MeasurementTemplate | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const defaultTemplate = computed<MeasurementTemplate | undefined>(() =>
    templates.value.find(t => t.isDefault)
  )

  const templateNames = computed<string[]>(() => templates.value.map(t => t.name))

  // Actions (state mutations)
  const setTemplates = (newTemplates: MeasurementTemplate[]) => {
    templates.value = newTemplates
  }

  const addTemplate = (template: MeasurementTemplate) => {
    templates.value.push(template)
  }

  const updateTemplateInStore = (id: number, updates: Partial<MeasurementTemplate>) => {
    const index = templates.value.findIndex(t => t.id === id)
    if (index !== -1) {
      templates.value[index] = { ...templates.value[index], ...updates }
    }

    // Update current template if it's the one being edited
    if (currentTemplate.value?.id === id) {
      currentTemplate.value = { ...currentTemplate.value, ...updates }
    }
  }

  const removeTemplate = (id: number) => {
    templates.value = templates.value.filter(t => t.id !== id)

    // Clear current template if it's the one being removed
    if (currentTemplate.value?.id === id) {
      currentTemplate.value = null
    }
  }

  const setCurrentTemplate = (template: MeasurementTemplate | null) => {
    currentTemplate.value = template
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const setError = (err: string | null) => {
    error.value = err
  }

  const setDefaultTemplateInStore = (id: number) => {
    // Update all templates to set isDefault to false
    templates.value = templates.value.map(t => ({
      ...t,
      isDefault: t.id === id,
    }))
  }

  // Reset store state
  const $reset = () => {
    templates.value = []
    currentTemplate.value = null
    isLoading.value = false
    error.value = null
  }

  return {
    // State
    templates,
    currentTemplate,
    isLoading,
    error,

    // Getters
    defaultTemplate,
    templateNames,

    // Actions (state mutations)
    setTemplates,
    addTemplate,
    updateTemplateInStore,
    removeTemplate,
    setCurrentTemplate,
    setLoading,
    setError,
    setDefaultTemplateInStore,
    $reset,
  }
})
