<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
    <UForm
ref="form"
:schema="schema"
:state="formState"
class="space-y-6"
@submit="onSubmit">
      <div class="space-y-6">
        <UFormField name="logo" label="Business Logo">
          <UFileUpload
            v-model="logoFile"
            accept="image/*"
            :max-size="2 * 1024 * 1024"
            size="xl"
            variant="area"
            label="Drop your image here"
            description="SVG, PNG, JPG or GIF (max. 2MB)"
            :multiple="false"
            @update:model-value="onLogoChange"
          />
          <template #error>
            <span v-if="logoError" class="text-red-500 text-sm">{{ logoError }}</span>
          </template>
        </UFormField>
      </div>

      <div class="grid gap-4 md:grid-cols-2 mt-6">
        <UFormField label="Shop Name" name="businessName">
          <UInput
            v-model="formState.businessName"
            placeholder="Business or Shop Name"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Years in Business" name="yearsInBusiness">
          <UInput
            v-model.number="formState.yearsInBusiness"
            type="number"
            min="0"
            max="200"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Phone" name="phone">
          <UInput v-model="formState.phone" placeholder="Contact phone number" class="w-full" />
        </UFormField>
        <UFormField label="Address" name="address">
          <UInput v-model="formState.address" placeholder="Street address" class="w-full" />
        </UFormField>
        <UFormField label="City" name="city">
          <UInput v-model="formState.city" placeholder="City" class="w-full" />
        </UFormField>
        <UFormField label="State" name="state">
          <USelectMenu
            v-model="formState.state"
            :items="nigerianStates"
            placeholder="Select a state"
            class="w-full"
            searchable
            searchable-placeholder="Search states..."
          />
        </UFormField>
        <UFormField label="Specializations" name="specializations">
          <UInput
            v-model="formState.specializations"
            placeholder="e.g. Men's Suits, Ankara, Bridal Wear"
            class="w-full"
          />
        </UFormField>
      </div>
      <UFormField label="Business Description" name="businessDescription">
        <UTextarea
          v-model="formState.businessDescription"
          placeholder="Describe your business..."
          class="w-full"
        />
      </UFormField>

      <div class="flex items-center justify-end gap-3 pt-4">
        <UButton type="submit" color="primary" :loading="loading"> Save Changes </UButton>
      </div>
    </UForm>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

const nigerianStates = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
  'FCT - Abuja',
]

const toast = useToast()
const schema = z.object({
  businessName: z.string().max(160).nullable().optional(),
  yearsInBusiness: z.number().int().min(0).max(200).nullable().optional(),
  businessDescription: z.string().max(2000).nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  address: z.string().max(200).nullable().optional(),
  city: z.string().max(120).nullable().optional(),
  state: z.string().max(120).nullable().optional(),
  specializations: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
})
type Schema = z.output<typeof schema>

// Override types to be more specific
interface FormState extends Omit<Schema, 'state'> {
  state?: string
  image?: string | null
}

const form = ref()
const logoFile = ref<File | null | undefined>(null)
const logoError = ref<string | null>(null)
const logoPreview = ref<string | null>(null)

const formState = reactive<FormState>({
  businessName: '',
  yearsInBusiness: null,
  businessDescription: '',
  phone: '',
  address: '',
  city: '',
  state: undefined,
  specializations: '',
  image: null,
})

const { loading: businessLoading, updateBusiness, getBusiness } = useBusiness()
const isLoading = ref(true)

const loading = computed(() => isLoading.value || businessLoading.value)

// No need for separate upload function, we'll handle it in the form submission

const onLogoChange = (file: File | null | undefined) => {
  logoFile.value = file

  if (!file) {
    logoError.value = 'No file selected'
    logoPreview.value = null
    return
  }

  // Check file size (2MB max)
  const maxSize = 2 * 1024 * 1024 // 2MB in bytes
  if (file.size > maxSize) {
    logoError.value = 'File size should be less than 2MB'
    return
  }

  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml']
  if (!validTypes.includes(file.type)) {
    logoError.value = 'Invalid file type. Please upload an image (JPEG, PNG, GIF, SVG)'
    return
  }

  // Show preview
  const reader = new FileReader()
  reader.onload = e => {
    if (e.target?.result) {
      logoPreview.value = e.target.result as string
    }
  }
  reader.readAsDataURL(file)
}

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  try {
    isLoading.value = true

    // Create FormData for the request
    const formData = new FormData()

    // Append all form fields
    Object.entries(formState).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value))
      }
    })

    // Append the image file if a new one was selected
    if (logoFile.value) {
      formData.append('image', logoFile.value)
    }

    // Convert FormData to a plain object for the updateBusiness composable
    // Update business profile using the composable with FormData
    const { success, error } = await updateBusiness(formData)

    if (!success) {
      throw new Error(error || 'Failed to update business profile')
    }

    toast.add({
      title: 'Success',
      description: 'Business profile updated successfully',
      color: 'success',
    })
  } catch (err: any) {
    console.error('Error updating business profile:', err)
    toast.add({
      title: 'Error',
      description: err.message || 'An error occurred while updating the profile',
      color: 'error',
    })
  } finally {
    isLoading.value = false
  }
}

// Load business data on mount
onMounted(async () => {
  try {
    const { data } = await getBusiness()
    if (data) {
      Object.assign(formState, data)
      if (data.image) {
        logoPreview.value = data.image
      }
    }
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err.message || 'Unable to load business profile',
      color: 'error',
    })
  } finally {
    isLoading.value = false
  }
})
try {
  const res = await updateBusiness(formState)
  if (res?.success) {
    toast.add({
      title: 'Saved',
      description: 'Profile updated!',
      color: 'success',
    })
  } else {
    throw new Error(res?.error || res?.message || 'Failed to update')
  }
} catch (err: any) {
  toast.add({
    title: 'Error',
    description: err.message || 'Update failed',
    color: 'error',
  })
} finally {
  isLoading.value = false
}
</script>
