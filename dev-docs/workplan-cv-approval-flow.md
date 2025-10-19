# CV Approval Flow Workplan - ZDHC Solution Provider Platform

## 📋 Document Purpose

This document defines the complete CV approval workflow for the ZDHC Solution Provider Platform, including status transitions, business rules, validation logic, and implementation steps.

---

## 🎯 **CORE STATUS FLOW**

### **CV Status Definitions**

```typescript
type CVStatus = 
  | 'draft'              // Incomplete, can edit freely
  | 'completed'          // Complete, ready for payment
  | 'payment_pending'    // Payment initiated, awaiting confirmation
  | 'paid'              // Payment confirmed, triggers automation
  | 'locked_for_review' // Automation complete, reviewer working
  | 'unlocked_for_edits' // Reviewer returned it for edits
  | 'locked_final'      // Review complete, immutable
```

### **Status Flow Logic**

```
draft → completed → payment_pending → paid → locked_for_review → unlocked_for_edits → locked_for_review → locked_final
```

**Key Business Rules:**
- **`paid` status**: Buffer for email automation, webhooks, error handling
- **Service lock**: Once paid, service assignments are LOCKED - no adding/removing services
- **CV data only**: After payment, only CV content (experience, education) can be edited
- **Review cycles**: Can loop between `locked_for_review` ↔ `unlocked_for_edits` multiple times
- **Final state**: `locked_final` is immutable for audit purposes

### **Service Assignment Status**

```typescript
type ServiceStatus = 
  | 'pending_review'    // Awaiting review
  | 'approved'          // Approved for this service
  | 'rejected'          // Rejected for this service
  | 'inactive'          // Deactivated/superseded
```

---

## 🔄 **STATUS TRANSITION RULES**

### **Valid Transitions**

```typescript
const CV_TRANSITIONS = {
  'draft': ['completed'],
  'completed': ['payment_pending', 'draft'], // Can revert if validation fails
  'payment_pending': ['paid', 'payment_failed'],
  'paid': ['locked_for_review'], // Automatic after automation completes
  'locked_for_review': ['unlocked_for_edits', 'locked_final'],
  'unlocked_for_edits': ['locked_for_review'], // Resubmit after edits (can loop)
  'locked_final': [] // Terminal state - no further transitions
};
```

### **Transition Triggers**

| From | To | Trigger | Who | Validation Required |
|------|----|---------|-----|-------------------|
| `draft` | `completed` | Save button (auto-validate) | User | All required fields filled |
| `completed` | `payment_pending` | User initiates payment | User | CV is complete |
| `payment_pending` | `paid` | Payment confirmed | System | Payment successful |
| `payment_pending` | `payment_failed` | Payment failed/timeout | System | Payment failed |
| `paid` | `locked_for_review` | Automation complete | System | Payment confirmed + emails sent |
| `locked_for_review` | `unlocked_for_edits` | Admin requests changes | Admin | Admin decision |
| `locked_for_review` | `locked_final` | All services decided | Admin | All services approved/rejected |
| `unlocked_for_edits` | `locked_for_review` | User clicks "Resubmit" | User | Changes made |

---

## ✅ **VALIDATION RULES**

### **CV Completion Validation**

```typescript
const isCVCompleted = (cv: ExpertCV): boolean => {
  return (
    cv.experience?.length > 0 &&            // At least one experience entry
    cv.education?.length > 0 &&             // At least one education entry
    cv.serviceAssignments?.length > 0       // At least one service assigned
  );
};
```

**Note**: User validation removed - CV validation only checks CV data, not user profile status.

### **Service Assignment Validation**

```typescript
const canLockCV = (cv: ExpertCV): boolean => {
  const assignments = cv.serviceAssignments || [];
  return assignments.every(assignment => 
    assignment.status === 'approved' || 
    assignment.status === 'rejected'
  );
};
```

### **Status Transition Validation**

```typescript
const canTransition = (currentStatus: CVStatus, newStatus: CVStatus): boolean => {
  const allowedTransitions = CV_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
};
```

---

## 🎨 **UI BEHAVIOR RULES**

### **Edit Page Logic**

```typescript
const getEditPageBehavior = (status: CVStatus) => {
  switch (status) {
    case 'draft':
      return {
        canEditCV: true,
        canEditServices: true,
        showValidationWarnings: true,
        primaryButton: 'Save',
        secondaryButton: null,
        primaryAction: 'saveAndValidate'
      };
    
    case 'completed':
      return {
        canEditCV: true,
        canEditServices: true,
        showValidationWarnings: false,
        primaryButton: 'Save',
        secondaryButton: 'Proceed to Payment',
        primaryAction: 'saveAndValidate',
        secondaryAction: 'initiatePayment'
      };
    
    case 'payment_pending':
      return {
        canEditCV: false,
        canEditServices: false,
        showPaymentStatus: true,
        primaryButton: 'Payment Processing...',
        secondaryButton: null,
        primaryAction: null
      };
    
    case 'paid':
      return {
        canEditCV: false,
        canEditServices: false,
        showPaymentConfirmed: true,
        primaryButton: 'Awaiting Review...',
        secondaryButton: null,
        primaryAction: null
      };
    
    case 'locked_for_review':
      return {
        canEditCV: false,
        canEditServices: false,
        showReviewerWorking: true,
        primaryButton: 'Reviewer Working',
        secondaryButton: null,
        primaryAction: null
      };
    
    case 'unlocked_for_edits':
      return {
        canEditCV: true,
        canEditServices: false, // Services locked after payment
        showReviewerFeedback: true,
        primaryButton: 'Save',
        secondaryButton: 'Resubmit for Review',
        primaryAction: 'saveProgress',
        secondaryAction: 'resubmitForReview'
      };
    
    case 'locked_final':
      return {
        canEditCV: false,
        canEditServices: false,
        showFinalStatus: true,
        primaryButton: 'Review Complete',
        secondaryButton: null,
        primaryAction: null
      };
  }
};
```

**Key Changes:**
- **Two buttons** for `unlocked_for_edits`: "Save" (progress) + "Resubmit for Review"
- **Service lock** after payment: `canEditServices: false` for paid+ statuses
- **Auto-validation** on save button for `draft` status

### **Status Display Colors**

```typescript
const getStatusColor = (status: CVStatus): string => {
  switch (status) {
    case 'draft': return 'bg-gray-100 text-gray-800';
    case 'completed': return 'bg-blue-100 text-blue-800';
    case 'payment_pending': return 'bg-yellow-100 text-yellow-800';
    case 'paid': return 'bg-green-100 text-green-800';
    case 'locked_for_review': return 'bg-orange-100 text-orange-800';
    case 'unlocked_for_edits': return 'bg-red-100 text-red-800';
    case 'locked_final': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};
```

### **Save Button Logic**

```typescript
async function save() {
  // 1. Save all changes (CV data + services if allowed)
  await saveChanges();
  
  // 2. Auto-validate and update status
  const validation = validateCVCompletion(cv);
  
  if (cv.status === 'draft' && validation.isValid) {
    await updateCVStatus('completed');
  }
  // Other statuses: no automatic status change on save
}

async function resubmitForReview() {
  // Only available for unlocked_for_edits status
  await saveChanges();
  await updateCVStatus('locked_for_review');
}
```

### **Service Editing Rules**

```typescript
const canEditServices = (status: CVStatus): boolean => {
  return ['draft', 'completed'].includes(status);
  // Services locked after payment - no adding/removing
};
```

---

## 🔒 **CRITICAL BUSINESS RULES**

### **Service Lock After Payment**

**RULE**: Once a CV reaches `paid` status, service assignments are **PERMANENTLY LOCKED**.

```typescript
// ✅ ALLOWED: Before payment
if (cv.status === 'draft' || cv.status === 'completed') {
  // User can add/remove services freely
  await addServiceAssignment(serviceId);
  await removeServiceAssignment(serviceId);
}

// ❌ FORBIDDEN: After payment
if (['paid', 'locked_for_review', 'unlocked_for_edits', 'locked_final'].includes(cv.status)) {
  // Services are locked - no changes allowed
  throw new Error('Services cannot be modified after payment');
}
```

### **CV Content Editing Rules**

```typescript
// ✅ ALWAYS ALLOWED: CV content editing
const canEditCVContent = (status: CVStatus): boolean => {
  return ['draft', 'completed', 'unlocked_for_edits'].includes(status);
};

// ❌ LOCKED: After review starts
const lockedStatuses = ['payment_pending', 'paid', 'locked_for_review', 'locked_final'];
```

### **Status Transition Logic**

```typescript
// Auto-validation on save
async function save() {
  await saveChanges();
  
  // Only auto-transition from draft to completed
  if (cv.status === 'draft') {
    const validation = validateCVCompletion(cv);
    if (validation.isValid) {
      await updateCVStatus('completed');
    }
  }
}

// Manual resubmit for review
async function resubmitForReview() {
  if (cv.status !== 'unlocked_for_edits') {
    throw new Error('Can only resubmit from unlocked_for_edits status');
  }
  await saveChanges();
  await updateCVStatus('locked_for_review');
}
```

---

## 🏗️ **DATABASE SCHEMA CHANGES**

### **Updated expertCVs Table**

```typescript
expertCVs: defineTable({
  userId: v.id('users'),
  organizationId: v.id('organizations'),
  version: v.number(),
  
  // CV Content
  experience: v.array(v.object({
    title: v.string(),
    company: v.string(),
    location: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    current: v.boolean(),
    description: v.string()
  })),
  education: v.array(v.object({
    school: v.string(),
    degree: v.string(),
    field: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    description: v.string()
  })),
  
  // Status Lifecycle
  status: v.union(
    v.literal('draft'),
    v.literal('completed'),
    v.literal('payment_pending'),
    v.literal('paid'),
    v.literal('locked_for_review'),
    v.literal('unlocked_for_edits'),
    v.literal('locked_final')
  ),
  
  // Timestamps
  createdAt: v.number(),
  createdBy: v.string(),
  completedAt: v.optional(v.number()),
  paymentInitiatedAt: v.optional(v.number()),
  paidAt: v.optional(v.number()),
  submittedAt: v.optional(v.number()),
  lockedForReviewAt: v.optional(v.number()),
  unlockedForEditsAt: v.optional(v.number()),
  lockedFinalAt: v.optional(v.number()),
  
  // Payment tracking
  paymentId: v.optional(v.string()),
  paymentMethod: v.optional(v.string()),
  paymentAmount: v.optional(v.number()),
  
  // Review tracking
  reviewedBy: v.optional(v.string()),
  reviewNotes: v.optional(v.string()),
  reviewerFeedback: v.optional(v.string()),
  
  notes: v.optional(v.string())
})
```

---

## 🚀 **CURRENT IMPLEMENTATION STATUS**

### **✅ What's Working**
- **Schema**: 7-status flow implemented in `expertCVs` table
- **Validation**: `validateCVCompletion()` checks experience, education, and service assignments
- **Mutations**: `updateCVStatus()` and `updateCV()` with organization-level security
- **Edit Page**: Full experience/education UI with add/remove/edit functionality
- **Status Logic**: `canEditServices()` and `canEditCVContent()` functions
- **Local State**: `$state()` + `$effect()` pattern for reactive UI updates

### **🔧 Current Implementation Details**
```typescript
// Key mutations implemented:
export const updateCVStatus = mutation({...}); // Status transitions
export const updateCV = mutation({...}); // Experience/education updates

// Key validation functions:
export function validateCVCompletion(cv: any): ValidationResult
export function canEditServices(status: string): boolean
export function canEditCVContent(status: string): boolean

// Security: Organization-level checks (no user ownership for prototype)
```

### **⚠️ Known Issues to Fix**
- **Save Function Logic**: Need to handle status transitions when CV becomes incomplete
- **Education Removal**: When all education removed, `completed` CV should revert to `draft`
- **Service Removal**: Similar logic needed for service assignments

### **🚨 Critical Business Rules Discovered**
- **NO `unlocked_for_edits → draft` transition**: Once paid, CV cannot revert to draft (prevents money loss)
- **Paid CVs stay in review cycle**: Even if incomplete, manager keeps paid status and can fix issues
- **Validation warnings needed**: Users should be warned before making changes that affect status
- **Status transitions implemented**: `draft ↔ completed` only (safe transitions)

---

## 🔧 **IMPLEMENTATION PHASES**

### **Phase 1: Schema Update** ✅ **COMPLETED**
- [x] Update `expertCVs` table schema
- [x] Add new status values (7 statuses: draft, completed, payment_pending, paid, locked_for_review, unlocked_for_edits, locked_final)
- [x] Add timestamp fields
- [x] Add payment tracking fields
- [x] Add review tracking fields

### **Phase 2: Business Logic** ✅ **COMPLETED**
- [x] Create validation functions (`validateCVCompletion`, `canTransitionStatus`, `canEditServices`, `canEditCVContent`)
- [x] Create transition validation
- [x] Update CV creation logic
- [x] Update CV update logic (`updateCV` mutation for experience/education)

### **Phase 3: Edit Page** ✅ **COMPLETED**
- [x] Update status display logic
- [x] Add conditional editing (services locked after payment, CV content editable in specific statuses)
- [x] Add status-specific buttons (Save, Resubmit for Review)
- [x] Add validation warnings
- [x] Add Experience and Education UI sections with add/remove/edit functionality
- [x] Implement `$state()` + `$effect()` pattern for local mutable data

### **Phase 4: Checkout Flow**
- [ ] Update payment initiation
- [ ] Add payment status tracking
- [ ] Handle payment success/failure
- [ ] Update status transitions

### **Phase 5: Admin Review**
- [ ] Update review dashboard
- [ ] Add review actions
- [ ] Handle review feedback
- [ ] Manage review cycles

### **Phase 6: User Management**
- [ ] Update expert table display
- [ ] Add status filtering
- [ ] Update status colors
- [ ] Add status actions

### **Phase 7: Production Validation Notifications** 🚀 **FUTURE**
- [ ] Add validation warning modals before status-changing actions
- [ ] "Are you sure?" confirmation for `completed → draft` transitions
- [ ] Clear messaging about impact of removing required fields
- [ ] Prevent accidental data loss with user-friendly warnings

---

## 🔔 **VALIDATION NOTIFICATION REQUIREMENTS** (Production)

### **Status Transition Warnings**

**`completed → draft` Warning:**
```typescript
// When user removes required fields from completed CV
const showDraftWarning = (currentStatus: string, validation: ValidationResult) => {
  if (currentStatus === 'completed' && !validation.isValid) {
    return {
      title: "Profile Incomplete",
      message: "Removing this field will make your profile incomplete and revert it to draft status. You'll need to complete it again before payment.",
      confirmText: "Yes, revert to draft",
      cancelText: "Keep profile complete",
      action: "completed_to_draft"
    };
  }
};
```

**`unlocked_for_edits` Validation Warning:**
```typescript
// When user makes CV incomplete after reviewer feedback
const showIncompleteWarning = (validation: ValidationResult) => {
  if (!validation.isValid) {
    return {
      title: "Profile Incomplete",
      message: "Your profile is missing required information. You can still edit, but you'll need to complete it before resubmitting for review.",
      showValidationErrors: true,
      preventResubmit: true
    };
  }
};
```

### **UI Behavior Rules**

| Status | Validation State | Action | Warning Required |
|--------|------------------|--------|------------------|
| `completed` | Invalid | Save | ✅ "Revert to draft?" |
| `unlocked_for_edits` | Invalid | Save | ⚠️ "Profile incomplete" |
| `unlocked_for_edits` | Invalid | Resubmit | ❌ Disabled button |
| `draft` | Invalid | Save | ℹ️ Show validation errors |

### **Implementation Notes**
- **Prototype**: Skip validation notifications for faster development
- **Production**: Implement all warnings to prevent user confusion and data loss
- **Accessibility**: Ensure warnings are screen-reader friendly
- **Mobile**: Design warnings to work well on mobile devices

---

## 🚨 **ERROR HANDLING**

### **Payment Failures**
- Payment timeout → `payment_failed` status
- Payment declined → `payment_failed` status
- Payment refund → `completed` status (if business allows)

### **Review Failures**
- Reviewer unavailable → Auto-unlock after timeout
- System errors → Log and notify admin
- Data corruption → Restore from backup

### **Validation Failures**
- Invalid data → Revert to previous status
- Missing fields → Show specific error messages
- Permission errors → Log and notify user

---

## 📊 **AUDIT TRAIL REQUIREMENTS**

### **Status Change Logging**
```typescript
interface StatusChangeLog {
  cvId: string;
  fromStatus: CVStatus;
  toStatus: CVStatus;
  changedAt: number;
  changedBy: string;
  reason?: string;
  notes?: string;
}
```

### **Required Logging Points**
- Every status transition
- Payment events
- Review decisions
- Validation failures
- System errors

---

## 🎯 **SUCCESS CRITERIA**

### **Phase 1 Complete When:**
- [ ] Schema updated successfully
- [ ] All existing CVs migrated to new schema
- [ ] No data loss during migration

### **Phase 2 Complete When:**
- [ ] All validation functions working
- [ ] Transition rules enforced
- [ ] Error handling implemented

### **Phase 3 Complete When:**
- [ ] Edit page shows correct status
- [ ] Conditional editing works
- [ ] Status-specific buttons functional

### **Phase 4 Complete When:**
- [ ] Payment flow integrated
- [ ] Status updates on payment
- [ ] Error handling for payments

### **Phase 5 Complete When:**
- [ ] Admin can review CVs
- [ ] Review feedback system works
- [ ] Review cycles functional

### **Phase 6 Complete When:**
- [ ] User management updated
- [ ] Status filtering works
- [ ] All statuses display correctly

---

## 🔍 **TESTING STRATEGY**

### **Unit Tests**
- [ ] Validation functions
- [ ] Transition logic
- [ ] Status calculations

### **Integration Tests**
- [ ] Payment flow
- [ ] Review process
- [ ] Status updates

### **End-to-End Tests**
- [ ] Complete CV workflow
- [ ] Admin review process
- [ ] Error scenarios

---

## 📝 **NOTES**

- All status changes must be atomic
- Payment status is separate from review status
- Review cycles can be repeated until final approval
- Final locked status is immutable for audit purposes
- All timestamps are in milliseconds since epoch
- User IDs and admin IDs must be validated before logging
