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
- **Experts**: Individual professionals who provide services (can work for multiple services)
- **Services**: Specific expertise areas (ETP Assessment, Supplier Assessment, Chemical Management, etc.)
- **LEAD Experts**: Each service must have at least one designated lead expert per organization

---

## 🔐 Data Ownership & Governance Rules

### Rule 1: PDC Data Ownership
**Statement**: Users own their DEFAULT DATA in PDC (Platform for Data Collection)
**Implementation**: 
- PDC data is **READ-ONLY** in SPP
- SPP admins **CANNOT** add, edit, or delete PDC data
- PDC data includes: First Name, Last Name, Email, Country
- This data is managed by users in the external PDC platform

### Rule 2: SPP Data Ownership
**Statement**: SPP owns and manages all professional data for legal compliance
**Implementation**:
- SPP admins **MUST** create all professional data manually
- SPP data includes: Professional Experience, Education, Service Assignments
- SPP is **legally responsible** for employee information
- This data **CANNOT** be pre-filled or imported from PDC

### Rule 3: Data Separation
**Statement**: PDC and SPP data must remain completely separate
**Implementation**:
- No automatic data synchronization between platforms
- Clear visual indicators distinguish data sources
- Separate validation rules for each data type

---

## 👥 User Management Rules

### Rule 4: Expert Addition Workflow
**Statement**: Adding experts requires a 5-step verification and data collection process
**Implementation**:
1. **Step 1**: Email lookup in PDC
2. **Step 2**: Confirm PDC data (read-only display)
3. **Step 3**: Select services and assign roles (LEAD/Regular)
4. **Step 4**: Add professional experience (SPP-owned)
5. **Step 5**: Add education (SPP-owned)

### Rule 5: User Existence Handling
**Statement**: Handle both existing and non-existing PDC users
**Implementation**:
- **User EXISTS**: Proceed to Step 2 with PDC data
- **User DOESN'T EXIST**: Show invitation option
- **Invitation**: Send ZDHC invitation email (90-day expiry)
- **Status Tracking**: "Invited to ZDHC" status until signup or expiry

### Rule 6: Invitation Management
**Statement**: Invitations have a 90-day expiry period
**Implementation**:
- Invitations expire after 90 days if not accepted
- SPP admins are notified when users sign up
- Expired invitations are automatically removed
- Status: "Invited to ZDHC" → "Active" or "Expired"

---

## 🎯 Service Assignment Rules

### Rule 7: Service Role Requirements
**Statement**: Organizations need at least one LEAD expert per service to execute it
**Implementation**:
- Services can have multiple experts (Regular and LEAD)
- **LEAD Expert**: Required for service execution
- **Regular Expert**: Can work on the service but not lead it
- Visual distinction: LEAD = Yellow badges, Regular = Blue badges

### Rule 8: Service Assignment Flexibility
**Statement**: Experts can be assigned to multiple services with different roles
**Implementation**:
- One expert can be LEAD for Service A and Regular for Service B
- Role assignment is per-service, not global
- Badge system shows role per service clearly

### Rule 9: Service Validation
**Statement**: No validation required for service assignments
**Implementation**:
- Organizations can assign services without LEAD experts
- System allows saving with any service configuration
- Business logic may require LEAD experts, but UI doesn't enforce it

---

## 📝 Data Collection Rules

### Rule 10: Professional Experience Requirements
**Statement**: Professional experience is mandatory for legal compliance
**Implementation**:
- At least one experience entry required
- Job title is mandatory field (marked with asterisk)
- Company, location, dates, description are optional
- Dynamic add/remove functionality
- "Currently working here" checkbox hides end date

### Rule 11: Education Requirements
**Statement**: Education information is mandatory for legal compliance
**Implementation**:
- At least one education entry required
- School/University name is mandatory field (marked with asterisk)
- Degree, field, graduation year, description are optional
- Dynamic add/remove functionality

### Rule 12: Data Entry Validation
**Statement**: Required fields must be completed before proceeding
**Implementation**:
- Step 4: Cannot proceed without at least one experience with job title
- Step 5: Cannot proceed without at least one education with school name
- Real-time validation with disabled "Next" buttons
- Clear error messaging for incomplete required fields

---

## 🔄 Workflow Rules

### Rule 13: Step Progression
**Statement**: Users must complete each step before proceeding
**Implementation**:
- Sequential step completion required
- "Next" button disabled until step requirements met
- "Back" button allows returning to previous steps
- Progress tracker shows current step and completion percentage

### Rule 14: Data Persistence
**Statement**: Form data persists during the wizard workflow
**Implementation**:
- Data entered in previous steps remains when navigating back
- No data loss during step navigation
- Final save only occurs at Step 5 completion

### Rule 15: Cancellation Handling
**Statement**: Users can cancel the process with confirmation
**Implementation**:
- Cancel button shows confirmation dialog
- Warning: "All progress will be lost"
- Returns to previous page on confirmation
- No automatic save on cancellation

---

## 🎨 User Interface Rules

### Rule 16: Visual Data Distinction
**Statement**: Different data sources must be visually distinct
**Implementation**:
- PDC data: Blue info boxes with read-only styling
- SPP data: White form fields with editable styling
- Warning boxes: Yellow alerts for SPP data ownership
- Clear labeling of data source and ownership

### Rule 17: Role Badge System
**Statement**: Service roles must be clearly distinguishable
**Implementation**:
- LEAD Expert: Yellow badges with hover effects
- Regular Expert: Blue badges with hover effects
- Clickable badges with toggle functionality
- Visual feedback on hover (scale, shadow, cursor)

### Rule 18: Progress Indication
**Statement**: Users must always know their current position
**Implementation**:
- 5-step progress tracker at top of wizard
- Active step highlighted in blue
- Completed steps remain blue
- Progress bar shows completion percentage

---

## 🧪 Development & Testing Rules

### Rule 19: Mock Data Usage
**Statement**: Development uses mock PDC data for testing
**Implementation**:
- 3 test users in mock PDC database
- Test emails: sarah.johnson@example.com, michael.chen@example.com, emma.wilson@example.com
- "Fill Test Data" button for development (purple, marked as DEV)
- Mock data must be replaced with real API integration

### Rule 20: Test Data Limitations
**Statement**: Test data should not pre-fill SPP-owned fields
**Implementation**:
- Test data only fills email and service selections
- Experience and education remain empty (admin must create)
- Maintains business rule of SPP data ownership

---

## ⚖️ Legal & Compliance Rules

### Rule 21: Legal Responsibility
**Statement**: SPP organizations are legally responsible for their expert data
**Implementation**:
- Clear warnings about legal responsibility
- SPP data cannot be imported or pre-filled
- Admin must manually verify and enter all professional data
- Audit trail requirements for data changes

### Rule 22: Data Accuracy
**Statement**: SPP admins must ensure data accuracy for legal compliance
**Implementation**:
- Manual data entry prevents import errors
- Required field validation ensures completeness
- Clear data source labeling prevents confusion
- Professional data must be verified by SPP admin

---

## 🔧 Technical Implementation Rules

### Rule 23: Svelte 5 Runes Usage
**Statement**: All reactive state must use Svelte 5 runes
**Implementation**:
- Use `$state()` for reactive variables
- Use `$derived()` for computed values
- Use `$props()` for component props
- Avoid legacy `$:` syntax

### Rule 24: Accessibility Requirements
**Statement**: All forms must meet accessibility standards
**Implementation**:
- Proper labels for all form fields
- ARIA attributes where needed
- Keyboard navigation support
- Screen reader compatibility

### Rule 25: Responsive Design
**Statement**: All interfaces must work on mobile and desktop
**Implementation**:
- Mobile-first CSS approach
- Responsive grid layouts
- Touch-friendly button sizes
- Readable text on all screen sizes

---

## 📊 Data Structure Rules

### Rule 26: Expert Data Structure
**Statement**: Expert data must follow defined structure
**Implementation**:
```javascript
{
  pdcData: {
    firstName: string,
    lastName: string,
    email: string,
    country: string
  },
  services: [
    {
      service: string,
      role: 'regular' | 'lead'
    }
  ],
  experience: [
    {
      title: string,
      company: string,
      location: string,
      startDate: string,
      endDate: string,
      current: boolean,
      description: string
    }
  ],
  education: [
    {
      school: string,
      degree: string,
      field: string,
      startDate: string,
      endDate: string,
      description: string
    }
  ]
}
```

---

## 🚨 Error Handling Rules

### Rule 27: User Not Found Handling
**Statement**: Graceful handling when PDC user doesn't exist
**Implementation**:
- Clear "User Not Found" message
- Invitation option prominently displayed
- No error states or broken workflows
- Positive user experience maintained

### Rule 28: Validation Error Display
**Statement**: Validation errors must be clear and actionable
**Implementation**:
- Required fields marked with asterisks
- Disabled buttons when requirements not met
- Clear messaging about what's needed
- No cryptic error messages

---

## 🔮 Future Enhancement Rules

### Rule 29: API Integration Preparation
**Statement**: Current mock implementation must be replaceable with real APIs
**Implementation**:
- Mock functions clearly separated
- API call patterns established
- Error handling prepared for network issues
- Data transformation ready for real endpoints

### Rule 30: Scalability Considerations
**Statement**: System must handle growth in users and services
**Implementation**:
- Efficient state management with Svelte stores
- Component-based architecture for reusability
- Performance optimization for large datasets
- Modular design for easy feature additions

---

## 📝 Change Management

### Rule 31: Business Rule Updates
**Statement**: All business rule changes must be documented here
**Implementation**:
- Update this document when rules change
- Version control all rule modifications
- Communicate changes to development team
- Maintain rule traceability

### Rule 32: Rule Validation
**Statement**: All implementations must be validated against these rules
**Implementation**:
- Code reviews must check rule compliance
- Testing must verify rule adherence
- Documentation must reflect current rules
- Regular rule audits recommended

---

**Last Updated**: [Current Date]
**Version**: 1.0
**Maintainer**: Development Team

> **Important**: This document is the single source of truth for all business rules in the SPP application. Any changes to application behavior must be reflected here first.
