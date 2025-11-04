# Admin Invoices Page - Investigation & Design

## 🔍 Investigation Summary

### Current State
- **Page Location**: `/admin/invoices` - **DOES NOT EXIST YET** (would show 404)
- **Finance Team Use Case**: Need to manage payments from multiple sources:
  1. **Annual Service Fees** - Organizations pay for service access
  2. **CV Review Payments** - Experts pay for CV review (bank transfers need confirmation)

### Data Models Identified

#### 1. Organization Annual Payments (`organizationServiceApprovals`)
**Table**: `organizationServiceApprovals`
**Fields**:
- `paymentReference`: string (optional)
- `paymentAmount`: number (optional)
- `paidAt`: number (optional) - timestamp when payment confirmed
- `expiresAt`: number (optional) - timestamp when payment expires (1 year after paidAt)
- `status`: 'approved' | 'pending' | 'rejected' | 'suspended'

**Business Logic**:
- Organization must have **qualified lead expert** before they can pay annual fee
- Payment sets `paidAt` and calculates `expiresAt` = paidAt + 1 year
- Annual fee amount: €2,500 (hardcoded in PayAnnualFeeController)

**Key Query**: `api.serviceApproval.getServiceApprovalStatus` - Returns payment status per org+service

#### 2. CV Review Payments (`expertCVs`)
**Table**: `expertCVs`
**Fields**:
- `status`: CVStatus ('draft' | 'completed' | 'payment_pending' | 'paid' | 'locked_for_review' | 'unlocked_for_edits' | 'locked_final')
- `submittedAt`: number (optional) - when payment processed (bank transfer submitted)
- `paidAt`: number (optional) - when payment confirmed by finance team

**Payment Flow**:
- Expert completes CV → status: 'completed'
- Expert chooses payment method (credit card = immediate 'paid', bank transfer = 'payment_pending')
- Finance team confirms bank transfer → updates status: 'paid'

**Key Query**: `api.expert.getCVs` with `status: 'payment_pending'` - Gets CVs awaiting payment confirmation

### "Qualified Lead Expert" Definition
From `serviceApproval.ts` and `model/status.ts`:
- Expert must be assigned as **'lead'** role for the service
- Expert's `trainingStatus` must be **'passed'** or **'not_required'** (checked via `isQualified()`)
- This enables organization to proceed with annual fee payment

## 📋 Requirements Analysis

### User Requirements
1. **Extract organizations** that have qualified lead expert and need to pay annual fee:
   - First time payment (never paid before)
   - Payment expired (expiresAt < now)

2. **Three Segments/Filters**:
   - **Pending Payment**: Invoice sent, payment needs confirmation
   - **Renewal Coming Up Soon**: Expiring within 90/30/7 days
   - **History**: All payment records

3. **Finance Team Needs**:
   - CV payments (bank transfers) needing confirmation
   - Annual fee payments needing confirmation
   - Both come from different tables/DBs

## 🎯 Design Proposal

### Page Structure: `/admin/invoices`

#### Tab/Segment Navigation
Three tabs or filter sections:

1. **Pending Payment** (Default/Active)
2. **Renewals Coming Up**
3. **Payment History**

### Segment 1: Pending Payment

**Data Sources**:
- **Annual Fees**: `organizationServiceApprovals` where:
  - `status = 'approved'`
  - `paidAt` is undefined OR expired (`expiresAt < now`)
  - Organization has qualified lead expert for the service
  - Payment reference exists (invoice sent)

- **CV Payments**: `expertCVs` where:
  - `status = 'payment_pending'`

**Display Format**:
- **Table View** with columns:
  - Type (Badge: "Annual Fee" | "CV Review")
  - Organization/Expert Name
  - Service/Expert Details
  - Amount (€2,500 for annual fee, variable for CV)
  - Payment Reference
  - Invoice Date
  - Actions (Confirm Payment button)

**Actions**:
- Confirm Annual Fee Payment → Calls `api.serviceApproval.payAnnualFee`
- Confirm CV Payment → Calls `api.expert.updateCVStatus` (status: 'paid')

### Segment 2: Renewals Coming Up Soon

**Data Source**:
- `organizationServiceApprovals` where:
  - `status = 'approved'`
  - `paidAt` is defined (has paid before)
  - `expiresAt` is defined
  - `expiresAt` is between now and (now + 90 days)

**Display Format**:
- **Grouped by urgency**:
  - 🔴 **Urgent** (0-7 days) - Red badge
  - 🟡 **Warning** (8-30 days) - Yellow badge
  - 🟢 **Upcoming** (31-90 days) - Green badge

**Table Columns**:
- Organization Name
- Service Name/Version
- Current Payment Reference
- Paid Date
- Expires Date
- Days Until Expiry
- Qualified Lead Expert (name)
- Actions (Send Renewal Invoice / Mark as Paid)

**Actions**:
- Send Renewal Invoice (creates payment reference, marks as pending)
- Mark as Paid (calls `api.serviceApproval.payAnnualFee`)

### Segment 3: Payment History

**Data Sources**:
- **Annual Fees**: All `organizationServiceApprovals` with `paidAt` defined
- **CV Payments**: All `expertCVs` with `status = 'paid'` or `paidAt` defined

**Display Format**:
- **Chronological list** (newest first)
- **Filters**: Date range, Organization, Payment Type
- **Table Columns**:
  - Date Paid
  - Type (Annual Fee / CV Review)
  - Organization/Expert
  - Service/Expert Details
  - Amount
  - Payment Reference
  - Status (Active/Expired)

## 🛠️ Technical Implementation Plan

### Backend Queries Needed

1. **`api.invoices.getPendingAnnualFees`** (New)
   - Returns: `organizationServiceApprovals` that need payment confirmation
   - Filters: `status='approved'`, `paidAt` undefined OR expired, has qualified lead

2. **`api.invoices.getPendingCVPayments`** (New)
   - Returns: `expertCVs` with `status='payment_pending'`
   - Enriches with user and organization data

3. **`api.invoices.getUpcomingRenewals`** (New)
   - Returns: `organizationServiceApprovals` expiring within 90 days
   - Groups by urgency (7, 30, 90 day thresholds)

4. **`api.invoices.getPaymentHistory`** (New)
   - Returns: Combined annual fees + CV payments
   - Sorted by `paidAt` descending
   - Supports date range and organization filters

### Frontend Components

1. **`/admin/invoices/+page.svelte`**
   - Tab navigation (Pending / Renewals / History)
   - Conditional rendering of segments

2. **`PendingPaymentTable.svelte`**
   - Displays annual fees and CV payments needing confirmation
   - Action buttons for each payment type

3. **`RenewalsTable.svelte`**
   - Displays upcoming renewals grouped by urgency
   - Shows days until expiry

4. **`PaymentHistoryTable.svelte`**
   - Chronological list with filters
   - Supports pagination if needed

### UI/UX Considerations

- **Finance Team Focus**: Clear, actionable items
- **Payment Reference**: Always visible (critical for bank transfers)
- **Qualified Lead Status**: Show if organization is eligible to pay
- **Expiry Warnings**: Visual hierarchy (red/yellow/green badges)
- **Confirmation Actions**: Modal confirmation before processing payment

## ❓ Open Questions for User

1. **Invoice Generation**: Do we need to generate invoices, or is payment reference enough?
2. **Payment Reference Format**: What format should payment references follow?
3. **CV Payment Amounts**: Are CV review payments a fixed amount or variable?
4. **Renewal Notifications**: Should renewals auto-send invoices or manual only?
5. **Historical Data**: How far back should payment history go? (Filter by date range?)
6. **Integration**: Does "finance team sets invoices as paid" mean manual entry or system integration?

## 📝 Next Steps

1. ✅ Investigation complete
2. ⏳ **Await user feedback** on design proposal and open questions
3. ⏳ Create backend queries in `convex/invoices.ts` (new file)
4. ⏳ Build frontend page and components
5. ⏳ Test with sample data
6. ⏳ Refine based on finance team feedback

