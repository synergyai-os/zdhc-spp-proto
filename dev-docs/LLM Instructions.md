# LLM Instructions - ZDHC Solution Provider Platform

## 🎯 Project Overview

This is a **Solution Provider Platform** for ZDHC (Zero Discharge of Hazardous Chemicals) that manages staff members and Solution Provider experts across different services. The platform allows organizations to become ZDHC Approved Solution Providers and manage their expert teams.

### Key Concepts

- **ZDHC Staff**: Internal platform administrators and managers
- **Solution Providers**: External organizations providing specific services
- **Experts**: Individual professionals who provide services (can work for multiple services)
- **Services**: Specific expertise areas (ETP Assessment, Supplier Assessment, Chemical Management, etc.)
- **LEAD Experts**: Each service must have at least one designated lead expert

## 🛠️ Tech Stack

### Core Framework

- **Svelte 5** - Latest version with modern syntax (`$props()`, `$derived()`, etc.)
- **SvelteKit** - Full-stack framework with file-based routing
- **TypeScript** - Full type safety throughout the application
- **Node.js** - Runtime and package manager

### Styling & UI

- **Tailwind CSS 4.1.14** - Utility-first CSS framework
- **@tailwindcss/forms** - Enhanced form styling
- **Responsive design** - Mobile-first approach

### Development Tools

- **ESLint** - Code linting with Svelte-specific rules
- **Prettier** - Code formatting
- **Context7 MCP** - For up-to-date documentation and best practices
- **Convex** - Backend-as-a-service for real-time database and serverless functions

## 📁 Project Structure

```
src/
├── lib/
│   └── components/           # Reusable UI components
│       ├── Header.svelte           # Navigation and branding
│       ├── UserCard.svelte         # User display component
│       ├── ServiceBox.svelte       # Service section container
│       ├── ActionCard.svelte       # Dashboard action cards
│       ├── ToggleSwitch.svelte     # Service approval toggle component
│       ├── OrganizationSwitcher.svelte # Organization selection dropdown
│       └── admin/                  # Admin-specific components
│           ├── CVReviewTable.svelte    # CV review table with filtering
│           └── CVDetailView.svelte     # Individual CV review component
├── convex/                  # Convex backend functions
│   ├── schema.ts           # Database schema definition
│   ├── expertCVs.ts        # CV versioning and management
│   ├── expertServiceAssignments.ts # Service assignment management
│   ├── adminCVReview.ts    # Admin CV review queries and mutations
│   ├── utilities.ts        # Common utility functions
│   └── _generated/         # Auto-generated API files
├── routes/
│   ├── +layout.svelte       # Root layout with Convex setup
│   ├── +page.svelte         # Homepage dashboard
│   ├── admin/                # Admin CV review system
│   │   ├── +page.svelte     # CV review dashboard
│   │   └── cv/
│   │       └── [userId]/
│   │           └── +page.svelte # Individual CV review page
│   ├── checkout/              # Expert checkout and payment flow
│   │   ├── +page.svelte       # Checkout selection page
│   │   ├── payment/
│   │   │   └── +page.svelte   # Payment details page
│   │   └── confirmation/
│   │       └── +page.svelte   # Payment confirmation page
│   ├── approved-services/   # Service approval management
│   │   └── +page.svelte     # Service approval toggle interface
│   ├── test-convex/         # Database testing page
│   ├── test-service-versioning/ # Service versioning testing
│   │   └── +page.svelte     # Service data seeding and testing
│   └── user-management/
│       ├── +page.svelte     # User management main page
│       ├── add-expert/
│       │   ├── +page.svelte # Add/Edit expert wizard
│       │   └── success/
│       │       └── +page.svelte # Expert creation success page
│       └── experts/
│           └── [expertId]/
│               ├── edit/
│               │   └── +page.svelte # Expert edit page
│               └── cv-history/
│                   └── +page.svelte # CV version history view
├── app.css                  # Tailwind CSS imports
└── app.html                 # HTML template
```

## 🎨 Design System

### Color Scheme

- **Primary Blue**: `blue-500`, `blue-600` (buttons, links)
- **Success Green**: `green-500`, `green-600` (success states)
- **Warning Yellow**: `yellow-200`, `yellow-800` (LEAD expert badges)
- **Neutral Grays**: `gray-100` to `gray-800` (backgrounds, text)
- **Service Colors**: Green (ETP), Purple (Supplier), Orange (Chemical)

### Component Patterns

- **Cards**: White background, gray borders, subtle shadows
- **Buttons**: Rounded corners, hover effects, consistent spacing
- **Forms**: Clean inputs with focus states, proper labels
- **Badges**: Small rounded pills for status indicators

## 🏗️ Architecture Principles

### 1. Component-First Approach

- **Reusable components** in `/lib/components/`
- **Single responsibility** - each component has one clear purpose
- **TypeScript interfaces** for all props
- **Accessibility first** - proper labels, ARIA attributes

### 2. Svelte 5 Best Practices (Runes Mode)

- Use `$state()` for reactive variables (replaces `let`)
- Use `$derived()` for computed values (replaces `$:`)
- Use `$props()` for component props
- Use `$effect()` for side effects (not for derived state)
- Use `{@render children()}` for slot content
- Prefer `onsubmit` over `on:submit` (new syntax)
- Deep reactivity: objects and arrays are automatically reactive
- Avoid `$:` syntax - use runes instead

#### Store Management in Svelte 5

**CRITICAL**: When creating stores in `.svelte.ts` files:

1. **Use `$state()` for reactive objects** instead of `writable()`:
   ```typescript
   // ✅ CORRECT - Modern Svelte 5 pattern
   export const organizationState = $state({
     currentOrganization: null,
     isLoading: false,
     // methods and getters...
   });
   
   // ❌ WRONG - Old Svelte 4 pattern
   export const organizationStore = writable({...});
   ```

2. **Export functions, not `$derived` values**:
   ```typescript
   // ✅ CORRECT - Export functions
   export const currentOrganizationName = () => organizationState.organizationName;
   
   // ❌ WRONG - Cannot export $derived from modules
   export const currentOrganizationName = $derived(organizationState.organizationName);
   ```

3. **Use function calls in components, not `$` prefix**:
   ```svelte
   <!-- ✅ CORRECT - Call functions directly -->
   <script>
     let orgName = $derived(currentOrganizationName() || 'No Organization');
   </script>
   
   <!-- ❌ WRONG - Functions don't have subscribe method -->
   <script>
     let orgName = $derived($currentOrganizationName || 'No Organization');
   </script>
   ```

4. **Store compatibility**: Provide legacy store interface for backward compatibility:
   ```typescript
   export const organizationStore = {
     subscribe: (callback) => { callback(organizationState); return () => {}; },
     // delegate methods...
   };
   ```

5. **Convex conditional queries**: Use fallback IDs instead of "skip" or undefined:
   ```typescript
   // ✅ CORRECT - Use fallback organization ID
   const expertCVs = useQuery(
     api.expertCVs.getExpertCVs,
     () => currentOrgId ? { organizationId: currentOrgId } : { organizationId: 'fallback-id' }
   );
   
   // ❌ WRONG - "skip" not supported by convex-svelte
   const expertCVs = useQuery(api.expertCVs.getExpertCVs, () => "skip");
   ```

6. **Organization validation**: Include validate getter for component validation:
   ```typescript
   export const organizationState = $state({
     // ... other properties
     get validate() {
       if (this.isLoading) return { isValid: false, message: 'Loading...', isLoading: true, error: null };
       if (this.error) return { isValid: false, message: this.error, isLoading: false, error: this.error };
       if (!this.currentOrganization) {
         return { isValid: false, message: 'Please select an organization.', isLoading: false, error: 'No organization selected' };
       }
       return { isValid: true, message: 'Organization context is valid.', isLoading: false, error: null };
     }
   });
   ```

### 3. File-Based Routing

- **Nested routes** for logical hierarchy (`/user-management/add-expert`)
- **Layout inheritance** - Header component shared across all pages
- **Dynamic imports** for code splitting

## 📋 Current Features

### Homepage Dashboard

- **Hero section** with platform branding
- **Action cards** for main workflows (Get Approved, Market Services, Manage Requests)
- **Sidebar sections** for Important News and Feedback
- **Responsive layout** with Tailwind grid system

### User Management

- **Staff section** - Display ZDHC internal staff
- **Saved Experts section** - Display experts from Convex database
- **Expert cards** - Avatar, name, email, services, organization, status, assignment date
- **Loading states** - Spinner and error handling for database queries
- **Real-time updates** - Reactive display when experts are added via Convex
- **Services section** - Expert lists organized by service type
- **LEAD expert highlighting** - Yellow background and badges
- **Multi-service indicators** - Blue badges for experts in multiple services
- **Single "Add Expert" button** - Clean UX with one action point

### Service Approval Management

- **Approved Services page** - Manage service approvals for organizations
- **Service toggle interface** - Real-time approval status toggles
- **Organization context** - Services filtered by selected organization
- **Service grouping** - Parent-child service relationships (e.g., Assessment Approval → Supplier to Zero Assessment V2)
- **Approval status tracking** - Visual indicators for approved/rejected services
- **Real-time updates** - Instant UI updates when approval status changes
- **Loading states** - Context-aware loading messages and error handling
- **Data consistency** - Synchronized data between user management and approval pages

### Add Expert Wizard (5-Step Process) - UPDATED FOR CV VERSIONING

- **Step 1: Email Lookup** - Check if user exists in PDC (external platform)
- **Step 2: Confirm PDC Data** - Display read-only user data (name, email, country)
- **Step 3: Select Services & Roles** - Badge system for service assignment with LEAD/Regular roles
- **Step 4: Professional Experience** - SPP-owned data for legal compliance (dynamic add/remove)
- **Step 5: Education** - SPP-owned data for legal compliance (dynamic add/remove)
- **Progress Tracker** - Visual indicator showing current step and progress (5 steps)
- **CV Creation** - Creates ExpertCV with version 1 and ExpertServiceAssignments
- **Invitation Flow** - Send ZDHC invitation if user not found (90-day expiry)
- **Data Governance** - PDC data is read-only, SPP owns experience/education data
- **Mock PDC Integration** - Simulated API for testing before real integration
- **Service Role Management** - Visual badges distinguish LEAD vs Regular experts per service
- **Legal Compliance** - Experience and education required for SPP legal responsibility
- **Persistent Save** - Expert CV and service assignments saved to Convex database
- **Success Feedback** - Confirmation message and redirect to user management
- **Database Integration** - Real-time data persistence with Convex backend
- **Organization Management** - Automatic creation of default organization
- **Data Validation** - Server-side validation with proper error handling

### Admin CV Review System - UPDATED FOR CV VERSIONING

- **CV Review Dashboard** - Admin interface at `/admin/` for reviewing expert CVs
- **Expert Table View** - One row per user showing their latest CV and service assignment statuses
- **Advanced Filtering** - Filter by status (submitted, pending_review, approved, rejected, locked), organization, and search by name/email
- **CV Detail Page** - Full CV review at `/admin/cv/[userId]` showing CV history, experience, education, and per-service approvals
- **Per-Service Approval** - Approve or reject individual service assignments linked to specific CV versions
- **CV Version Comparison** - Compare different CV versions to see what changed
- **Auto-Lock Logic** - CV automatically locks when all linked service assignments are decided
- **Review Tracking** - Track who reviewed, when, and add notes for each service assignment
- **Real-time Updates** - Automatic UI updates when approval status changes
- **Navigation Flow** - Previous/Next buttons for efficient review of multiple experts
- **Status Management** - Visual status indicators (submitted=yellow, pending_review=blue, approved=green, rejected=red, locked=gray)
- **Admin Notes** - Optional notes field for approval/rejection with predefined rejection reasons
- **Audit Trail** - Complete history of approval/rejection actions with timestamps and admin IDs

### Checkout and Payment Flow - NEW

- **Expert Selection** - Select experts and services for payment and review submission
- **Service Assignment Management** - Link selected services to expert CVs for review
- **Payment Processing** - Handle payment for CV review submissions
- **Status Updates** - Update CV status to 'submitted' and service assignments to 'pending_review'
- **Review Queue** - Submitted CVs appear in admin review dashboard
- **Payment Confirmation** - Confirmation page with submission details
- **Real-time Updates** - Automatic status updates across the platform

### CV History and Versioning - NEW

- **CV History View** - View all CV versions for a specific expert
- **Version Comparison** - Compare different CV versions to see changes
- **Timeline Display** - Chronological view of CV submissions and status changes
- **Edit Latest CV** - Edit the most recent CV version (if not locked)
- **New CV Creation** - Create new CV versions after review completion

## 🔄 Data Management (Implemented)

### Current State

- **Convex Database** for real-time data persistence ✅
- **TypeScript interfaces** for all data structures ✅
- **CRUD operations** - Add, update, remove, get experts ✅
- **Real-time updates** - Automatic UI updates when data changes ✅
- **Server-side validation** - Data validation at the database level ✅
- **Cross-session persistence** - Data survives browser restarts ✅

### Database Schema (NEW CV VERSIONING ARCHITECTURE)

- **Users table** - PDC user data (firstName, lastName, email, country)
- **Organizations table** - Solution provider organizations
- **Expert CVs table** - Versioned CV snapshots with experience/education data
- **Expert Service Assignments table** - Links specific CV versions to service versions for review
- **Service Parents/Versions** - Hierarchical service management
- **Organization Service Approvals** - Service approval workflow
- **Automatic timestamps** - Created/updated timestamps for all records
- **Type safety** - Full TypeScript support with Convex validation

### Convex Integration Features

- **Real-time queries** - Data updates automatically in the UI
- **Optimistic updates** - Immediate UI feedback with server sync
- **Error handling** - Graceful fallback for network issues
- **Loading states** - Proper loading indicators during data operations
- **Type safety** - End-to-end TypeScript from database to UI

## 🏪 Database Architecture

### Convex Backend (`/src/convex/`)

- **Schema Definition** - Type-safe database schema with validation
- **Query Functions** - Read operations for users, organizations, expert assignments
- **Mutation Functions** - Write operations for creating and updating data
- **Auto-generated API** - Type-safe client API generated from schema
- **Real-time subscriptions** - Automatic UI updates when data changes

### Database Tables

```typescript
// Users (simulating PDC data)
interface User {
	_id: Id<'users'>;
	firstName: string;
	lastName: string;
	email: string;
	country: string;
	phone?: string;
	isActive: boolean;
	createdAt: number;
	updatedAt: number;
}

// Organizations (Solution Providers)
interface Organization {
	_id: Id<'organizations'>;
	name: string;
	type: 'solution_provider' | 'zdhc_staff';
	contactEmail: string;
	status: 'active' | 'inactive' | 'suspended';
	createdAt: number;
	updatedAt: number;
}

// Service Parents (e.g., "Assessment Approval")
interface ServiceParent {
	_id: Id<'serviceParents'>;
	name: string;
	description: string;
	isActive: boolean;
	createdAt: number;
	updatedAt: number;
}

// Service Versions (e.g., "Supplier to Zero Assessment V2")
interface ServiceVersion {
	_id: Id<'serviceVersions'>;
	parentId: Id<'serviceParents'>;
	version: string; // "V1", "V2", etc.
	name: string; // "Supplier to Zero Assessment V2"
	description: string;
	isActive: boolean;
	releasedAt: number;
	deprecatedAt?: number;
	createdAt: number;
	updatedAt: number;
}

// Organization Service Approvals
interface OrganizationServiceApproval {
	_id: Id<'organizationServiceApprovals'>;
	organizationId: Id<'organizations'>;
	serviceVersionId: Id<'serviceVersions'>;
	status: 'pending' | 'approved' | 'rejected' | 'suspended';
	approvedBy?: string;
	approvedAt?: number;
	rejectedAt?: number;
	notes?: string;
	rejectionReason?: string;
	createdAt: number;
	updatedAt: number;
}

// Expert CVs (Versioned CV snapshots)
interface ExpertCV {
	_id: Id<'expertCVs'>;
	userId: Id<'users'>;
	organizationId: Id<'organizations'>;
	version: number; // Auto-increment per user+org (1, 2, 3, ...)
	
	// CV Content
	experience: Experience[];
	education: Education[];
	
	// Status Lifecycle: draft → submitted → locked
	status: 'draft' | 'submitted' | 'locked';
	
	// Timestamps
	createdAt: number;
	createdBy: string; // SPP Manager ID
	submittedAt?: number; // When payment processed
	paidAt?: number; // When payment confirmed
	lockedAt?: number; // When all services decided
	notes?: string;
}

// Expert Service Assignments (Links CV versions to specific services)
interface ExpertServiceAssignment {
	_id: Id<'expertServiceAssignments'>;
	userId: Id<'users'>;
	organizationId: Id<'organizations'>;
	expertCVId: Id<'expertCVs'>; // Reference to CV version
	serviceVersionId: Id<'serviceVersions'>; // Reference to service
	role: 'lead' | 'regular';
	
	// Review Status
	status: 'pending_review' | 'approved' | 'rejected' | 'inactive';
	
	// Review Metadata
	reviewedAt?: number;
	reviewedBy?: string; // ZDHC Admin ID
	approvedAt?: number;
	approvedBy?: string; // ZDHC Admin ID
	rejectedAt?: number;
	rejectedBy?: string; // ZDHC Admin ID
	rejectionReason?: string;
	reviewNotes?: string;
	
	// Metadata
	createdAt: number;
	assignedBy: string; // SPP Manager ID who created assignment
}
```

### Data Flow (NEW CV VERSIONING ARCHITECTURE)

```
Add Expert Wizard → Create ExpertCV + ServiceAssignments → Database → Real-time UI Updates
CV Editing → Update ExpertCV → Database → Real-time UI Updates
Service Review → Update ServiceAssignment Status → Auto-lock CV when complete → Real-time UI Updates
Checkout Flow → Submit ExpertCV + Update ServiceAssignments → Payment → Review Queue
```

### CV Versioning Architecture (NEW)

- **Versioned CVs** - Each expert CV is a snapshot that can be versioned
- **Service-Specific Assignments** - Individual services are approved/rejected per CV version
- **CV Lifecycle** - Draft → Submitted (Paid) → Locked (when all services decided)
- **Historical Tracking** - Complete audit trail of CV changes and service approvals
- **Re-submission Workflow** - New CV versions can be created after review completion
- **Template Copying** - New CV versions auto-copy from previous version for editing
- **Admin Comparison** - ZDHC Admins can compare CV versions during review

### Organization Context Management

- **Organization Store** - Centralized state management for current organization
- **Organization Switcher** - Header dropdown for switching between organizations
- **Conditional Queries** - Data loading only when organization is selected
- **Context-aware UI** - Different content based on selected organization
- **Persistent Selection** - Organization choice saved in localStorage

## 🎯 User Experience Guidelines

### Navigation

- **Header always visible** - consistent navigation across all pages
- **Breadcrumb-style URLs** - `/user-management/add-expert` is self-explanatory
- **Clear action buttons** - primary actions are obvious and accessible

### Form Design

- **Progressive disclosure** - show relevant fields based on context
- **Dynamic sections** - add/remove experience and education entries
- **Smart defaults** - pre-fill common values where appropriate
- **Validation feedback** - clear error messages and success states

### Expert Management

- **Visual hierarchy** - LEAD experts prominently displayed
- **Service organization** - experts grouped by service type
- **Multi-service tracking** - clear indicators for cross-service experts
- **Easy editing** - click to edit existing experts

## 🚀 Development Workflow

### Code Standards

- **TypeScript strict mode** - no `any` types allowed
- **ESLint compliance** - zero linting errors
- **Prettier formatting** - consistent code style
- **Component documentation** - clear prop interfaces

### Testing Approach

- **Manual testing** - verify functionality in browser
- **Responsive testing** - check mobile and desktop layouts
- **Accessibility testing** - ensure screen reader compatibility
- **Cross-browser testing** - verify compatibility

### Performance

- **Component lazy loading** - load components only when needed
- **Efficient re-renders** - use Svelte 5 reactivity properly
- **Optimized bundles** - Tree shaking and code splitting
- **Fast builds** - Optimized build process

## 📝 Common Patterns

### Adding New Pages

1. Create route file in appropriate directory
2. Import and use existing components where possible
3. Follow established layout patterns
4. Add navigation links to Header component
5. Ensure responsive design

### Creating New Components

1. Define TypeScript interfaces for props
2. Use Svelte 5 syntax (`$props()`, etc.)
3. Include accessibility attributes
4. Follow Tailwind CSS patterns
5. Add to `/lib/components/` directory

### Form Handling

1. Use `onsubmit` event handler (Svelte 5 syntax)
2. Prevent default form submission
3. Validate required fields
4. Provide user feedback
5. Handle success/error states

## 🔮 Future Enhancements

### Planned Features

- **Search and filtering** - Find experts by name, service, location
- **Drag and drop** - Reorder services, move experts
- **Bulk operations** - Select multiple experts for actions
- **Export functionality** - Download data as CSV/JSON
- **Real-time updates** - Instant updates across the application
- **Advanced validation** - Email format, phone number validation

### Scalability Considerations

- **Component library** - Build reusable UI component library
- **Database optimization** - Efficient queries and indexing with Convex
- **API integration** - Prepare for backend API integration
- **Performance optimization** - Implement virtual scrolling for large lists
- **Offline support** - Service worker for offline functionality
- **Multi-organization support** - Organization switcher and context management

## 🤝 Collaboration Guidelines

### For New Agents/LLMs

1. **Read this document first** - understand the project context and patterns
2. **Check existing components** - reuse rather than recreate
3. **Follow established patterns** - maintain consistency with existing code
4. **Update this document** - add new patterns, components, or decisions
5. **Test thoroughly** - verify functionality before considering complete

### Code Review Checklist

- [ ] TypeScript interfaces defined for all props
- [ ] Accessibility attributes included
- [ ] Responsive design implemented
- [ ] ESLint errors resolved
- [ ] Component follows established patterns
- [ ] Documentation updated if needed

## 📞 Context for Future Development

### Key Decisions Made

- **Node.js** - for reliable development and builds
- **Component architecture** - reusable components over monolithic pages
- **Convex Database** - Real-time backend-as-a-service for data persistence
- **Nested routing** - `/user-management/add-expert` for logical hierarchy
- **PDC Integration** - External platform for user data (mock for now, API later)
- **Data governance** - PDC owns default user data (read-only in SPP)
- **Multi-step wizards** - Step-by-step UX with progress tracking
- **90-day invitation expiry** - For users not yet in PDC
- **Real-time database** - Convex for automatic UI updates and data persistence
- **TypeScript interfaces** - Full type safety for all data structures
- **Reactive UI** - Real-time updates across components using Convex queries
- **Server-side validation** - Data validation at the database level
- **Phase 1 MVP** - Simplified prototype approach for rapid development
- **Service Versioning System** - Parent-child service relationships for better organization
- **Organization Context** - Centralized organization state management across the app
- **Conditional Data Loading** - Queries only run when organization is selected
- **Service Approval Workflow** - Real-time toggle interface for service approvals
- **Convex-Svelte Integration** - Using empty string fallback instead of "skip" pattern
- **CV Versioning Architecture** - Separate ExpertCV and ExpertServiceAssignment entities for better data management
- **Clean Break Migration** - Removed old expertAssignments table and migrated to new schema
- **Service-Specific Reviews** - Individual service approvals linked to specific CV versions
- **Auto-Lock Logic** - CVs automatically lock when all linked services are decided
- **Svelte 5 Store Pattern** - Use $state for reactive objects instead of writable() stores
- **Store Export Strategy** - Export functions instead of $derived values to avoid module export errors
- **Convex-Svelte Conditional Queries** - Use fallback organization IDs instead of "skip" or undefined for conditional queries
- **Organization Store Validation** - Include validate getter property for organization context validation

### User Preferences (Important!)

- **Coach-style guidance** - guide user through steps rather than doing everything
- **Simple solutions** - avoid unnecessary complexity
- **Svelte 5 focus** - always use modern Svelte syntax
- **Security and quality** - build with security and quality from day one
- **Step-by-step approach** - don't overwhelm with too much new information

---

**Last Updated**: December 2024
**Version**: 2.0 - CV Versioning Architecture
**Maintainer**: Development Team
