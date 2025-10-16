# Solution Provider Platform (SPP)

A sophisticated expert management system for ZDHC Approved Solution Providers, built with Svelte 5 and Convex.

## 🎯 Project Overview

This platform enables Solution Provider organizations to manage their experts across multiple services with complex approval workflows and status tracking. The system spans multiple platforms (PDC, SPP, Academy) and provides organization-specific context switching.

## ✨ Key Features

### **Organization Management**

- **Multi-Organization Support**: Switch between different Solution Provider organizations
- **Organization Context**: Work as different organizations with proper data isolation
- **Role-Based Access**: Admin, Manager, and Viewer roles with different permissions

### **Expert Management**

- **Expert Assignment Workflow**: Complete lifecycle from draft to active
- **Service-Specific Roles**: LEAD/Regular roles per service within assignments
- **Status Tracking**: Draft → Submitted → Under Review → Training → Certified → Active
- **Real-time Updates**: Live status changes across browser tabs

### **Workflow States**

- **Draft**: Expert being prepared by SPP Admin
- **Submitted**: Ready for ZDHC Admin review
- **Under Review**: ZDHC Admin reviewing CV/credentials
- **Training**: Expert invited to Academy for training
- **Certified**: Training completed, certification received
- **Active**: Expert can provide services for this SPP

## 🏗️ Technical Architecture

### **Frontend**

- **Svelte 5**: Modern reactive framework with runes
- **Tailwind CSS**: Utility-first styling
- **TypeScript**: Type-safe development

### **Backend**

- **Convex**: Real-time database and backend-as-a-service
- **Reactive Queries**: Live data synchronization
- **Real-time Updates**: Instant UI updates across sessions

### **Database Schema**

- **Users**: PDC user master data
- **Organizations**: Solution Provider organizations
- **Staff Members**: Users with SPP platform access
- **Expert Assignments**: Links experts to organizations with service versions
- **User Sessions**: Organization context switching

## 🚀 Getting Started

### **Prerequisites**

- Node.js 18+
- Convex account and deployment

### **Installation**

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd SPP
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Convex**

   ```bash
   npx convex dev
   ```

   This will create a `.env.local` file with your Convex URL.

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Seed test data**
   - Navigate to `/test-convex`
   - Click "Seed Test Data" to create sample organizations and experts

### **Environment Variables**

Create a `.env.local` file with:

```env
PUBLIC_CONVEX_URL=https://your-convex-deployment-url.convex.cloud
```

## 📁 Project Structure

```
src/
├── app.html                 # Main HTML template
├── app.css                  # Global styles
├── convex/                  # Convex backend functions
│   ├── schema.ts           # Database schema
│   └── expertAssignments.ts # Queries and mutations
├── lib/
│   ├── components/         # Reusable UI components
│   │   ├── Header.svelte
│   │   ├── OrganizationSwitcher.svelte
│   │   ├── UserCard.svelte
│   │   └── ServiceBox.svelte
│   └── stores/            # Svelte stores
│       ├── experts.svelte.ts
│       └── organization.svelte.ts
└── routes/                # SvelteKit pages
    ├── +layout.svelte     # Main layout
    ├── +page.svelte       # Home page
    ├── user-management/   # Expert management
    └── test-convex/       # Development tools
```

## 🎮 Usage

### **Organization Switching**

1. Use the organization switcher in the header
2. Select from available organizations
3. All data automatically filters to the selected organization

### **Expert Management**

1. Navigate to "User Management"
2. View experts filtered by current organization
3. Add new experts using the "Add Expert" button
4. Track expert status through the workflow

### **Test Organizations**

The seeded data includes three test organizations:

- **TechCorp Solutions** (Netherlands) - Admin user with active experts
- **Green Consulting Group** (Germany) - Manager user with certified experts
- **EcoSolutions International** (France) - Admin user with experts in training

## 🔧 Development

### **Available Scripts**

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Run type checking

### **Convex Commands**

- `npx convex dev` - Start Convex development
- `npx convex deploy` - Deploy to production

## 📋 Business Rules

### **Assignment Rules**

1. **One expert per organization per service version** - Each expert can only have one active assignment per organization per service version
2. **Service-specific roles** - LEAD/Regular roles are per-service within an assignment
3. **Draft validation** - Must complete all required fields before submission
4. **Status enforcement** - Only valid status transitions are allowed

### **Permission Rules**

1. **SPP Admins** - Can create, edit, submit, and activate experts
2. **ZDHC Admins** - Can review, approve, reject, and send to training
3. **Viewers** - Can only view expert data
4. **Organization isolation** - Staff cannot see other organizations' data

## 🚧 Roadmap

### **Phase 1: Foundation** ✅

- [x] Convex setup and database schema
- [x] Basic organization context
- [x] Data migration from localStorage
- [x] Organization switching functionality

### **Phase 2: Core Workflow** 🚧

- [ ] Expert assignment creation wizard
- [ ] Status management system
- [ ] Basic UI updates
- [ ] Workflow history tracking

### **Phase 3: Advanced Features**

- [ ] Status-based filtering
- [ ] Real-time updates
- [ ] Bulk operations
- [ ] Advanced search

### **Phase 4: Integration**

- [ ] PDC API integration
- [ ] Academy API integration
- [ ] Email notifications
- [ ] Export/Import functionality

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For questions or support, please open an issue in the GitHub repository.

---

**Built with ❤️ using Svelte 5 and Convex**
