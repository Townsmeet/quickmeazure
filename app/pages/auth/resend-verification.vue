<template>
  <div
    class="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 space-y-6"
  >
    <LogoLink />
    <!-- Title and Subtitle - Outside Card -->
    <div class="text-center mb-6 w-full max-w-md">
      <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
        Resend Verification
      </h2>
      <p class="mt-2 text-gray-600 dark:text-gray-300">
        Enter your email to get a new verification link
      </p>
    </div>

    <div
      class="w-full max-w-md space-y-6 p-4 sm:p-8 bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-700/50"
    >
      <UForm
:schema="resendSchema"
:state="state"
class="space-y-4"
@submit="onSubmit">
        <UFormField label="Email address" name="email">
          <UInput
            v-model="state.email"
            type="email"
            placeholder="Enter your email address"
            icon="i-heroicons-envelope"
            class="w-full"
            required
          />
        </UFormField>

        <UButton
type="submit"
color="primary"
class="w-full justify-center"
:loading="isLoading">
          Send Verification Email
        </UButton>
      </UForm>

      <div class="text-center space-y-2">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?
          <NuxtLink to="/auth/register" class="font-medium text-primary-600 hover:text-primary-500">
            Sign up
          </NuxtLink>
        </p>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Already verified?
          <NuxtLink to="/auth/login" class="font-medium text-primary-600 hover:text-primary-500">
            Sign in
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'
import LogoLink from '~/components/common/LogoLink.vue'

definePageMeta({
  layout: 'auth',
})

const toast = useToast()
const { sendVerificationEmail, isLoading } = useAuth()

// Validation schema
const resendSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type ResendData = z.output<typeof resendSchema>

const state = reactive<Partial<ResendData>>({
  email: '',
})

async function onSubmit(event: FormSubmitEvent<ResendData>) {
  try {
    const { error } = await sendVerificationEmail(event.data.email)

    if (error) {
      throw error
    }

    toast.add({
      title: 'Email sent',
      description: 'A new verification email has been sent to your inbox.',
      color: 'success',
    })

    // Navigate to verify-email page with the email
    await navigateTo(`/auth/verify-email?email=${encodeURIComponent(event.data.email)}`)
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to send verification email'

    toast.add({
      title: 'Error',
      description: errorMessage,
      color: 'error',
    })
  }
}
</script>
