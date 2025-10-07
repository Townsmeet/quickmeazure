<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <PageHeader
      title="Add New Style"
      :primary-action="{
        label: 'Save Style',
        onClick: saveStyle,
        disabled: !isFormValid,
      }"
    />

    <UCard class="bg-white">
      <form class="space-y-6" @submit.prevent="saveStyle">
        <!-- Style Information -->
        <div>
          <h2 class="text-lg font-medium mb-4">Style Information</h2>
          <div class="grid grid-cols-1 gap-6">
            <UFormField label="Style Name" name="name" required>
              <UInput
                v-model="style.name"
                placeholder="Enter style name"
                size="lg"
                class="w-full"
                required
              />
            </UFormField>

            <UFormField label="Description" name="description">
              <UTextarea
                v-model="style.description"
                placeholder="Describe the style"
                size="lg"
                class="w-full"
                :rows="4"
              />
            </UFormField>

            <UFormField label="Image" name="image" required>
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
                    ref="fileInput"
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="handleImageUpload"
                  />

                  <p class="text-sm text-gray-500 mt-2">Recommended: JPG, PNG or GIF. Max 5MB.</p>
                </div>
              </div>
            </UFormField>
          </div>
        </div>

        <!-- No action buttons here as we moved the save button to the top -->
      </form>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

// Composables and API
const routes = useAppRoutes()
const router = useRouter()
const { createStyle } = useStyles()
const { user } = useAuth()
const toast = useToast()
const STYLES_PATH = routes.ROUTE_PATHS[routes.ROUTE_NAMES.DASHBOARD.STYLES.INDEX] as string

useHead({
  title: 'Add New Style',
})

// Style data
interface StyleFormData {
  name: string
  description: string
  imageFile: File | null
}

const style = ref<StyleFormData>({
  name: '',
  description: '',
  imageFile: null,
})

// UI state
const isSaving = ref(false)
const imagePreview = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

// Computed property to check if form is valid
const isFormValid = computed(() => {
  return !!style.value.name && !!style.value.imageFile
})

// Trigger file input click
const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click()
  } else {
    console.error('File input element not found')
    toast.add({
      title: 'Error',
      description: 'Failed to access file input',
      color: 'error',
    })
  }
}

// Handle image upload
const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    toast.add({
      title: 'File too large',
      description: 'Maximum file size is 5MB',
      color: 'error',
    })
    return
  }

  // Check file type
  if (!file.type.startsWith('image/')) {
    toast.add({
      title: 'Invalid file type',
      description: 'Please upload an image file',
      color: 'error',
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
  reader.onerror = () => {
    console.error('Error reading file')
    toast.add({
      title: 'Error',
      description: 'Failed to read the image file',
      color: 'error',
    })
  }
  reader.readAsDataURL(file)
}

// Save style
const saveStyle = async () => {
  // Validate form inputs
  if (!style.value.name) {
    toast.add({
      title: 'Validation Error',
      description: 'Style name is required',
      color: 'error',
    })
    return
  }

  if (!style.value.imageFile) {
    toast.add({
      title: 'Validation Error',
      description: 'Image is required',
      color: 'error',
    })
    return
  }

  isSaving.value = true

  try {
    // Create form data
    const formData = new FormData()
    formData.append('name', style.value.name)

    if (style.value.description) {
      formData.append('description', style.value.description)
    }

    // Add the image file
    formData.append('image', style.value.imageFile)

    // Create the style using direct fetch
    const newStyle = await $fetch('/api/styles', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (newStyle) {
      // Style is automatically updated by the composable

      // Show success notification
      toast.add({
        title: 'Style Created',
        description: 'Your style has been created successfully',
        color: 'primary',
      })

      // Redirect to the new style's detail page
      await router.push(`${STYLES_PATH}/${newStyle.id}/detail`)
    }
  } catch (error: any) {
    console.error('Error creating style:', error)

    let errorMessage = 'Failed to create style. Please try again.'

    if (error.response) {
      const status = error.response.status
      if (status === 413) {
        errorMessage = 'The image file is too large. Maximum size is 5MB.'
      } else if (status === 415) {
        errorMessage = 'The file format is not supported. Please use JPG, PNG, or GIF.'
      } else if (error.data?.message) {
        errorMessage = error.data.message
      }
    } else if (error.message) {
      errorMessage = error.message
    }

    toast.add({
      title: 'Error',
      description: errorMessage,
      color: 'error',
    })
  } finally {
    isSaving.value = false
  }
}

// No cleanup needed with composables
</script>
