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
- **Bun** - Runtime and package manager (faster than Node.js)

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
│       ├── Header.svelte     # Navigation and branding
│       ├── UserCard.svelte   # User display component
│       ├── ServiceBox.svelte # Service section container
│       └── ActionCard.svelte # Dashboard action cards
├── convex/                  # Convex backend functions
│   ├── schema.ts           # Database schema definition
│   ├── expertAssignments.ts # CRUD operations for experts
│   └── _generated/         # Auto-generated API files
├── routes/
│   ├── +layout.svelte       # Root layout with Convex setup
│   ├── +page.svelte         # Homepage dashboard
│   ├── test-convex/         # Database testing page
│   └── user-management/
│       ├── +page.svelte     # User management main page
│       └── add-expert/
│           └── +page.svelte # Add/Edit expert wizard
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

### Add Expert Wizard (5-Step Process)
- **Step 1: Email Lookup** - Check if user exists in PDC (external platform)
- **Step 2: Confirm PDC Data** - Display read-only user data (name, email, country)
- **Step 3: Select Services & Roles** - Badge system for service assignment with LEAD/Regular roles
- **Step 4: Professional Experience** - SPP-owned data for legal compliance (dynamic add/remove)
- **Step 5: Education** - SPP-owned data for legal compliance (dynamic add/remove)
- **Progress Tracker** - Visual indicator showing current step and progress (5 steps)
- **Invitation Flow** - Send ZDHC invitation if user not found (90-day expiry)
- **Data Governance** - PDC data is read-only, SPP owns experience/education data
- **Mock PDC Integration** - Simulated API for testing before real integration
- **Service Role Management** - Visual badges distinguish LEAD vs Regular experts per service
- **Legal Compliance** - Experience and education required for SPP legal responsibility
- **Persistent Save** - Expert data automatically saved to Convex database
- **Success Feedback** - Confirmation message and redirect to user management
- **Database Integration** - Real-time data persistence with Convex backend
- **Organization Management** - Automatic creation of default organization
- **Data Validation** - Server-side validation with proper error handling

## 🔄 Data Management (Implemented)

### Current State
- **Convex Database** for real-time data persistence ✅
- **TypeScript interfaces** for all data structures ✅
- **CRUD operations** - Add, update, remove, get experts ✅
- **Real-time updates** - Automatic UI updates when data changes ✅
- **Server-side validation** - Data validation at the database level ✅
- **Cross-session persistence** - Data survives browser restarts ✅

### Database Schema
- **Users table** - PDC user data (firstName, lastName, email, country)
- **Organizations table** - Solution provider organizations
- **Expert Assignments table** - Links users to organizations with services and roles
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
  _id: Id<"users">;
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
  _id: Id<"organizations">;
  name: string;
  type: "solution_provider" | "zdhc_staff";
  contactEmail: string;
  status: "active" | "inactive" | "suspended";
  createdAt: number;
  updatedAt: number;
}

// Expert Assignments (Links users to organizations)
interface ExpertAssignment {
  _id: Id<"expertAssignments">;
  userId: Id<"users">;
  organizationId: Id<"organizations">;
  services: string[];
  status: "draft" | "active" | "inactive";
  experience: Experience[];
  education: Education[];
  assignedAt: number;
  assignedBy: string;
  notes?: string;
}
```

### Data Flow
```
Add Expert Wizard → Convex Mutations → Database → Real-time UI Updates
```

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
- **Fast builds** - Leverage Bun's speed

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
- **Bun over Node.js** - for faster development and builds
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

### User Preferences (Important!)
- **Coach-style guidance** - guide user through steps rather than doing everything
- **Simple solutions** - avoid unnecessary complexity
- **Svelte 5 focus** - always use modern Svelte syntax
- **Security and quality** - build with security and quality from day one
- **Step-by-step approach** - don't overwhelm with too much new information

---

**Last Updated**: [Current Date]
**Version**: 1.0
**Maintainer**: Development Team
