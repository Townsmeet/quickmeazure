<template>
  <div class="space-y-6">
    <UCard class="shadow-md border-0">
      <template #header>
        <div class="flex items-center">
          <UIcon name="i-heroicons-shield-check" class="mr-2 text-primary-500 h-5 w-5" />
          <h2 class="text-xl font-semibold text-gray-900">Security Settings</h2>
        </div>
        <p class="mt-1 text-sm text-gray-500">Manage your password settings.</p>
      </template>
      <div class="space-y-6">
        <div class="bg-gray-50 p-6 rounded-lg border border-gray-100">
          <h3 class="text-base font-medium text-gray-900 mb-6 flex items-center">
            <UIcon name="i-heroicons-key" class="mr-2 text-primary-500 h-5 w-5" />
            Change Password
          </h3>
          <UForm :state="passwordForm" class="space-y-6" @submit="updatePassword">
            <div class="space-y-6">
              <div class="space-y-2">
                <label for="currentPassword" class="block text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <UInput
                  id="currentPassword"
                  v-model="passwordForm.currentPassword"
                  :type="showCurrentPassword ? 'text' : 'password'"
                  placeholder="Enter current password"
                  size="lg"
                  class="w-full md:w-1/2"
                >
                  <template #trailing>
                    <UButton
                      color="neutral"
                      variant="ghost"
                      @click="showCurrentPassword = !showCurrentPassword"
                    >
                      <UIcon
                        :name="showCurrentPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                      />
                    </UButton>
                  </template>
                </UInput>
              </div>

              <hr class="my-4 border-t border-gray-200" />

              <div class="space-y-2">
                <label for="newPassword" class="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <UInput
                  id="newPassword"
                  v-model="passwordForm.newPassword"
                  :type="showNewPassword ? 'text' : 'password'"
                  placeholder="Enter new password"
                  size="lg"
                  class="w-full md:w-1/2"
                >
                  <template #trailing>
                    <UButton
                      color="neutral"
                      variant="ghost"
                      @click="showNewPassword = !showNewPassword"
                    >
                      <UIcon
                        :name="showNewPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                      />
                    </UButton>
                  </template>
                </UInput>
                <div v-if="passwordForm.newPassword && !isPasswordValid" class="mt-2">
                  <div class="flex justify-between items-center mb-1">
                    <span class="text-sm text-gray-600">Password strength</span>
                    <span
                      class="text-sm"
                      :class="{
                        'text-red-500': passwordStrength <= 1,
                        'text-yellow-500': passwordStrength === 2,
                        'text-blue-500': passwordStrength === 3,
                        'text-green-500': passwordStrength === 4,
                      }"
                    >
                      {{
                        passwordStrength === 0
                          ? 'Very weak'
                          : passwordStrength === 1
                            ? 'Weak'
                            : passwordStrength === 2
                              ? 'Fair'
                              : passwordStrength === 3
                                ? 'Good'
                                : 'Strong'
                      }}
                    </span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div
                      class="h-2 rounded-full transition-all duration-300"
                      :class="{
                        'bg-red-500': passwordStrength <= 1,
                        'bg-yellow-500': passwordStrength === 2,
                        'bg-blue-500': passwordStrength === 3,
                        'bg-green-500': passwordStrength === 4,
                      }"
                      :style="{ width: `${(passwordStrength / 4) * 100}%` }"
                    ></div>
                  </div>

                  <!-- Password criteria checklist -->
                  <div class="mt-3 space-y-1">
                    <div class="text-sm">
                      <div class="flex items-center space-x-2">
                        <UIcon
                          :name="
                            passwordForm.newPassword.length >= 8
                              ? 'i-heroicons-check-circle'
                              : 'i-heroicons-x-circle'
                          "
                          :class="
                            passwordForm.newPassword.length >= 8
                              ? 'text-green-600'
                              : 'text-gray-500'
                          "
                          class="h-4 w-4"
                        />
                        <span
                          :class="
                            passwordForm.newPassword.length >= 8
                              ? 'text-green-600'
                              : 'text-gray-500'
                          "
                          >At least 8 characters</span
                        >
                      </div>
                      <div class="flex items-center space-x-2">
                        <UIcon
                          :name="
                            hasUpperCase(passwordForm.newPassword) &&
                            hasLowerCase(passwordForm.newPassword)
                              ? 'i-heroicons-check-circle'
                              : 'i-heroicons-x-circle'
                          "
                          :class="
                            hasUpperCase(passwordForm.newPassword) &&
                            hasLowerCase(passwordForm.newPassword)
                              ? 'text-green-600'
                              : 'text-gray-500'
                          "
                          class="h-4 w-4"
                        />
                        <span
                          :class="
                            hasUpperCase(passwordForm.newPassword) &&
                            hasLowerCase(passwordForm.newPassword)
                              ? 'text-green-600'
                              : 'text-gray-500'
                          "
                          >Upper and lowercase letters</span
                        >
                      </div>
                      <div class="flex items-center space-x-2">
                        <UIcon
                          :name="
                            hasNumber(passwordForm.newPassword)
                              ? 'i-heroicons-check-circle'
                              : 'i-heroicons-x-circle'
                          "
                          :class="
                            hasNumber(passwordForm.newPassword) ? 'text-green-600' : 'text-gray-500'
                          "
                          class="h-4 w-4"
                        />
                        <span
                          :class="
                            hasNumber(passwordForm.newPassword) ? 'text-green-600' : 'text-gray-500'
                          "
                          >At least one number</span
                        >
                      </div>
                      <div class="flex items-center space-x-2">
                        <UIcon
                          :name="
                            hasSpecialChar(passwordForm.newPassword)
                              ? 'i-heroicons-check-circle'
                              : 'i-heroicons-x-circle'
                          "
                          :class="
                            hasSpecialChar(passwordForm.newPassword)
                              ? 'text-green-600'
                              : 'text-gray-500'
                          "
                          class="h-4 w-4"
                        />
                        <span
                          :class="
                            hasSpecialChar(passwordForm.newPassword)
                              ? 'text-green-600'
                              : 'text-gray-500'
                          "
                          >Special character</span
                        >
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="space-y-2">
                <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <UInput
                  id="confirmPassword"
                  v-model="passwordForm.confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  placeholder="Confirm new password"
                  size="lg"
                  class="w-full md:w-1/2"
                  :color="passwordMismatchError ? 'error' : undefined"
                >
                  <template #trailing>
                    <UButton
                      color="neutral"
                      variant="ghost"
                      @click="showConfirmPassword = !showConfirmPassword"
                    >
                      <UIcon
                        :name="showConfirmPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                      />
                    </UButton>
                  </template>
                </UInput>
                <div v-if="passwordMismatchError" class="text-red-500 text-sm mt-1">
                  <div class="flex items-center">
                    <UIcon name="i-heroicons-exclamation-circle" class="mr-1 h-4 w-4" />
                    Passwords do not match
                  </div>
                </div>
              </div>

              <div class="flex justify-end space-x-4">
                <UButton
                  type="submit"
                  color="primary"
                  size="lg"
                  :loading="isSubmitting"
                  :disabled="!isFormValid"
                >
                  Update Password
                </UButton>
              </div>
            </div>
          </UForm>
        </div>

        <!-- Password Tips -->
        <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h4 class="text-sm font-medium text-blue-800 mb-2 flex items-center">
            <UIcon name="i-heroicons-information-circle" class="mr-2 h-5 w-5" />
            Password Security Tips
          </h4>
          <ul class="text-xs text-blue-700 space-y-1 ml-7 list-disc">
            <li>Use a unique password you don't use elsewhere</li>
            <li>Include uppercase and lowercase letters, numbers, and symbols</li>
            <li>Avoid using easily guessable information like birthdays</li>
            <li>Consider using a password manager for added security</li>
          </ul>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const toast = useToast()

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const isSubmitting = ref(false)

// Password validation functions
const hasLowerCase = (str: string) => /[a-z]/.test(str)
const hasUpperCase = (str: string) => /[A-Z]/.test(str)
const hasNumber = (str: string) => /\d/.test(str)
const hasSpecialChar = (str: string) => /[!@#$%^&*()_+\-={}();':"\\|,.<>/?]/.test(str)

// Calculate password strength
const passwordStrength = computed(() => {
  if (!passwordForm.value.newPassword) return 0

  let strength = 0
  if (passwordForm.value.newPassword.length >= 8) strength++
  if (hasLowerCase(passwordForm.value.newPassword) && hasUpperCase(passwordForm.value.newPassword))
    strength++
  if (hasNumber(passwordForm.value.newPassword)) strength++
  if (hasSpecialChar(passwordForm.value.newPassword)) strength++

  return strength
})

// Check if passwords match
const passwordMismatchError = computed(() => {
  // Only show mismatch error if both fields have values and they don't match
  return (
    passwordForm.value.newPassword &&
    passwordForm.value.confirmPassword &&
    passwordForm.value.newPassword !== passwordForm.value.confirmPassword
  )
})

// Check if new password meets all criteria
const isPasswordValid = computed(() => {
  return (
    passwordForm.value.newPassword.length >= 8 &&
    hasUpperCase(passwordForm.value.newPassword) &&
    hasLowerCase(passwordForm.value.newPassword) &&
    hasNumber(passwordForm.value.newPassword) &&
    hasSpecialChar(passwordForm.value.newPassword)
  )
})

// Form validation
const isFormValid = computed(() => {
  // Check if all required fields are filled
  const fieldsValid =
    !!passwordForm.value.currentPassword &&
    !!passwordForm.value.newPassword &&
    passwordForm.value.newPassword === passwordForm.value.confirmPassword

  const result = fieldsValid && isPasswordValid.value
  console.log('Form validation:', {
    fieldsValid,
    passwordValid: isPasswordValid.value,
    isValid: result,
    currentPassword: !!passwordForm.value.currentPassword,
    newPassword: !!passwordForm.value.newPassword,
    passwordsMatch: passwordForm.value.newPassword === passwordForm.value.confirmPassword,
    passwordLength: passwordForm.value.newPassword
      ? passwordForm.value.newPassword.length >= 8
      : false,
    hasUpperCase: passwordForm.value.newPassword
      ? hasUpperCase(passwordForm.value.newPassword)
      : false,
    hasLowerCase: passwordForm.value.newPassword
      ? hasLowerCase(passwordForm.value.newPassword)
      : false,
    hasNumber: passwordForm.value.newPassword ? hasNumber(passwordForm.value.newPassword) : false,
    hasSpecialChar: passwordForm.value.newPassword
      ? hasSpecialChar(passwordForm.value.newPassword)
      : false,
  })
  return result
})

async function updatePassword() {
  if (!isFormValid.value) return

  isSubmitting.value = true
  try {
    console.log('Submitting password change request to user store...')

    // Call the change password API directly
    await $fetch('/api/users/change-password', {
      method: 'POST',
      body: {
        currentPassword: passwordForm.value.currentPassword,
        newPassword: passwordForm.value.newPassword,
      },
    })

    toast.add({
      title: 'Password updated',
      description: 'Your password has been successfully changed',
      icon: 'i-heroicons-check-circle',
      color: 'primary',
    })

    // Reset form
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
    showCurrentPassword.value = false
    showNewPassword.value = false
    showConfirmPassword.value = false
  } catch (error) {
    console.error('Failed to update password:', error)
    toast.add({
      title: 'Password Update Failed',
      description: (error as Error).message || 'An unexpected error occurred. Please try again.',
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle',
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>
