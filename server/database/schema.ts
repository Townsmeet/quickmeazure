import {
  sqliteTable,
  integer,
  text,
  real,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

// Better Auth tables (migrated here from better-auth-schema)
export const user = sqliteTable('ba_user', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false).notNull(),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow().notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).defaultNow().notNull(),
})

// User profiles table (replaces removed local users' profile fields)
export const userProfiles = sqliteTable(
  'user_profiles',
  {
    userId: text('user_id')
      .primaryKey()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name'),
    avatar: text('avatar'),
    businessName: text('business_name'),
    phone: text('phone'),
    location: text('location'),
    bio: text('bio'),
    specializations: text('specializations'), // JSON string
    services: text('services'), // JSON string
    hasCompletedSetup: integer('has_completed_setup', { mode: 'boolean' })
      .notNull()
      .default(false),
    createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow().notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).defaultNow(),
  }
)

export const session = sqliteTable('ba_session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow().notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).defaultNow().notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
})

export const account = sqliteTable('ba_account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow().notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).defaultNow().notNull(),
})

export const verification = sqliteTable('ba_verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow().notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).defaultNow().notNull(),
})

// NOTE: Local users table removed; all FKs now reference Better Auth user.id (text)

// Plans table
export const plans = sqliteTable('plans', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description').notNull(),
  price: real('price').notNull(),
  interval: text('interval').notNull(), // 'monthly', 'annual', etc.
  features: text('features'), // JSON string
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  isFeatured: integer('is_featured', { mode: 'boolean' }).notNull().default(false),
  maxClients: integer('max_clients'), // Max number of clients allowed
  maxStyles: integer('max_styles'), // Max number of styles allowed
  maxStorage: integer('max_storage'), // Storage limit in MB
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow().notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).defaultNow(),
})

// Subscriptions table to track user subscriptions
export const subscriptions = sqliteTable('subscriptions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  planId: integer('plan_id')
    .notNull()
    .references(() => plans.id),
  status: text('status').notNull().default('active'), // active, canceled, expired, pending
  startDate: integer('start_date', { mode: 'timestamp' }).notNull().defaultNow(),
  endDate: integer('end_date', { mode: 'timestamp' }), // When the subscription expires
  billingPeriod: text('billing_period').notNull(), // monthly, annual
  amount: real('amount').notNull(), // Amount paid
  nextBillingDate: integer('next_billing_date', { mode: 'timestamp' }), // When the next payment is due
  canceledAt: integer('canceled_at', { mode: 'timestamp' }), // When the user canceled
  paymentMethod: text('payment_method').default('paystack'), // Payment method used
  paymentReference: text('payment_reference'), // Reference ID from payment provider
  metadata: text('metadata'), // JSON string
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow().notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).defaultNow(),
})

// Business table (one-to-one with users)
export const businesses = sqliteTable(
  'businesses',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    name: text('name').notNull(),
    logo: text('logo'),
    address: text('address'),
    city: text('city'),
    state: text('state'),
    country: text('country'),
    zipCode: text('zip_code'),
    phone: text('phone'),
    email: text('email'),
    website: text('website'),
    taxId: text('tax_id'),
    businessType: text('business_type'),
    description: text('description'),
    socialMedia: text('social_media'), // JSON string
    operatingHours: text('operating_hours'), // JSON string
    settings: text('settings'), // JSON string
    createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow().notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).defaultNow(),
  },
  table => {
    return {
      // Ensure one-to-one relationship with user
      userIdUnique: uniqueIndex('business_user_unique').on(table.userId),
    }
  }
)

// Business profiles table
export const businessProfiles = sqliteTable('business_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  shopName: text('shop_name'),
  businessType: text('business_type'),
  yearsInBusiness: integer('years_in_business'),
  businessDescription: text('business_description'),
  phone: text('phone'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  specializations: text('specializations'),
  services: text('services'),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow().notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).defaultNow(),
})

// Clients table
export const clients = sqliteTable('clients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow().notNull(),
})

// Orders table
export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: integer('client_id')
    .notNull()
    .references(() => clients.id),
  dueDate: text('due_date'),
  totalAmount: real('total_amount').notNull().default(0),
  status: text('status').notNull().default('Pending'),
  description: text('description'),
  details: text('details'),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow().notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).defaultNow(),
})

// Styles table
export const styles = sqliteTable('styles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  name: text('name').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  details: text('details'),
  category: text('category'),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow().notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).defaultNow(),
})

// Measurements table (one-to-one with clients)
export const measurements = sqliteTable(
  'measurements',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    clientId: integer('client_id')
      .notNull()
      .references(() => clients.id),
    // Use only fields that are known to exist in the database
    // We'll use the values field for all measurements
    values: text('values'),
    notes: text('notes'),
    lastUpdated: integer('last_updated', { mode: 'timestamp' }).defaultNow().notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow().notNull(),
  },
  table => {
    return {
      // Ensure one-to-one relationship with client
      clientIdUnique: uniqueIndex('measurement_client_unique').on(table.clientId),
    }
  }
)

// Payments table - Enhanced to support both order and subscription payments
export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').references(() => orders.id),
  subscriptionId: integer('subscription_id').references(() => subscriptions.id),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('NGN'),
  paymentMethod: text('payment_method').notNull(),
  paymentMethodId: integer('payment_method_id').references(() => paymentMethods.id),
  paymentDate: integer('payment_date', { mode: 'timestamp' }).notNull(),
  status: text('status').notNull().default('successful'), // 'successful', 'failed', 'pending'
  reference: text('reference'), // Payment reference from provider
  description: text('description'),
  provider: text('provider').default('paystack'),
  providerReference: text('provider_reference'),
  metadata: text('metadata'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow().notNull(),
  createdBy: text('created_by'), // User ID who created the payment
  updatedAt: integer('updated_at', { mode: 'timestamp' }).defaultNow(),
})

// Measurement Templates
export const measurementTemplates = sqliteTable(
  'measurement_templates',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
    isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
    gender: text('gender').notNull(), // 'male', 'female', or 'unisex'
    createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow().notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).defaultNow(),
  },
  table => ({
    // Ensure unique template names per user
    uniqueNamePerUser: uniqueIndex('template_user_name_unique').on(table.userId, table.name),
  })
)

// Measurement Fields
export const measurementFields = sqliteTable(
  'measurement_fields',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    templateId: integer('template_id')
      .notNull()
      .references(() => measurementTemplates.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    unit: text('unit').notNull().default('cm'),
    isRequired: integer('is_required', { mode: 'boolean' }).notNull().default(true),
    displayOrder: integer('display_order').notNull().default(0),
    metadata: text('metadata'),
    createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow().notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).defaultNow(),
  },
  table => ({
    // Ensure unique field names per template
    uniqueFieldPerTemplate: uniqueIndex('field_template_name_unique').on(
      table.templateId,
      table.name
    ),
  })
)

// Client Measurements
export const clientMeasurements = sqliteTable(
  'client_measurements',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    clientId: integer('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),
    templateId: integer('template_id')
      .notNull()
      .references(() => measurementTemplates.id, { onDelete: 'cascade' }),
    values: text('values').notNull(), // JSON string of fieldId: value pairs
    notes: text('notes'),
    takenAt: integer('taken_at', { mode: 'timestamp' }).defaultNow().notNull(),
    takenBy: text('taken_by').references(() => user.id, { onDelete: 'set null' }),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).defaultNow(),
    createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow().notNull(),
  },
  table => ({
    // Ensure one measurement record per client per template
    uniqueClientTemplate: uniqueIndex('client_template_unique').on(
      table.clientId,
      table.templateId
    ),
  })
)

// User Measurement Settings
export const userMeasurementSettings = sqliteTable('user_measurement_settings', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  defaultUnit: text('default_unit').notNull().default('cm'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).defaultNow(),
})

// Payment methods table
export const paymentMethods = sqliteTable('payment_methods', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  type: text('type').notNull(), // 'card', 'bank', etc.
  last4: text('last4'),
  expiryMonth: text('expiry_month'),
  expiryYear: text('expiry_year'),
  brand: text('brand'), // 'visa', 'mastercard', etc.
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  provider: text('provider').notNull().default('paystack'),
  providerId: text('provider_id'), // ID from the payment provider
  metadata: text('metadata'),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow().notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).defaultNow(),
})

// Subscription Payments table for subscription-related transactions
export const subscriptionPayments = sqliteTable('subscription_payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  subscriptionId: integer('subscription_id')
    .references(() => subscriptions.id)
    .notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('NGN'),
  status: text('status').notNull(), // 'successful', 'failed', 'pending'
  reference: text('reference'), // Payment reference from provider
  description: text('description'),
  paymentMethodId: integer('payment_method_id').references(() => paymentMethods.id),
  provider: text('provider').notNull().default('paystack'),
  providerReference: text('provider_reference'),
  metadata: text('metadata'),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow().notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).defaultNow(),
})

// Order Payments table for order-related transactions
export const orderPayments = sqliteTable('order_payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  orderId: integer('order_id')
    .references(() => orders.id)
    .notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('NGN'),
  status: text('status').notNull(), // 'successful', 'failed', 'pending'
  reference: text('reference'), // Payment reference from provider
  description: text('description'),
  paymentMethodId: integer('payment_method_id').references(() => paymentMethods.id),
  provider: text('provider').notNull().default('paystack'),
  providerReference: text('provider_reference'),
  metadata: text('metadata'),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow().notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).defaultNow(),
})

// Notifications table for user notifications
export const notifications = sqliteTable('notifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  type: text('type').notNull(), // 'payment', 'subscription', 'usage', 'system'
  severity: text('severity').notNull(), // 'info', 'warning', 'critical'
  title: text('title').notNull(),
  message: text('message').notNull(),
  read: integer('read', { mode: 'boolean' }).notNull().default(false),
  actionUrl: text('action_url'),
  actionText: text('action_text'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  metadata: text('metadata'),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow().notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).defaultNow(),
})

// Export types
export type User = typeof user.$inferSelect
export type Plan = typeof plans.$inferSelect
export type Subscription = typeof subscriptions.$inferSelect
export type Business = typeof businesses.$inferSelect
export type BusinessProfile = typeof businessProfiles.$inferSelect
export type Client = typeof clients.$inferSelect
export type Order = typeof orders.$inferSelect
export type Style = typeof styles.$inferSelect
export type Measurement = typeof measurements.$inferSelect
export type SubscriptionPayment = typeof subscriptionPayments.$inferSelect
export type OrderPayment = typeof orderPayments.$inferSelect
export type Notification = typeof notifications.$inferSelect
export type PaymentMethod = typeof paymentMethods.$inferSelect
export type MeasurementTemplate = typeof measurementTemplates.$inferSelect
export type NewMeasurementTemplate = typeof measurementTemplates.$inferInsert
export type MeasurementField = typeof measurementFields.$inferSelect
export type NewMeasurementField = typeof measurementFields.$inferInsert
export type ClientMeasurement = typeof clientMeasurements.$inferSelect
export type NewClientMeasurement = typeof clientMeasurements.$inferInsert
export type UserMeasurementSettings = typeof userMeasurementSettings.$inferSelect
export type NewUserMeasurementSettings = typeof userMeasurementSettings.$inferInsert
