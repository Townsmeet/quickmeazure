<template>
  <USlideover
    :open="isOpen"
    title="Add Style"
    side="right"
    @update:open="value => !value && handleClose()"
  >
    <template #body>
      <div class="space-y-6 min-h-0">
        <UFormField label="Upload Images" name="images" required>
          <UFileUpload
            v-model="selectedImageFiles"
            multiple
            accept="image/*"
            color="neutral"
            highlight
            label="Drop your images here (multiple images allowed)"
            description="SVG, PNG, JPG or GIF (max. 2MB each)"
            class="w-full min-h-48"
            @update:model-value="handleImageUpload"
          />
        </UFormField>

        <UFormField label="Style Name" name="name" required>
          <UInput v-model="formData.name" placeholder="Enter style name" class="w-full" />
        </UFormField>

        <UFormField label="Description" name="description">
          <UTextarea
            v-model="formData.description"
            placeholder="Enter style description (multiple images allowed)"
            :rows="3"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Tags" name="tags">
          <USelectMenu
            v-model="selectedTags"
            :items="tagOptions"
            multiple
            create-item
            placeholder="Select or create tags..."
            class="w-full"
            @create="handleCreateTag"
          />
          <div v-if="selectedTags.length > 0" class="flex flex-wrap gap-2 mt-2">
            <UBadge
v-for="tag in selectedTags"
:key="tag"
variant="soft"
color="primary"
size="sm">
              {{ tag }}
            </UBadge>
          </div>
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end space-x-3">
        <UButton
color="neutral"
variant="outline"
:disabled="isSubmitting"
@click="handleClose">
          Cancel
        </UButton>
        <UButton color="primary" :loading="isSubmitting" @click="handleSubmit"> Add Style </UButton>
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
interface Props {
  isOpen: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'success', style: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Form state
const formData = ref({
  name: '',
  description: '',
  notes: '',
})

const isSubmitting = ref(false)
const selectedImageFiles = ref<File[]>([])
const selectedTags = ref<string[]>([])

// Nigerian/African Fashion Tags
const tagOptions = [
  // Traditional Nigerian/African Styles
  'Agbada',
  'Kaftan',
  'Dashiki',
  'Boubou',
  'Ankara',
  'Aso Ebi',
  'Aso Oke',
  'Adire',
  'Kente',
  'Mud Cloth',
  'Gele',
  'Fila',
  'Sokoto',
  'Buba',
  'Iro',
  'Wrapper',

  // Occasions
  'Wedding',
  'Traditional Wedding',
  'Church',
  'Mosque',
  'Naming Ceremony',
  'Birthday',
  'Graduation',
  'Corporate',
  'Casual',
  'Party',
  'Festival',
  'Funeral',
  'Engagement',
  'Owambe',
  'Aso Ebi Party',
  'Sunday Best',
  'Office Wear',

  // Garment Types
  'Dress',
  'Gown',
  'Blouse',
  'Skirt',
  'Trousers',
  'Shorts',
  'Jumpsuit',
  'Suit',
  'Shirt',
  'Top',
  'Jacket',
  'Blazer',
  'Coat',
  'Kimono',
  'Caftan',
  'Tunic',

  // Gender & Age
  'Men',
  'Women',
  'Unisex',
  'Kids',
  'Boys',
  'Girls',
  'Maternity',
  'Plus Size',

  // Fabrics Popular in Nigeria/Africa
  'Ankara',
  'Lace',
  'Aso Oke',
  'Adire',
  'Kente',
  'Mud Cloth',
  'Batik',
  'Tie Dye',
  'Cotton',
  'Silk',
  'Chiffon',
  'Organza',
  'Satin',
  'Velvet',
  'Denim',
  'Linen',
  'Guinea Brocade',
  'Swiss Lace',
  'French Lace',
  'Hollandis',
  'Kampala',

  // Styles & Cuts
  'A-Line',
  'Mermaid',
  'Straight',
  'Flare',
  'Fitted',
  'Loose',
  'Off Shoulder',
  'Long Sleeve',
  'Short Sleeve',
  'Sleeveless',
  'High Neck',
  'V-Neck',
  'Round Neck',
  'Maxi',
  'Mini',
  'Midi',
  'Floor Length',
  'Knee Length',

  // Colors (Popular in Nigerian Fashion)
  'Gold',
  'Royal Blue',
  'Emerald Green',
  'Purple',
  'Red',
  'Orange',
  'Yellow',
  'Pink',
  'Black',
  'White',
  'Cream',
  'Brown',
  'Burgundy',
  'Coral',
  'Turquoise',

  // Seasons & Weather
  'Dry Season',
  'Rainy Season',
  'Harmattan',
  'Hot Weather',
  'Cool Weather',

  // Regional Styles
  'Yoruba',
  'Igbo',
  'Hausa',
  'Fulani',
  'Edo',
  'Efik',
  'Tiv',
  'Kanuri',
  'West African',
  'East African',
  'South African',
  'Central African',

  // Modern/Contemporary
  'Modern',
  'Contemporary',
  'Fusion',
  'Afrocentric',
  'Afrofuturism',
  'Trendy',
  'Classic',
  'Vintage',
  'Retro',
  'Minimalist',
  'Bold',
  'Statement',

  // Special Features
  'Embroidered',
  'Beaded',
  'Sequined',
  'Printed',
  'Plain',
  'Patterned',
  'Hand Sewn',
  'Machine Sewn',
  'Tailored',
  'Ready to Wear',
]

// Image upload handler
const handleImageUpload = (files: File[] | null | undefined) => {
  if (files && files.length > 0) {
    // Process each file for validation
    files.forEach(file => {
      // Check file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        useToast().add({
          title: 'File too large',
          description: `${file.name} is larger than 2MB. Please choose a smaller file.`,
          color: 'error',
        })
        return
      }
    })
  }
}

// Handle creating new tags
const handleCreateTag = (newTag: string) => {
  // Add the new tag to the options list so it can be reused
  if (!tagOptions.includes(newTag)) {
    tagOptions.push(newTag)
  }

  // Add the new tag to selected tags if not already selected
  if (!selectedTags.value.includes(newTag)) {
    selectedTags.value.push(newTag)
  }
}

// Close handler
const handleClose = () => {
  emit('close')
}

// Reset form when slideover closes
watch(
  () => props.isOpen,
  isOpen => {
    if (!isOpen) {
      formData.value = {
        name: '',
        description: '',
        notes: '',
      }
      selectedTags.value = []
      selectedImageFiles.value = []
    }
  }
)

const handleSubmit = async () => {
  // Basic validation
  if (!formData.value.name.trim()) {
    useToast().add({
      title: 'Validation Error',
      description: 'Please enter a style name.',
      color: 'error',
    })
    return
  }

  if (!selectedImageFiles.value || selectedImageFiles.value.length === 0) {
    useToast().add({
      title: 'Validation Error',
      description: 'Please upload at least one image for the style.',
      color: 'error',
    })
    return
  }

  try {
    isSubmitting.value = true

    // Create FormData for multipart upload
    const formDataToSend = new FormData()
    formDataToSend.append('name', formData.value.name.trim())

    if (formData.value.description) {
      formDataToSend.append('description', formData.value.description)
    }

    if (selectedTags.value.length > 0) {
      formDataToSend.append('tags', JSON.stringify(selectedTags.value))
    }

    // Add image files
    selectedImageFiles.value.forEach((file, index) => {
      formDataToSend.append(`image_${index}`, file)
    })
    formDataToSend.append('imageCount', selectedImageFiles.value.length.toString())

    // Create the style using direct fetch
    const response = await $fetch('/api/styles', {
      method: 'POST',
      body: formDataToSend,
    })

    if (response && typeof response === 'object' && 'success' in response) {
      const newStyle = response as { success: boolean; data?: any; message?: string }

      if (newStyle.success && newStyle.data) {
        useToast().add({
          title: 'Style added',
          description: 'The style has been successfully added.',
          color: 'success',
        })

        // Emit success with the created style
        emit('success', newStyle.data)
      } else {
        throw new Error(newStyle.message || 'Failed to create style')
      }
    } else {
      throw new Error('Invalid response from server')
    }
  } catch (error: any) {
    console.error('Failed to create style:', error)
    useToast().add({
      title: 'Error',
      description: 'Failed to add style. Please try again.',
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>
