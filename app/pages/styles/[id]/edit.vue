<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <PageHeader
      title="Edit Style"
      :primary-action="{
        label: 'Save Changes',
        onClick: updateStyle,
        disabled: isLoading || !!error,
      }"
    />

    <!-- Loading state -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400" />
    </div>

    <!-- Error state -->
    <UAlert v-else-if="error" color="red" icon="i-heroicons-exclamation-triangle">
      <p>{{ error }}</p>
      <UButton
color="red"
variant="link"
to="/styles"
class="mt-2"> Return to Styles </UButton>
    </UAlert>

    <UCard v-else class="bg-white">
      <form class="space-y-6" @submit.prevent="updateStyle">
        <!-- Style Information -->
        <div>
          <h2 class="text-lg font-medium mb-4">Style Information</h2>
          <div class="grid grid-cols-1 gap-6">
            <div class="space-y-2">
              <label
for="styleName"
class="block text-sm font-medium text-gray-700"
                >Style Name <span class="text-red-500">*</span></label
              >
              <UInput
                id="styleName"
                v-model="style.name"
                placeholder="Enter style name"
                size="lg"
                class="w-full"
                required
              />
            </div>

            <div class="space-y-2">
              <label
for="styleDescription"
class="block text-sm font-medium text-gray-700"
                >Description</label
              >
              <UTextarea
                id="styleDescription"
                v-model="style.description"
                placeholder="Describe the style"
                size="lg"
                class="w-full"
                :rows="4"
              />
            </div>

            <div class="space-y-2">
              <label
for="styleImage"
class="block text-sm font-medium text-gray-700"
                >Image <span class="text-red-500">*</span></label
              >
              <div class="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div v-if="imagePreview" class="mb-4">
                  <img :src="imagePreview" alt="Preview" class="max-h-64 mx-auto rounded" />
                </div>

                <div class="text-center">
                  <UButton
type="button"
color="gray"
variant="outline"
@click="triggerFileInput">
                    <template #leading>
                      <UIcon name="i-heroicons-photo" />
                    </template>
                    {{ imagePreview ? 'Change Image' : 'Upload Image' }}
                  </UButton>

                  <input
                    id="styleImage"
                    ref="fileInput"
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="handleImageUpload"
                  />

                  <p class="text-sm text-gray-500 mt-2">Recommended: JPG, PNG or GIF. Max 5MB.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end space-x-4">
          <UButton
            type="button"
            color="neutral"
            variant="outline"
            :to="`/styles/${$route.params.id}/detail`"
          >
            Cancel
          </UButton>

          <UButton
type="submit"
color="primary"
:loading="isSaving"
:disabled="!isFormValid">
            Update Style
          </UButton>
        </div>
      </form>
    </UCard>
  </div>
</template>

<script setup lang="ts">
// Vue and Nuxt imports
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHead, useToast } from '#imports'

// Composable
import { useAppRoutes } from '~/composables/useRoutes'

// Stores
import { useAuthStore } from '~/store/modules/auth'
import { useStyleStore } from '~/store/modules/style'

// Types
import type { Style } from '~/types/style'

// Composable
const routes = useAppRoutes()

// Constants
const _getStyleDetailPath = (id: string): string =>
  (
    routes.ROUTE_PATHS[routes.ROUTE_NAMES.DASHBOARD.STYLES.VIEW] as (params: {
      id: string
    }) => string
  )({ id })

// Set page metadata
useHead({
  title: 'Edit Style - QuickMeazure',
})

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Style form data interface
interface StyleFormData {
  id?: string
  name: string
  description: string | null
  imageUrl: string | null
  imageFile: File | null
}

// Style data
const style = ref<StyleFormData>({
  name: '',
  description: null,
  imageUrl: null,
  imageFile: null,
})

// UI state
const isLoading = ref(true)
const isSaving = ref(false)
const error = ref<string | null>(null)
const imagePreview = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

// Computed property to check if form is valid
const isFormValid = computed(() => {
  return !!style.value.name
})

// Stores and composables
const authStore = useAuthStore()
const styleStore = useStyleStore()
const styleApi = useStyleApi()

// Fetch style data
const fetchStyleData = async () => {
  const styleId = route.params.id as string
  if (!styleId) {
    error.value = 'Style ID is required'
    return
  }

  try {
    isLoading.value = true
    error.value = null

    // Check if user is authenticated
    if (!authStore.isLoggedIn) {
      error.value = 'Authentication required. Please log in.'
      navigateTo('/auth/login')
      return
    }

    // Fetch style data using the API
    const response = await styleApi.getStyleById(styleId)

    if (response.success && response.data) {
      style.value = {
        ...response.data,
        imageFile: null,
      }

      // Set image preview if available
      if (style.value.imageUrl) {
        imagePreview.value = style.value.imageUrl
      }

      // Update the style in the store for consistency
      styleStore.currentStyle = response.data
    } else {
      error.value = response.error || 'Style not found'
      toast.add({
        title: 'Error',
        description: error.value,
        color: 'error',
      })
    }
  } catch (err: any) {
    console.error('Error loading style details:', err)
    error.value = 'Failed to load style details. Please try again.'
    toast.add({
      title: 'Error',
      description: error.value,
      color: 'error',
    })
  } finally {
    isLoading.value = false
  }
}

// Initial data fetch
onMounted(fetchStyleData)

// Refresh data when route changes
watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      fetchStyleData()
    }
  }
)

// Trigger file input click
const triggerFileInput = () => {
  fileInput.value?.click()
}

// Handle image upload
const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    toast.add({
      title: 'File Too Large',
      description: 'File is too large. Maximum size is 5MB.',
      color: 'red',
    })
    return
  }

  style.value.imageFile = file

  // Create preview
  const reader = new FileReader()
  reader.onload = (e: ProgressEvent<FileReader>) => {
    if (e.target?.result) {
      imagePreview.value = e.target.result as string
    }
  }
  reader.readAsDataURL(file)
}

// Update style
const updateStyle = async () => {
  if (!style.value?.name) {
    toast.add({
      title: 'Validation Error',
      description: 'Style name is required',
      color: 'red',
    })
    return
  }

  if (!style.value.id) {
    toast.add({
      title: 'Error',
      description: 'Invalid style ID',
      color: 'red',
    })
    return
  }

  isSaving.value = true

  try {
    const styleData: Partial<Style> & { imageFile?: File } = {
      name: style.value.name,
      description: style.value.description,
    }

    if (style.value.imageFile) {
      styleData.imageFile = style.value.imageFile
    }

    // Update the style using the API
    const response = await styleApi.updateStyle(style.value.id, styleData)

    if (response.success && response.data) {
      // Update the style in the store for consistency
      styleStore.currentStyle = response.data

      // Show success notification
      toast.add({
        title: 'Style Updated',
        description: 'Your style has been updated successfully',
        color: 'green',
      })

      // Navigate to the style detail page
      router.push(`/styles/${style.value.id}/detail`)
    } else {
      throw new Error(response.error || 'Failed to update style')
    }
  } catch (err: any) {
    console.error('Error updating style:', err)

    const errorMessage = err.message || 'Failed to update style. Please try again.'
    toast.add({
      title: 'Error',
      description: errorMessage,
      color: 'error',
    })
  } finally {
    isSaving.value = false
  }
}
</script>
