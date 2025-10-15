# Workplan: Organization-Expert Setup with Multi-Platform Workflow

## 📋 Project Overview

This workplan outlines the implementation of a sophisticated expert management system that spans multiple platforms (PDC, SPP, Academy) with complex approval workflows and status tracking.

## 🎯 Core Concepts

### **Platforms Involved**
1. **PDC (Platform for Data Collection)** - User master data
2. **SPP (Solution Provider Platform)** - Expert assignments and workflow management
3. **Academy** - Training and certification platform

### **Key Entities**
- **Organizations** - Solution Provider organizations
- **Users** - All users managed in PDC (simulated in our DB)
- **Staff Members** - Users with SPP platform access
- **Experts** - Users who can be assigned to organizations (linked via assignments)
- **Services** - Available services with versioning
- **Service Versions** - Specific versions of services with different rules
- **Organization Service Approvals** - SPP approval for specific service versions
- **Expert Assignments** - Links experts to organizations with service versions
- **Workflow States** - Draft → Submitted → Under Review → Training → Certified → Active

## 🏗️ Database Schema Design

### **Convex Tables**

```typescript
// Organizations table
interface Organization {
  _id: Id<"organizations">;
  name: string;
  type: "solution_provider" | "zdhc_staff";
  contactEmail: string;
  status: "active" | "inactive" | "suspended";
  createdAt: number;
  updatedAt: number;
}

// Users table (simulating PDC user data)
interface User {
  _id: Id<"users">;
  pdcId: string; // External PDC user ID (for future integration)
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  phone?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

// Staff Members table (users with SPP platform access)
interface StaffMember {
  _id: Id<"staff_members">;
  userId: Id<"users">; // Reference to User
  organizationId: Id<"organizations">;
  role: "admin" | "manager" | "viewer";
  permissions: string[];
  isActive: boolean;
  joinedAt: number;
  lastLoginAt?: number;
}

// Services table (with versioning)
interface Service {
  _id: Id<"services">;
  name: string;
  description: string;
  currentVersion: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

// Service Versions table
interface ServiceVersion {
  _id: Id<"service_versions">;
  serviceId: Id<"services">;
  version: string; // e.g., "1.0", "2.0", "2.1"
  rules: string; // Service-specific rules/requirements
  requirements: string[]; // Training requirements
  isActive: boolean;
  releasedAt: number;
  deprecatedAt?: number;
}

// Organization Service Approvals table
interface OrganizationServiceApproval {
  _id: Id<"organization_service_approvals">;
  organizationId: Id<"organizations">;
  serviceVersionId: Id<"service_versions">;
  status: "pending" | "approved" | "rejected" | "suspended";
  approvedAt?: number;
  approvedBy?: string; // ZDHC Admin ID
  expiresAt?: number;
  notes?: string;
  rejectionReason?: string;
}

// Expert Assignments table (links users to organizations as experts)
interface ExpertAssignment {
  _id: Id<"expert_assignments">;
  userId: Id<"users">; // Reference to User (who is the expert)
  organizationId: Id<"organizations">;
  serviceVersionId: Id<"service_versions">; // Specific service version
  
  // SPP-specific data
  services: ServiceAssignment[]; // Services within this version
  experience: Experience[];
  education: Education[];
  
  // Workflow status
  status: "draft" | "submitted" | "under_review" | "training" | "certified" | "active" | "rejected";
  
  // Workflow tracking
  submittedAt?: number;
  reviewedAt?: number;
  reviewedBy?: Id<"users">; // ZDHC Admin user ID
  trainingStartedAt?: number;
  trainingCompletedAt?: number;
  certifiedAt?: number;
  activatedAt?: number;
  
  // Assignment metadata
  assignedAt: number;
  assignedBy: Id<"users">; // SPP Admin user ID
  notes?: string;
  
  // Rejection handling
  rejectionReason?: string;
  rejectionNotes?: string;
  
  // Version-specific data
  cvVersion?: string; // CV version for this assignment
  requiresNewTraining?: boolean; // Whether expert needs new training for this version
}

// Workflow History table (audit trail)
interface WorkflowHistory {
  _id: Id<"workflow_history">;
  assignmentId: Id<"expert_assignments">;
  fromStatus: string;
  toStatus: string;
  actionBy: string; // User ID who performed the action
  actionAt: number;
  notes?: string;
  metadata?: Record<string, any>;
}

// Services table
interface Service {
  _id: Id<"services">;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: number;
}

// User Sessions table (for organization context)
interface UserSession {
  _id: Id<"user_sessions">;
  userId: Id<"users">; // Reference to user
  staffMemberId: Id<"staff_members">; // Reference to staff member role
  organizationId: Id<"organizations">;
  sessionToken: string;
  expiresAt: number;
  createdAt: number;
}
```

## 🔄 Service Versioning & Approval Workflow

### **Service Version Lifecycle**

```
Service Created → Version 1.0 Released → Organizations Apply → Approval Process
     ↓                    ↓                      ↓              ↓
New Rules Added → Version 2.0 Released → Re-approval Required → New Training
```

### **Service Version Rules**

1. **Service Evolution** - Services get new versions with updated rules
2. **Organization Approval** - SPPs must be approved for each service version
3. **Expert Re-qualification** - Experts may need new training for new versions
4. **CV Updates** - New versions may require updated CVs/credentials
5. **Training Requirements** - Most experts need Academy training for new versions

### **Service Version Workflow**

1. **ZDHC creates new service version** (e.g., ETP Assessment 2.0)
2. **SPP organizations apply** for approval for the new version
3. **ZDHC reviews and approves** SPP organizations
4. **SPP can now assign experts** to the new service version
5. **Experts go through workflow** (CV check → Training → Certification)
6. **Experts become active** for the new service version

### **Version-Specific Expert Assignment**

- **Same expert, different version** = New assignment required
- **Previous certifications** may not apply to new versions
- **Training requirements** may be different per version
- **CV updates** may be required for new versions

## 🔄 Workflow States & Transitions

### **Expert Assignment Lifecycle**

```
[DRAFT] → [SUBMITTED] → [UNDER_REVIEW] → [TRAINING] → [CERTIFIED] → [ACTIVE]
    ↓           ↓              ↓             ↓            ↓
[REJECTED] ← [REJECTED] ← [REJECTED] ← [FAILED] ← [EXPIRED]
```

### **Status Definitions**

1. **DRAFT** - Expert being prepared by SPP Admin
2. **SUBMITTED** - Ready for ZDHC Admin review
3. **UNDER_REVIEW** - ZDHC Admin reviewing CV/credentials
4. **TRAINING** - Expert invited to Academy for training
5. **CERTIFIED** - Training completed, certification received
6. **ACTIVE** - Expert can provide services for this SPP
7. **REJECTED** - Assignment rejected at any stage
8. **FAILED** - Training failed
9. **EXPIRED** - Certification expired

### **Status Transitions & Permissions**

| From Status | To Status | Who Can Do It | Required Actions |
|-------------|-----------|---------------|------------------|
| DRAFT | SUBMITTED | SPP Admin | Complete all required fields |
| SUBMITTED | UNDER_REVIEW | ZDHC Admin | Acknowledge submission |
| UNDER_REVIEW | TRAINING | ZDHC Admin | Approve CV, send to Academy |
| UNDER_REVIEW | REJECTED | ZDHC Admin | Provide rejection reason |
| TRAINING | CERTIFIED | Academy System | Training completed |
| TRAINING | FAILED | Academy System | Training failed |
| CERTIFIED | ACTIVE | SPP Admin | Activate expert |
| CERTIFIED | EXPIRED | System | Certification expired |
| ACTIVE | EXPIRED | System | Certification expired |

## 👥 Access Control & User Types

### **User Types**

1. **Users** - All users managed in PDC (simulated in our DB)
   - **Master Data**: firstName, lastName, email, country, phone
   - **Can be**: Staff members, experts, or both
   - **Authentication**: PDC system (simulated)

2. **Staff Members** - Users with SPP platform access
   - **Access**: Full SPP platform access
   - **Roles**: Admin, Manager, Viewer
   - **Organization**: Belongs to specific organization
   - **Can also be**: Experts (dual role)

3. **Experts** - Users assigned to organizations as experts
   - **Access**: No SPP platform access (unless also staff member)
   - **Assignment**: Linked to organizations via ExpertAssignment
   - **Training**: Academy platform access
   - **Can be**: Same person as staff member

### **Access Control Rules**

1. **SPP Staff** - Can only see/manage their organization's data
2. **ZDHC Staff** - Can see all organizations and manage approvals
3. **Experts** - Cannot access SPP platform (unless also staff member)
4. **Cross-organization** - Staff cannot see other organizations' data
5. **Dual role users** - Staff members can also be experts for their organization

## 🎨 UI/UX Design

### **Organization Context**
- **Header dropdown** - "Working as: [Organization Name]"
- **User indicator** - Show current user and role
- **Organization switching** - Easy switching between organizations
- **Service version selector** - Choose which service version to work with

### **Expert Management Dashboard**
- **Status-based tabs** - Draft, Submitted, Under Review, Training, Certified, Active
- **Status indicators** - Color-coded badges for each status
- **Progress tracking** - Visual workflow progress
- **Bulk actions** - Select multiple experts for batch operations

### **Expert Assignment Form**
- **Step 1-5** - Existing wizard (unchanged)
- **Step 6** - Review & Submit
- **Draft mode** - Save as draft, continue later
- **Submission** - Final review before submitting to ZDHC

### **Status Management**
- **Status history** - Show all status changes with timestamps
- **Action buttons** - Context-sensitive actions based on current status
- **Notifications** - Alert when status changes
- **Comments** - Add notes at each status change

## 🔧 Technical Implementation

### **Phase 1: Convex Setup & Migration**
1. **Install Convex** following [Svelte quickstart](https://docs.convex.dev/quickstart/svelte)
2. **Create database schema** with all tables
3. **Migrate existing data** from localStorage to Convex
4. **Update expert store** to use Convex queries/mutations
5. **Add organization context** to all components

### **Phase 2: Workflow Implementation**
1. **Status management system** - Enforce valid transitions
2. **Workflow history tracking** - Audit trail for all changes
3. **Permission system** - Role-based access control
4. **Notification system** - Real-time status updates

### **Phase 3: UI Enhancements**
1. **Status-based filtering** - Filter experts by workflow status
2. **Progress indicators** - Visual workflow progress
3. **Bulk operations** - Batch status changes
4. **Advanced search** - Search across all expert data

### **Phase 4: Integration Preparation**
1. **PDC API integration** - Replace mock PDC with real API
2. **Academy API integration** - Connect to training platform
3. **Email notifications** - Automated workflow notifications
4. **Export/Import** - Data backup and restore

## 📊 Data Flow Architecture

### **Expert Assignment Flow**
```
SPP Admin → Create Assignment → Draft Status
         → Complete Data → Submit → Submitted Status
         → ZDHC Admin Review → Under Review Status
         → Approve → Send to Academy → Training Status
         → Academy Completion → Certified Status
         → SPP Admin Activate → Active Status
```

### **Cross-Platform Data Sync**
```
PDC (User Master) ←→ SPP (Assignments) ←→ Academy (Training)
     ↓                    ↓                      ↓
[User Data]        [Workflow Status]      [Certification]
```

## 🎯 Key Features to Implement

### **Core Features**
- [ ] Organization context switching
- [ ] Expert assignment creation (5-step wizard)
- [ ] Draft mode with auto-save
- [ ] Status-based expert filtering
- [ ] Workflow history tracking
- [ ] Real-time status updates
- [ ] Role-based permissions

### **Advanced Features**
- [ ] Bulk expert operations
- [ ] Advanced search and filtering
- [ ] Export/import functionality
- [ ] Email notifications
- [ ] Dashboard analytics
- [ ] Audit logging

### **Integration Features**
- [ ] PDC API integration
- [ ] Academy API integration
- [ ] Email service integration
- [ ] File upload for CVs
- [ ] Document management

## 🚨 Business Rules

### **Assignment Rules**
1. **One expert per organization per service version** - Each expert can only have one active assignment per organization per service version
2. **Service-specific roles** - LEAD/Regular roles are per-service within an assignment
3. **Draft validation** - Must complete all required fields before submission
4. **Status enforcement** - Only valid status transitions are allowed
5. **Service version requirement** - Assignments must specify service version
6. **Organization approval required** - SPP must be approved for service version before assigning experts

### **Service Version Rules**
1. **Version-specific assignments** - Same expert needs separate assignment for each service version
2. **Organization approval** - SPPs must be approved for each service version
3. **Training requirements** - New versions may require new Academy training
4. **CV updates** - New versions may require updated CVs/credentials
5. **Certification validity** - Previous certifications may not apply to new versions

### **Permission Rules**
1. **SPP Admins** - Can create, edit, submit, and activate experts
2. **ZDHC Admins** - Can review, approve, reject, and send to training
3. **Academy System** - Can update training status and certification
4. **Viewers** - Can only view expert data

### **Data Rules**
1. **PDC data is read-only** - Cannot modify user master data
2. **SPP data is editable** - Experience, education, services can be modified
3. **Workflow data is immutable** - Status changes create history records
4. **Organization isolation** - Experts are filtered by selected organization

## 📅 Implementation Timeline

### **Week 1: Foundation**
- Convex setup and database schema
- Basic organization context
- Data migration from localStorage

### **Week 2: Core Workflow**
- Expert assignment creation
- Status management system
- Basic UI updates

### **Week 3: Advanced Features**
- Workflow history tracking
- Status-based filtering
- Real-time updates

### **Week 4: Polish & Testing**
- UI/UX improvements
- Error handling
- Testing and bug fixes

## 🔍 Testing Strategy

### **Unit Tests**
- Status transition validation
- Permission checks
- Data validation

### **Integration Tests**
- Cross-platform data sync
- Workflow completion
- Error handling

### **User Acceptance Tests**
- Complete expert assignment workflow
- Organization switching
- Status management

## 📝 Documentation Updates

### **Required Updates**
- [ ] Update Business Rules.md with new workflow rules
- [ ] Update LLM Instructions.md with new architecture
- [ ] Create API documentation for Convex functions
- [ ] Create user guide for workflow management

## 🎯 Success Criteria

### **Functional Requirements**
- [ ] Experts can be assigned to multiple organizations
- [ ] Complete workflow from draft to active
- [ ] Real-time status updates across browser tabs
- [ ] Proper permission enforcement

### **Non-Functional Requirements**
- [ ] Fast response times (< 200ms for queries)
- [ ] Real-time updates (< 1 second delay)
- [ ] 99.9% uptime for Convex backend
- [ ] Mobile-responsive UI

---

**Last Updated**: [Current Date]
**Version**: 1.0
**Status**: Planning Phase
**Next Steps**: Begin Phase 1 implementation
