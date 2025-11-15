# Billing/Subscription Implementation Issues

## Critical Issues Found

### 1. **Plan Matching by Slug Only (Missing Interval Check)**

**Problem**: The payment verification endpoint (`/api/payments/verify.post.ts`) finds plans by slug only, without checking the interval/billing period. This causes:

- When upgrading from "standard monthly" to "premium monthly", it finds the first plan with slug "premium" which might be "premium annual"
- The subscription gets updated with the wrong plan interval

**Location**: `server/api/payments/verify.post.ts` line 86-87

```typescript
const plan = planSlug
  ? await db.query.plans.findFirst({ where: eq(tables.plans.slug, planSlug) })
  : null
```

**Fix Required**: Match by both slug AND interval:

```typescript
const plan = planSlug
  ? await db.query.plans.findFirst({
      where: and(
        eq(tables.plans.slug, planSlug),
        eq(tables.plans.interval, normalizedBilling === 'monthly' ? 'month' : 'annual')
      ),
    })
  : null
```

### 2. **Plan Slug Structure Issue**

**Problem**: Plans in the database have slugs like "free", "standard", "premium" but there's no distinction between monthly and annual versions. The database schema shows plans have an `interval` field, but the slug doesn't include it.

**Location**: `server/database/schema.ts` - plans table

- Slug is unique but doesn't include interval
- This means you can't have both "premium monthly" and "premium annual" with different slugs

**Fix Required**: Either:

- Option A: Make slug include interval (e.g., "premium-monthly", "premium-annual")
- Option B: Make slug+interval a composite unique key (requires migration)
- Option C: Always match by slug AND interval (recommended - no migration needed)

### 3. **Payment Method Not Saved After Successful Payment**

**Problem**: When payment is successful through Paystack, the card details are not extracted and saved to the payment methods table.

**Location**: `server/api/payments/verify.post.ts`

- Payment verification succeeds but doesn't extract authorization data from Paystack response
- No call to save payment method after successful payment

**Fix Required**:

- Extract authorization data from Paystack verification response
- Call payment method save endpoint or directly insert/update payment method
- The Paystack verification response includes `data.authorization` object with card details

### 4. **Free Plan Downgrade Calls Unnecessary API**

**Problem**: When downgrading to free plan, it still calls `/api/subscriptions/plans` endpoint unnecessarily.

**Location**: `app/components/settings/SettingsBillingUpgradeModal.vue` line 253-280

- Free plan upgrade should not need to fetch plans from API
- Can use the plan data already available from `subscription-plans.ts`

**Fix Required**: For free plans, use the plan slug directly without API call, or cache the plan lookup.

### 5. **Billing Period Mismatch in Current Plan Display**

**Problem**: The current subscription endpoint returns the plan object, but the plan's interval might not match the subscription's billingPeriod.

**Location**: `server/api/subscriptions/current.get.ts`

- Returns `plan` object which has its own `interval` field
- Subscription has `billingPeriod` field
- These can be out of sync if plan lookup doesn't consider interval

**Fix Required**: When returning current subscription, ensure the plan's interval matches the subscription's billingPeriod, or return billingPeriod separately.

### 6. **Plan Lookup in Change-Plan Endpoint**

**Problem**: The change-plan endpoint uses numeric plan ID, but the frontend sends slug. This causes confusion.

**Location**: `server/api/subscriptions/change-plan.post.ts` line 74-85

- Expects numeric plan ID
- Frontend sends slug from `subscription-plans.ts`
- Conversion logic is inconsistent

**Fix Required**: Support both slug and numeric ID, or standardize on one approach.

### 7. **Missing Payment Authorization Extraction**

**Problem**: Paystack payment response includes authorization data (card details) but it's not being extracted and saved.

**Location**: `app/composables/usePaystack.ts` and `server/api/payments/verify.post.ts`

- Paystack callback receives response but doesn't extract authorization
- Verification endpoint doesn't fetch authorization from Paystack API

**Fix Required**:

- After payment verification, fetch transaction details from Paystack which includes authorization
- Extract card details (last4, expiry, brand, authorization_code)
- Save to payment methods table

### 8. **Subscription Update Doesn't Update Dates Properly**

**Problem**: When updating subscription in payment verification, it sets startDate to now, but should preserve or calculate based on existing subscription.

**Location**: `server/api/payments/verify.post.ts` line 100-109

- Always sets startDate to now
- Should check if upgrading/downgrading and handle proration
- endDate calculation might be wrong if upgrading mid-cycle

**Fix Required**:

- For upgrades: Calculate prorated end date
- For downgrades: Keep current end date or handle appropriately
- For new subscriptions: Use current logic

### 9. **No Validation of Plan Existence Before Payment**

**Problem**: Payment is initiated without verifying the plan exists in database with correct interval.

**Location**: `app/components/settings/SettingsBillingUpgradeModal.vue` line 326-356

- Calls `processPayment` directly without verifying plan exists
- Should validate plan exists before opening Paystack modal

**Fix Required**: Add plan validation before initiating payment.

### 10. **Inconsistent Interval Naming**

**Problem**: Different parts of the code use different interval names:

- `subscription-plans.ts`: 'monthly' | 'annually'
- Database: 'month' | 'annual'
- API endpoints: mix of both
- Payment verification: 'monthly' | 'annual'

**Fix Required**: Standardize on one naming convention throughout (recommend 'monthly' | 'annual').

## Recommended Fix Priority

1. **HIGH**: Fix plan matching by slug+interval in payment verification
2. **HIGH**: Extract and save payment method after successful payment
3. **MEDIUM**: Fix free plan downgrade to not call API unnecessarily
4. **MEDIUM**: Standardize interval naming convention
5. **MEDIUM**: Fix current plan display to show correct billing period
6. **LOW**: Add plan validation before payment
7. **LOW**: Improve subscription date handling for upgrades/downgrades

## Implementation Notes

- The database schema supports both slug and interval, so matching by both is the correct approach
- Paystack API returns authorization data in the transaction verification response
- Need to fetch full transaction details to get authorization object
- Payment methods should be saved automatically after successful payment, not separately
