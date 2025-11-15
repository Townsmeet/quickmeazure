# QuickMeazure - AI Copilot Instructions

**Project Type:** Nuxt 4 Full-Stack SaaS Platform for Tailor/Fashion Business Management

## Architecture Overview

### Tech Stack

- **Frontend:** Nuxt 4 (Vue 3) + Pinia + TypeScript + Tailwind CSS + Nuxt UI (nuxtui v4)
- **Backend:** Nitro (Nuxt server engine) + Better Auth (auth)
- **Database:** Turso (SQLite compatible) + Drizzle ORM
- **Storage:** AWS S3 for style images
- **Auth:** Better Auth with email/password + Google OAuth
- **Payments:** Paystack integration
- **Error Tracking:** Sentry (both client & server)
- **Testing:** Vitest + Vue Test Utils
- **Email:** Brevo (formerly Sendinblue)

### Core Business Domain

QuickMeazure helps tailors/fashion professionals manage:

- **Clients** - with measurements and contact info
- **Orders** - with status tracking and billing
- **Styles** - design templates with S3-stored images
- **Measurements** - customizable templates for different garment types
- **Subscriptions** - tiered plans (Free/Standard/Premium) with feature limits
- **Billing** - deposits, balance tracking, Paystack payments

## Essential File Map

### Frontend Structure (`app/`)

- **`composables/`** - Data fetching & state management (primary layer)
  - `useAuth.ts` - Authentication with Better Auth client + onboarding logic
  - `useClients.ts`, `useOrders.ts`, `useStyles.ts` - CRUD operations with $fetch & useFetch
  - `useDashboard.ts` - Aggregated stats with separate fetch functions per data type
  - `useSubscriptions.ts`, `useBilling.ts` - Subscription & payment state
  - `useMeasurementTemplates.ts` - Template management
  - `useBusiness.ts` - Business profile with FormData support for image uploads

- **`middleware/auth.ts`** - Route protection + onboarding flow enforcement
  - Public routes: `/`, `/auth/*`, `/legal/*`
  - Protected routes: `/dashboard`, `/clients`, `/orders`, `/styles`, `/settings`
  - Smart redirect: unauthenticated → login; incomplete onboarding → required step
- **`pages/`** - File-based routing
  - `dashboard/` - Main analytics & overview
  - `clients/`, `orders/`, `styles/` - CRUD pages
  - `settings/` - User preferences & business profile
  - `auth/` - Login, register, email verification, password reset

- **`utils/auth-client.ts`** - Better Auth Vue client (baseURL: `/api/auth`)
  - Extends user schema with: `hasActiveSubscription`, `subscriptionStatus`, `onboardingStep`

### Backend Structure (`server/`)

- **`api/`** - Nitro endpoints (HTTP only, no RPC-style)
  - `auth/` - Better Auth routes (handled by `betterAuth.handler()`)
  - `clients/`, `orders/`, `styles/`, etc. - REST endpoints with auth context
  - Pattern: `defineEventHandler(async event => { auth = event.context.auth; ... })`
  - Error handling: use `createError({ statusCode, statusMessage })`

- **`repositories/`** - Data access layer (Drizzle queries)
  - `clientsRepository.ts`, `ordersRepository.ts`, etc.
  - Encapsulate all DB logic; imported by API handlers
  - Example: `dashboardRepository.ts` - complex queries for stats/growth/activity

- **`database/`** - Schema & migrations
  - `schema.ts` - All Drizzle table definitions
  - Key tables: `user`, `session`, `account`, `clients`, `orders`, `styles`, `measurements`, `subscriptions`, `plans`
  - User has: `onboardingStep`, `hasActiveSubscription`, `subscriptionStatus`, `onboardingCompletedAt`
- **`utils/auth.ts`** - Better Auth server config
  - DrizzleAdapter with schema, email/password + Google OAuth
  - Custom emails: password reset, email verification
- **`services/`** - Business logic
  - `email.ts` - SMTP via Brevo for sending emails
  - S3 client setup for style image uploads

- **`validators/`** - Zod schemas for input validation

## Critical Patterns & Conventions

### 1. Client-Side Data Fetching (Composables)

**Pattern:** Always use `useFetch` for queries, `$fetch` for mutations

```typescript
// Query (read-only, with automatic caching/refresh)
const {
  data,
  pending: isLoading,
  refresh,
} = useFetch<ResponseType>('/api/endpoint', {
  server: false, // Client-side only
  default: () => ({ success: false, data: null }),
  onResponse({ response }) {
    /* sync to state */
  },
  onResponseError({ error }) {
    /* error.value = ... */
  },
})

// Mutation (write operation, immediate)
const response = await $fetch('/api/endpoint', {
  method: 'POST',
  body: data,
})
```

### 2. API Response Format

All endpoints return: `{ success: boolean; data?: T; message?: string; error?: string }`

- Success (200): `{ success: true, data: { ... } }`
- Error: `{ success: false, message: "reason" }`

### 3. Authentication in API Routes

```typescript
const auth = event.context.auth // Set by Better Auth middleware
if (!auth?.userId) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
```

Always filter queries by `userId` for multi-tenancy.

### 4. State Management (Pinia + useState)

- Composables use `useState()` for shared state (auto-persistent via Pinia plugin)
- `readonly()` wrapper prevents accidental mutations from components
- No explicit Pinia stores; all logic in composables

### 5. Onboarding Flow

**States:** `verification` → `subscription` → `complete`

- `middleware/auth.ts` enforces step progression
- `utils/onboarding.ts` has logic: `getCurrentOnboardingStep()`, `getRequiredOnboardingPath()`
- User must verify email, then complete subscription before accessing dashboard
- Accessible paths per step defined in `canAccessPath()`

### 6. Database: Drizzle ORM + Turso

- Use `drizzle-kit` for migrations: `pnpm db:generate`, `pnpm db:push`
- Never use raw SQL unless necessary; prefer query builder
- Foreign keys cascade on delete; user deletion cascades to all related records
- Timestamps stored as Unix (integer with `mode: 'timestamp'`)

### 7. Error Handling

- **Client:** Composables catch errors → set `error.value` → components check `error.readonly()`
- **Server:** Use `createError()` or return `{ success: false, message: "..." }`
- **Sentry:** Errors auto-captured for client & server (configured in plugins)

### 8. Form Data (Image Uploads)

Only `useBusiness.ts` handles FormData; other endpoints use JSON:

```typescript
const headers = { Accept: 'application/json' }
if (!(payload instanceof FormData)) headers['Content-Type'] = 'application/json'
await $fetch('/api/business', { method: 'PUT', body: payload, headers })
```

### 9. Testing Strategy

- **Config:** `vitest.config.ts` with `nuxt` environment + 80% coverage threshold
- **Mocks:** Setup in `tests/setup.ts` (matchMedia, $fetch, ResizeObserver, etc.)
- **Run:** `pnpm test` (unit) | `pnpm test:watch` | `pnpm test:coverage`

## Developer Workflows

### Local Development

```bash
pnpm install
pnpm dev  # Starts on http://localhost:3000
```

### Database

```bash
pnpm db:generate  # Create migration files
pnpm db:push      # Apply migrations to Turso
pnpm db:studio    # Open Drizzle Studio UI
pnpm db:seed      # Seed subscription plans
```

### S3 Integration (for style images)

- Configure `.env`: `NUXT_S3_ACCESS_KEY_ID`, `NUXT_S3_SECRET_ACCESS_KEY`, `NUXT_S3_REGION`, `NUXT_S3_BUCKET`, `NUXT_S3_ENDPOINT`
- Test: `pnpm test:s3` (uploads a file, verifies connectivity)
- See `S3_SETUP.md` for full AWS IAM setup

### Code Quality

```bash
pnpm lint          # ESLint check
pnpm lint:fix      # Auto-fix
pnpm format        # Prettier
pnpm typecheck     # Vue TSC
pnpm quality       # All of above + tests
pnpm quality:fix   # Lint + format
```

### Email Templates

- Location: `server/email-templates/`
- Functions: `createPasswordResetEmail()`, `createEmailVerificationEmail()`
- Sent via Brevo API (configured in `server/utils/email.ts`)
- SMTP key: `NUXT_BREVO_API_KEY`

## Project-Specific Quirks & Gotchas

1. **No RPC layer** - All API calls are REST via `$fetch()/useFetch()` with consistent response shape
2. **Auth context via Better Auth** - `event.context.auth` set automatically on protected routes
3. **Onboarding is mandatory** - Even email-verified users cannot access dashboard until subscription step completes
4. **Timestamp handling** - Backend uses Unix timestamps (milliseconds); client converts via `processTimestamps()` utils
5. **Pinia persistence** - State auto-saved to localStorage via `pinia-plugin-persistedstate`
6. **No manual redirects in composables** - Middleware handles auth redirects; composables focus on data
7. **S3 images not required** - Only style uploads use S3; business avatars may fallback
8. **Google OAuth required** - Configured in Better Auth + Nuxt UI (nuxtui v4) for "Login with Google" button

## Common Tasks

### Adding a New CRUD Resource

1. Add Drizzle table to `server/database/schema.ts`
2. Create `server/repositories/<resource>Repository.ts` with query functions
3. Create `server/api/<resource>/index.ts` (GET/POST) and `[id].ts` (GET/PUT/DELETE)
4. Create `app/composables/use<Resource>.ts` with `useFetch` + `$fetch` pattern
5. Create `app/pages/<resource>/` pages with composable binding
6. Add route to middleware auth if protected

### Debugging Auth Issues

- Check `useAuth.ts` → `init()` function (calls `authClient.getSession()`)
- Inspect `middleware/auth.ts` → route path matching logic
- Verify Better Auth config in `server/utils/auth.ts` → check secret/baseURL env vars
- Check browser localStorage for `auth_user` cookie

### S3 Upload Failures

- Verify CORS config in AWS S3 bucket
- Check endpoint matches bucket region (not generic s3.amazonaws.com)
- Inspect CloudWatch logs for IAM permission errors
- Run `pnpm test:s3` to validate credentials

## Environment Variables

**Critical .env vars:**

- `NUXT_TURSO_DATABASE_URL`, `NUXT_TURSO_AUTH_TOKEN` - Turso DB
- `NUXT_BETTER_AUTH_SECRET`, `NUXT_BETTER_AUTH_URL` - Auth
- `NUXT_GOOGLE_CLIENT_ID`, `NUXT_GOOGLE_CLIENT_SECRET` - OAuth
- `NUXT_PAYSTACK_SECRET_KEY`, `NUXT_PAYSTACK_PUBLIC_KEY` - Payments
- `NUXT_S3_*` (5 vars) - AWS S3
- `NUXT_BREVO_API_KEY` - Email
- `NUXT_SENTRY_DSN_*` - Error tracking

See `nuxt.config.ts` for full runtime config structure.

---

**Last Updated:** November 2025 | Nuxt 4 + Better Auth + Drizzle Stack
