# Requirements + Plan for Workspace Admin

## Requirements

1. **Single Admin Interface**

   - Create a consolidated admin page for managing both workspaces and projects
   - Interface should be intuitive and provide a clear hierarchy of workspaces and their associated projects

2. **Workspace Management**

   - Create new workspaces with name, description, and other relevant metadata
   - Read/View existing workspaces with filtering and sorting capabilities
   - Update workspace details including name, description, settings
   - Delete workspaces with appropriate confirmation and safety measures
   - Display metrics such as number of projects, users, or activity levels

3. **Project Management**

   - Create new projects within selected workspaces
   - Read/View all projects associated with workspaces
   - Update project details including name, description, workspace assignment
   - Delete projects with appropriate confirmation
   - Ability to move projects between workspaces

4. **Relationship Management**

   - Clear visual representation of workspace-project relationships
   - Ability to see all projects within a workspace
   - Batch operations for multiple projects within a workspace

5. **User Experience**
   - Responsive design that works on various screen sizes
   - Efficient loading of workspace and project data
   - Inline editing capabilities where appropriate
   - Consistent feedback for all CRUD operations

## Plan

### 1. API Enhancements

1. **Extend Workspace Router**

   - Update the `workspaceRouter.ts` to include:
     - Enhanced `update` mutation with more fields (description, settings)
     - Add statistics endpoint to fetch metrics about workspaces
     - Add a batch project assignment endpoint for moving multiple projects

2. **Extend Project Router**

   - Update the `projectRouter.ts` to include:
     - Enhanced update mutation with more fields (description)
     - Add filtering capabilities to getAll procedure
     - Add batch operations endpoint

### 2. Frontend Implementation

1. **Admin Dashboard Page**

   - Create a new `/workspaces/admin` route
   - Implement a dashboard layout with metrics and overview

2. **Workspace Management UI**

   - Create a WorkspaceAdminPanel component with:
     - List view with sorting/filtering options
     - Detail view with all workspace information
     - Edit/Delete capabilities with confirmation dialogs
     - Metrics visualization

3. **Project Management UI**

   - Create a ProjectAdminPanel component with:
     - Filterable list view within workspace context
     - Detail view with all project information
     - Edit/Delete capabilities with confirmation dialogs
     - Workspace assignment controls

4. **Relationship Management UI**
   - Create a hierarchical view component showing workspaces and their projects
   - Implement drag-and-drop functionality for project reassignment
   - Add batch operation controls

### 3. Components Implementation

1. **Core Components**

   - `WorkspaceTable.tsx`: Data table for viewing/sorting workspaces
   - `WorkspaceForm.tsx`: Form for creating/editing workspaces
   - `ProjectTable.tsx`: Data table for viewing/sorting projects
   - `ProjectForm.tsx`: Form for creating/editing projects
   - `WorkspaceProjectTree.tsx`: Hierarchical view of workspaces and projects

2. **UI Enhancement Components**
   - `ConfirmationDialog.tsx`: Reusable confirmation dialog
   - `MetricsCard.tsx`: Component for displaying workspace/project metrics
   - `BatchOperationsToolbar.tsx`: UI for batch operations
   - `InlineEditableField.tsx`: Component for inline editing

### 4. State Management

1. **Create Admin Store**

   - Implement a Zustand store for admin state management
   - Store selected workspaces, projects, and UI state
   - Manage batch selection state

2. **Query Optimization**
   - Implement efficient data fetching with react-query
   - Add proper invalidation strategies
   - Implement optimistic updates

### 5. Implementation Phases

1. **Phase 1: Core API Extensions**

   - Enhance existing routers
   - Add new endpoints
   - Implement proper validation and error handling

2. **Phase 2: Basic Admin UI**

   - Implement basic workspace and project management UI
   - Create core components
   - Implement basic CRUD operations

3. **Phase 3: Enhanced Features**

   - Add relationship management UI
   - Implement batch operations
   - Add metrics and visualizations

4. **Phase 4: Polish and Optimization**
   - Improve responsiveness
   - Optimize data loading
   - Add animations and transitions for better UX
   - Implement comprehensive error handling and notifications

### 6. Technical Considerations

1. **Data Management**

   - Use react-query for efficient data fetching and caching
   - Implement optimistic updates for better UX

2. **UI Components**

   - Utilize ShadCN UI components for consistent design
   - Implement responsive layouts using TailwindCSS

## Status

- [x] **Phase 1: Core API Extensions**
  - [x] Enhanced existing routers (`workspaceRouter`, `projectRouter`)
  - [x] Added new endpoints (`stats`, `batchAssignProjects`, `batchUpdateWorkspace`, filtering for `projectRouter.getAll`)
  - [x] Implemented basic validation and error handling
- [x] **Phase 2: Basic Admin UI**
  - [x] Created `/workspaces/admin` route and page (`page.tsx`)
  - [x] Created basic placeholder components (`WorkspaceAdminPanel`, `ProjectAdminPanel`)
  - [x] Implement core components (`WorkspaceTable`, `WorkspaceForm`, `ProjectTable`, `ProjectForm`, `ConfirmationDialog`)
  - [x] Implement basic CRUD operations UI (Create, Read, Update, Delete for Workspaces and Projects)
- [-] **Phase 3: Enhanced Features** (Partially Complete)
  - [ ] Add relationship management UI (`WorkspaceProjectTree`)
  - [ ] Implement batch operations UI (`BatchOperationsToolbar`, integrate with API)
  - [x] Add metrics and visualizations (`MetricsCard` created, integrated basic counts)
  - [ ] Implement drag-and-drop project reassignment
  - [x] Add workspace filtering to Project panel
- [ ] **Phase 4: Polish and Optimization**
  - [ ] Implement Zustand store for shared state (e.g., selections)
  - [ ] Optimize data fetching (review query usage, consider TanStack Query features)
  - [ ] Improve responsiveness
  - [x] Add loading states (basic text/skeletons added to tables/metrics)
  - [ ] Add animations/transitions
  - [x] Implement comprehensive error handling/notifications (initial setup done with toast)
