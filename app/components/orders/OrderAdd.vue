<template>
  <USlideover
:open="isOpen"
title="Add Order"
side="right"
@update:open="onClose">
    <template #body>
      <div class="space-y-6">
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">Basic Information</h3>
            <UFormField label="Client" name="clientId" required>
              <USelectMenu
                v-model="form.clientId"
                :items="clientOptions"
                value-attribute="value"
                option-attribute="label"
                placeholder="Select a client"
                searchable
                :loading="clientsLoading"
                class="w-full"
              />
            </UFormField>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UFormField label="Style" name="styleId">
                <USelectMenu
                  v-model="form.styleId"
                  :items="styleOptions"
                  placeholder="Select a style (optional)"
                  searchable
                  :loading="stylesLoading"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Status" name="status" required>
                <USelectMenu
                  v-model="form.status"
                  :items="statusOptions"
                  value-attribute="value"
                  option-attribute="label"
                  placeholder="Select status"
                  class="w-full"
                />
              </UFormField>
            </div>
            <UFormField label="Due Date" name="dueDate">
              <UInput
                v-model="form.dueDate"
                type="date"
                placeholder="Select due date"
                class="w-full"
              />
            </UFormField>
          </div>
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">Payment Information</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UFormField label="Total Amount" name="totalAmount" required>
                <UInput
                  v-model.number="form.totalAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  class="w-full"
                >
                  <template #leading><span class="text-gray-500">₦</span></template>
                </UInput>
              </UFormField>
              <UFormField label="Advance Payment" name="depositAmount">
                <UInput
                  v-model.number="form.depositAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  :max="form.totalAmount"
                  placeholder="0.00"
                  class="w-full"
                >
                  <template #leading><span class="text-gray-500">₦</span></template>
                </UInput>
              </UFormField>
              <UFormField label="Balance Payment" name="balanceAmount" class="md:col-span-2">
                <UInput
                  :model-value="balanceAmount"
                  type="number"
                  disabled
                  class="bg-gray-50 w-full"
                >
                  <template #leading><span class="text-gray-500">₦</span></template>
                </UInput>
              </UFormField>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UFormField label="Payment Status" name="paymentStatus">
                <USelectMenu
                  v-model="form.paymentStatus"
                  :items="paymentStatusOptions"
                  placeholder="Select payment status"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Payment Method" name="paymentMethod">
                <UInput
                  v-model="form.paymentMethod"
                  placeholder="e.g., Cash, Bank Transfer, Card"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              Additional Information
            </h3>
            <UFormField label="Notes" name="notes">
              <UTextarea
                v-model="form.notes"
                placeholder="Add any additional notes about this order..."
                class="w-full"
              />
            </UFormField>
          </div>
        </form>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end space-x-3">
        <UButton
color="neutral"
variant="outline"
:disabled="isSubmitting"
@click="onClose">
          Cancel
        </UButton>
        <UButton color="primary" :loading="isSubmitting" @click="handleSubmit">
          Create Order
        </UButton>
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import type { CreateOrderInput } from '~/types/order'

const _props = defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'success', payload: CreateOrderInput): void }>()

const { clients, fetchClients, isLoading: clientsLoading } = useClients()
const { styles, fetchStyles, isLoading: stylesLoading } = useStyles()
const toast = useToast()

const isSubmitting = ref(false)

const form = reactive<CreateOrderInput>({
  clientId: null,
  styleId: '',
  status: 'pending',
  dueDate: '',
  totalAmount: 0,
  depositAmount: 0,
  notes: '',
  items: [],
  measurements: {},
  shippingAddress: {},
  billingAddress: {},
  paymentStatus: 'pending',
  paymentMethod: '',
  paymentReference: '',
})
const balanceAmount = computed(() => (form.totalAmount || 0) - (form.depositAmount || 0))

const clientOptions = computed(() =>
  clients.value.map(c => ({
    label: c.name,
    value: Number(c.id),
  }))
)

const styleOptions = computed(() => styles.value.map(s => ({ label: s.name, value: s.id })))
const statusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Pending', value: 'pending' },
  { label: 'Processing', value: 'processing' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Refunded', value: 'refunded' },
]
const paymentStatusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Paid', value: 'paid' },
  { label: 'Partially Paid', value: 'partially_paid' },
  { label: 'Refunded', value: 'refunded' },
]

watch(balanceAmount, v => (form.balanceAmount = v))

watch(
  () => form.clientId,
  val => {
    console.log('clientId after select:', val, 'type:', typeof val)
  },
  { immediate: false }
)

onMounted(async () => {
  try {
    await Promise.all([fetchClients(), fetchStyles()])
  } catch (_error) {
    toast.add({
      title: 'Error',
      description: 'Failed to load form data. Please refresh the page.',
      color: 'error',
    })
  }
})

function onClose() {
  emit('close')
}

async function handleSubmit() {
  if (isSubmitting.value) return
  try {
    isSubmitting.value = true
    let clientId = form.clientId
    if (clientId && typeof clientId === 'object') clientId = clientId.value
    clientId = Number(clientId)
    let status = form.status
    if (status && typeof status === 'object' && status.value) status = status.value
    status = String(status)
    console.log('clientId after select:', clientId, 'type:', typeof clientId)
    if (!clientId || isNaN(clientId)) {
      toast.add({
        title: 'Validation Error',
        description: 'Please select a valid client',
        color: 'error',
      })
      isSubmitting.value = false
      return
    }
    if (!form.totalAmount || form.totalAmount <= 0) {
      toast.add({
        title: 'Validation Error',
        description: 'Please enter a valid total amount',
        color: 'error',
      })
      isSubmitting.value = false
      return
    }
    const orderToSave = {
      ...form,
      clientId,
      status,
      styleId: form.styleId ? Number(form.styleId) : undefined,
    }
    console.log('Submitting order', orderToSave)
    emit('success', orderToSave)
  } finally {
    isSubmitting.value = false
  }
}
</script>
