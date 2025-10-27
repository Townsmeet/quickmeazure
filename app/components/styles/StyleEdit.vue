<template>
  <USlideover
    :open="isOpen"
    title="Edit Style"
    side="right"
    @update:open="value => !value && $emit('close')"
  >
    <template #body>
      <div v-if="localStyle" class="space-y-6">
        <UForm :state="localStyle" class="space-y-4">
          <!-- Current Image -->
          <div v-if="localStyle.imageUrl" class="space-y-3">
            <div class="text-sm text-gray-600">Current Image:</div>
            <div class="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
              <img
                :src="localStyle.imageUrl"
                :alt="localStyle.name"
                class="w-full h-full object-cover"
              />
            </div>
          </div>

          <!-- Image Upload -->
          <UFormField label="Upload New Images" name="images">
            <UFileUpload
              v-model="selectedImageFiles"
              multiple
              accept="image/*"
              color="neutral"
              highlight
              label="Drop new images here (multiple images allowed)"
              description="SVG, PNG, JPG or GIF (max. 2MB each)"
              class="w-full min-h-32"
              @update:model-value="handleImageUpload"
            />
          </UFormField>

          <UFormField label="Style Name" name="name" required>
            <UInput v-model="localStyle.name" placeholder="Enter style name" class="w-full" />
          </UFormField>

          <UFormField label="Description" name="description">
            <UTextarea
              v-model="localStyle.description"
              placeholder="Enter style description (multiple images allowed)"
              :rows="3"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Tags" name="tags">
            <USelectMenu
              v-model="styleTags"
              :items="tagOptions"
              multiple
              create-item
              placeholder="Select or create tags..."
              class="w-full"
              @create="handleCreateTag"
            />
            <div v-if="styleTags.length > 0" class="flex flex-wrap gap-2 mt-2">
              <UBadge
v-for="tag in styleTags"
:key="tag"
variant="soft"
color="primary"
size="sm">
                {{ tag }}
              </UBadge>
            </div>
          </UFormField>
        </UForm>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end space-x-3">
        <UButton
color="neutral"
variant="outline"
:disabled="isSaving"
@click="$emit('close')">
          Cancel
        </UButton>
        <UButton
color="primary"
:loading="isSaving"
:disabled="!localStyle"
@click="handleSave">
          Save Changes
        </UButton>
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import type { Style } from '~/types/style'

interface Props {
  isOpen: boolean
  style: Style | null
}

interface Emits {
  (e: 'close'): void
  (e: 'save', style: Style, imageFiles?: File[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Loading state for save button
const isSaving = ref(false)
const selectedImageFiles = ref<File[]>([])
const styleTags = ref<string[]>([])

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

// Local reactive copy of style data to avoid prop mutation
const localStyle = ref<Style | null>(null)

// Watch for changes in the style prop and update local copy
watch(
  () => props.style,
  newStyle => {
    if (newStyle) {
      // Create a deep copy to avoid reference issues
      localStyle.value = JSON.parse(JSON.stringify(newStyle))
      // Set tags from the style (create a mutable copy)
      styleTags.value = [...(newStyle.tags || [])]
    } else {
      localStyle.value = null
      styleTags.value = []
    }
    // Reset image previews when style changes
    selectedImageFiles.value = []
  },
  { immediate: true, deep: true }
)

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
  if (!styleTags.value.includes(newTag)) {
    styleTags.value.push(newTag)
  }
}

// Save handler with loading state
const handleSave = async () => {
  if (!localStyle.value) return

  isSaving.value = true
  try {
    // Update the local style with tags before saving
    if (localStyle.value) {
      localStyle.value.tags = styleTags.value
    }
    emit('save', localStyle.value, selectedImageFiles.value)
  } finally {
    // Reset loading state after a short delay to show the loading state
    setTimeout(() => {
      isSaving.value = false
    }, 500)
  }
}
</script>
