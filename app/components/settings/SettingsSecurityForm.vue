<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">Change Password</h3>

    <UForm
:schema="schema"
:state="formState"
class="space-y-6"
@submit="onSubmit">
      <UFormField label="Current Password" name="currentPassword" required>
        <UInput
          v-model="formState.currentPassword"
          type="password"
          placeholder="Enter your current password"
          :disabled="loading"
          autocomplete="current-password"
          class="w-full md:w-1/2"
        />
      </UFormField>

      <UFormField label="New Password" name="newPassword" required>
        <UInput
          v-model="formState.newPassword"
          type="password"
          placeholder="Enter your new password"
          :disabled="loading"
          autocomplete="new-password"
          class="w-full md:w-1/2"
        />
      </UFormField>

      <UFormField label="Confirm New Password" name="confirmPassword" required>
        <UInput
          v-model="formState.confirmPassword"
          type="password"
          placeholder="Confirm your new password"
          :disabled="loading"
          autocomplete="new-password"
          class="w-full md:w-1/2"
        />
        <template v-if="formState.confirmPassword && !passwordsMatch" #error>
          Passwords do not match
        </template>
      </UFormField>

      <div class="flex items-center justify-end gap-3 pt-4">
        <UButton
          type="button"
          color="neutral"
          variant="outline"
          :disabled="loading"
          @click="resetForm"
        >
          Cancel
        </UButton>
        <UButton
type="submit"
color="primary"
:loading="loading"
:disabled="!isFormValid">
          Change Password
        </UButton>
      </div>
    </UForm>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'
import {
  hasUpperCase as checkUpperCase,
  hasLowerCase as checkLowerCase,
  hasNumber as checkNumber,
  hasSpecialChar as checkSpecialChar,
  getPasswordStrength,
  getPasswordStrengthLabel,
} from '~/utils/password'

// Form validation schema
const schema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .refine(
        password => {
          return (
            checkUpperCase(password) &&
            checkLowerCase(password) &&
            checkNumber(password) &&
            checkSpecialChar(password)
          )
        },
        {
          message:
            'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character',
        }
      ),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type Schema = z.output<typeof schema>

// Form state
const formState = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// Loading state
const loading = ref(false)

// Toast for notifications
const toast = useToast()

// Use user composable
const { changePassword, isLoading: isChangingPassword } = useAuth()

// Computed properties for password strength
const passwordStrength = computed(() => {
  if (!formState.newPassword) return 0
  return getPasswordStrength(formState.newPassword)
})

const strengthLabel = computed(() => {
  return getPasswordStrengthLabel(passwordStrength.value)
})

const strengthColorClass = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 1) return 'text-red-600 dark:text-red-400'
  if (strength === 2) return 'text-yellow-600 dark:text-yellow-400'
  if (strength === 3) return 'text-blue-600 dark:text-blue-400'
  return 'text-green-600 dark:text-green-400'
})

const strengthBarColorClass = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 1) return 'bg-red-500'
  if (strength === 2) return 'bg-yellow-500'
  if (strength === 3) return 'bg-blue-500'
  return 'bg-green-500'
})

const hasUppercase = computed(() => checkUpperCase(formState.newPassword))
const hasLowercase = computed(() => checkLowerCase(formState.newPassword))
const hasNumberChar = computed(() => checkNumber(formState.newPassword))
const hasSpecialChar = computed(() => checkSpecialChar(formState.newPassword))

const passwordsMatch = computed(() => {
  if (!formState.newPassword || !formState.confirmPassword) return true
  return formState.newPassword === formState.confirmPassword
})

const isFormValid = computed(() => {
  return (
    formState.currentPassword &&
    formState.newPassword &&
    formState.confirmPassword &&
    passwordsMatch.value &&
    passwordStrength.value >= 3
  )
})

// Form submission
async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true

  try {
    const response = await changePassword(event.data.currentPassword, event.data.newPassword, true)

    if (response.success) {
      toast.add({
        title: 'Success',
        description: 'Your password has been changed successfully',
        color: 'success',
        icon: 'i-heroicons-check-circle',
      })
      resetForm()
    } else {
      toast.add({
        title: 'Error',
        description: response.error || 'Failed to change password',
        color: 'error',
        icon: 'i-heroicons-exclamation-circle',
      })
    }
  } catch (error) {
    console.error('Password change error:', error)
    toast.add({
      title: 'Error',
      description: 'An error occurred while changing your password',
      color: 'error',
      icon: 'i-heroicons-exclamation-circle',
    })
  } finally {
    loading.value = false
  }
}

// Reset form
function resetForm() {
  formState.currentPassword = ''
  formState.newPassword = ''
  formState.confirmPassword = ''
}
</script>
