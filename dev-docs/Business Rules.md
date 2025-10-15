# Business Rules - ZDHC Solution Provider Platform (SPP)

## 📋 Document Purpose

This document contains **ALL business rules** implemented in the ZDHC Solution Provider Platform. These rules govern data ownership, user workflows, legal compliance, and system behavior. Use this as the **definitive reference** for all development decisions.

---

## 🏢 Platform Overview

### Core Concept
The SPP manages **Solution Provider organizations** and their **expert teams** who provide services to ZDHC members. Organizations must become **ZDHC Approved Solution Providers** to offer services.

### Key Entities
- **ZDHC Staff**: Internal platform administrators and managers
- **Solution Providers**: External organizations providing specific services
- **Experts**: Individual professionals who provide services (can work for multiple organizations)
- **Service Versions**: Specific expertise areas with versioning (ETP Assessment V1, Supplier Assessment V2, etc.)
- **Staff Members**: Users with SPP platform access (admin/manager/viewer roles)

---

## 🏢 Organization Management Rules

### Rule 1: Multi-Organization Support
**Statement**: Users can work as different organizations with complete data isolation
**Implementation**:
- Organization switcher in header allows switching between organizations
- All expert data is filtered by currently selected organization
- Data persistence across browser sessions using localStorage
- Clear visual indication of current organization context

### Rule 2: Organization Context Switching
**Statement**: Users must select an organization before accessing expert data
**Implementation**:
- Header displays current organization name and user role
- User management page shows "No Organization Selected" when none chosen
- Organization switcher dropdown shows all available organizations
- Status indicators show organization type (SPP/ZDHC) and status (active/inactive/suspended)

### Rule 3: Data Isolation
**Statement**: Each organization can only see and manage their own expert data
**Implementation**:
- Expert queries automatically filter by selected organization
- No cross-organization data visibility
- Organization-specific expert counts and statistics
- Clear messaging when no experts exist for selected organization

---

## 👥 User Management Rules

### Rule 4: Staff Member Roles
**Statement**: Users have different access levels based on their role in the organization
**Implementation**:
- **Admin**: Full access to manage experts and organization settings
- **Manager**: Can manage experts but limited organization settings
- **Viewer**: Read-only access to expert data
- Role-based permission system with granular controls

### Rule 5: Expert Assignment Workflow
**Statement**: Expert assignments link users to organizations with specific service versions
**Implementation**:
- Expert assignments require user, organization, and service version
- Status tracking through complete workflow lifecycle
- Professional experience and education data per assignment
- Assignment metadata (assigned by, assigned at, notes)

---

## 🎯 Service Version Management Rules

### Rule 6: Service Versioning System
**Statement**: Services are organized in parent-child relationships with versioning
**Implementation**:
- **Service Parents**: High-level categories (e.g., "Assessment Approval")
- **Service Versions**: Specific versions (e.g., "Supplier to Zero Assessment V2")
- Organizations must be approved for each service version
- Expert assignments are tied to specific service versions

### Rule 7: Organization Service Approvals
**Statement**: Organizations must be approved for each service version before assigning experts
**Implementation**:
- Approval workflow: pending → approved/rejected → suspended
- Approval tracking with timestamps and approver information
- Expiration dates for approvals
- Rejection reasons and notes for transparency

---

## 🔄 Expert Workflow Rules

### Rule 8: Expert Assignment Status Lifecycle
**Statement**: Expert assignments follow a defined workflow with status tracking
**Implementation**:
- **Draft**: Expert being prepared by SPP Admin
- **Paid**: Payment completed for training
- **Ready for Training**: Approved for Academy training
- **Training Started**: Training in progress
- **Training Completed**: Training finished successfully
- **Approved**: Expert certified and active
- **Rejected**: Assignment rejected at any stage
- **Inactive**: Assignment deactivated

### Rule 9: Workflow Timestamp Tracking
**Statement**: All workflow transitions must be tracked with timestamps and responsible parties
**Implementation**:
- Each status change records timestamp and user ID
- Workflow history maintained for audit purposes
- Clear tracking of who performed each action
- Rejection reasons and notes for transparency

---

## 📊 Data Management Rules

### Rule 10: Convex Database Integration
**Statement**: All data is stored in Convex with real-time synchronization
**Implementation**:
- Real-time queries automatically update UI when data changes
- Optimistic updates for immediate user feedback
- Error handling for network issues
- Type-safe database schema with validation

### Rule 11: Data Structure Requirements
**Statement**: Expert assignments must include complete professional information
**Implementation**:
- Professional experience array with job details
- Education array with academic credentials
- Service version assignment with specific version
- Organization context and assignment metadata

### Rule 12: Data Persistence
**Statement**: Organization selection persists across browser sessions
**Implementation**:
- localStorage stores current organization ID
- Automatic restoration on page load
- Graceful fallback when organization no longer exists
- Clear error handling for invalid stored data

---

## 🎨 User Interface Rules

### Rule 13: Organization Switcher Design
**Statement**: Organization switching must be intuitive and accessible
**Implementation**:
- Dropdown in header with organization list
- Visual indicators for organization type and status
- Current organization clearly highlighted
- Click-outside-to-close functionality
- Loading states and error handling

### Rule 14: Status-Based Visual Design
**Statement**: Expert status must be visually distinct and informative
**Implementation**:
- Color-coded status badges (green=active, blue=certified, yellow=training, etc.)
- Status text with proper formatting (replace underscores with spaces)
- Clear visual hierarchy for different statuses
- Consistent styling across all components

### Rule 15: Responsive Design
**Statement**: All interfaces must work on mobile and desktop
**Implementation**:
- Mobile-first CSS approach with Tailwind CSS
- Responsive grid layouts for expert cards
- Touch-friendly button sizes
- Readable text on all screen sizes

---

## 🔧 Technical Implementation Rules

### Rule 16: Svelte 5 Runes Usage
**Statement**: All reactive state must use Svelte 5 runes
**Implementation**:
- Use `$state()` for reactive variables
- Use `$derived()` for computed values
- Use `$effect()` for side effects
- Use `$props()` for component props
- Avoid legacy `$:` syntax

### Rule 17: TypeScript Type Safety
**Statement**: All code must be fully type-safe with no `any` types
**Implementation**:
- Strict TypeScript configuration
- Proper interfaces for all data structures
- Type-safe Convex queries and mutations
- End-to-end type safety from database to UI

### Rule 18: Error Handling
**Statement**: All operations must have proper error handling and user feedback
**Implementation**:
- Graceful fallbacks for network errors
- Clear error messages for users
- Loading states during async operations
- Validation errors with actionable feedback

---

## 🧪 Development & Testing Rules

### Rule 19: Test Data Seeding
**Statement**: Development uses comprehensive test data for realistic testing
**Implementation**:
- Three test organizations with different scenarios
- Sample users with realistic professional data
- Various expert statuses for testing workflow
- Easy data reset and reseeding functionality

### Rule 20: Development Tools
**Statement**: Development environment must support efficient iteration
**Implementation**:
- Convex test page for database operations
- Data seeding and clearing functions
- Real-time query testing
- Error logging and debugging tools

---

## 🚨 Business Logic Rules

### Rule 21: Organization Approval Requirements
**Statement**: Organizations must be approved for service versions before expert assignment
**Implementation**:
- Expert assignments require valid organization service approval
- Status checking before allowing expert creation
- Clear error messages when approvals are missing
- Workflow prevents invalid assignments

### Rule 22: Expert Assignment Validation
**Statement**: Expert assignments must have complete required information
**Implementation**:
- User, organization, and service version are required
- Professional experience and education must be provided
- Assignment metadata must be complete
- Validation at both UI and database levels

---

## 🔮 Future Enhancement Rules

### Rule 23: API Integration Preparation
**Statement**: Current implementation must be replaceable with real APIs
**Implementation**:
- Mock functions clearly separated from real logic
- API call patterns established for easy replacement
- Error handling prepared for network issues
- Data transformation ready for real endpoints

### Rule 24: Scalability Considerations
**Statement**: System must handle growth in users, organizations, and services
**Implementation**:
- Efficient state management with Svelte stores
- Component-based architecture for reusability
- Performance optimization for large datasets
- Modular design for easy feature additions

---

## 📝 Change Management

### Rule 25: Business Rule Updates
**Statement**: All business rule changes must be documented here
**Implementation**:
- Update this document when rules change
- Version control all rule modifications
- Communicate changes to development team
- Maintain rule traceability

### Rule 26: Rule Validation
**Statement**: All implementations must be validated against these rules
**Implementation**:
- Code reviews must check rule compliance
- Testing must verify rule adherence
- Documentation must reflect current rules
- Regular rule audits recommended

---

**Last Updated**: December 2024
**Version**: 2.0
**Maintainer**: Development Team

> **Important**: This document reflects the current implementation of the SPP application with organization switching, service versioning, and workflow management. Any changes to application behavior must be reflected here first.