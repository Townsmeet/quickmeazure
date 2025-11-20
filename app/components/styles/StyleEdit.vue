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
          <!-- Current Images -->
          <div v-if="existingImageUrls.length" class="space-y-3">
            <div class="text-sm text-gray-600">
              Current Images
              <span class="text-gray-400">({{ existingImageUrls.length }})</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div
                v-for="(imageUrl, index) in existingImageUrls"
                :key="`${imageUrl}-${index}`"
                class="w-full h-24 sm:h-32 bg-gray-100 rounded-lg overflow-hidden"
              >
                <img
                  :src="imageUrl"
                  :alt="`${localStyle.name} image ${index + 1}`"
                  class="w-full h-full object-cover"
                />
              </div>
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
  isSaving?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'save', style: Style, imageFiles?: File[]): void
}

const props = withDefaults(defineProps<Props>(), {
  isSaving: false,
})
const emit = defineEmits<Emits>()

// Loading state for save button
const isSaving = computed(() => props.isSaving)
const selectedImageFiles = ref<File[]>([])
const styleTags = ref<string[]>([])
const existingImageUrls = computed(() => {
  if (!localStyle.value) return []

  const urls = new Set<string>()
  parseImageUrls(localStyle.value.imageUrls).forEach(url => urls.add(url))

  if (typeof localStyle.value.imageUrl === 'string' && localStyle.value.imageUrl.trim()) {
    urls.add(localStyle.value.imageUrl.trim())
  }

  return Array.from(urls)
})

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

const normalizeTags = (tags: unknown): string[] => {
  if (Array.isArray(tags)) {
    return tags.filter(tag => typeof tag === 'string') as string[]
  }

  if (typeof tags === 'string') {
    const trimmed = tags.trim()
    if (!trimmed) return []

    // Attempt to parse JSON arrays stored as strings
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          return parsed.filter(tag => typeof tag === 'string')
        }
      } catch {
        // fall through to treating as single tag
      }
    }

    return [trimmed]
  }

  return []
}

function parseImageUrls(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string' && !!item.trim())
      .map(item => item.trim())
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []

    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed)
        return parseImageUrls(parsed)
      } catch {
        // fall through to treating as single or comma-separated string
      }
    }

    if (trimmed.includes(',')) {
      return trimmed
        .split(',')
        .map(part => part.trim())
        .filter(Boolean)
    }

    return [trimmed]
  }

  return []
}

// Watch for changes in the style prop and update local copy
watch(
  () => props.style,
  newStyle => {
    if (newStyle) {
      // Create a deep copy to avoid reference issues
      localStyle.value = JSON.parse(JSON.stringify(newStyle))
      // Set tags from the style (create a mutable copy)
      styleTags.value = normalizeTags(newStyle.tags)
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

  // Update the local style with tags before saving
  localStyle.value.tags = [...styleTags.value]
  emit('save', localStyle.value, selectedImageFiles.value)
}
</script>
