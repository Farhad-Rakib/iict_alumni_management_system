# Admin Template Starter Kit - Developer Guide

Production-ready, reusable Admin Template built with React, TypeScript, and modern best practices.

## Table of Contents

1. [Setup & Run](#setup--run)
2. [Folder Structure](#folder-structure)
3. [Architecture Overview](#architecture-overview)
4. [Core Concepts](#core-concepts)
5. [Configuration Usage](#configuration-usage)
6. [Adding New Features](#adding-new-features)
7. [Using Table & Form Components](#using-table--form-components)
8. [Form Drawer Component](#form-drawer-component)
9. [Authentication Flow](#authentication-flow)
10. [Menu System](#menu-system)
11. [Dark Mode & Theming](#dark-mode--theming)
12. [Settings System](#settings-system)
13. [Notification Center](#notification-center)
14. [Command Palette](#command-palette)
15. [Reports & Charts](#reports--charts)
16. [Mock System](#mock-system)
17. [Switching to Real Backend](#switching-to-real-backend)
18. [Best Practices](#best-practices)
19. [Common Mistakes to Avoid](#common-mistakes-to-avoid)

---

## Setup & Run

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Type Check

```bash
npm run typecheck
```

---

## Folder Structure

```
src/
├── app/                          # Application level code
│   ├── layouts/                 # Layout components
│   │   ├── AuthLayout.tsx
│   │   ├── DashboardLayout.tsx
│   │   └── components/          # Layout-specific components
│   │       ├── Header.tsx       # Top header with theme toggle, notifications, user menu
│   │       └── Sidebar.tsx      # Responsive sidebar with menu
│   ├── pages/                   # Generic pages (404, 403)
│   ├── providers/               # App-level providers
│   └── router/                  # Route configuration
├── components/                   # Shared components
│   ├── CommandPalette/          # Global search (Ctrl+K)
│   ├── form/                    # Form components
│   │   └── DynamicForm.tsx
│   ├── table/                   # Table components
│   │   └── DataTable.tsx
│   └── ui/                      # UI primitives
│       ├── Dialog/
│       ├── Drawer/              # Slide-out form drawer
│       │   └── FormDrawer.tsx
│       ├── EmptyState/
│       ├── ErrorState/
│       ├── Loader/
│       ├── Modal/
│       └── Toast/
├── core/                         # Core application code
│   ├── api/                     # API layer
│   │   ├── base.repository.ts
│   │   ├── http.types.ts
│   │   └── services/
│   ├── config/                  # App configuration
│   │   └── app.config.ts
│   ├── guards/                  # Route guards
│   ├── services/                # Service layer
│   │   ├── service.factory.ts
│   │   └── impl/               # Real API implementations
│   └── stores/                  # Global stores
│       ├── notification.store.ts
│       ├── preferences.store.ts
│       └── theme.store.ts
├── domain/                       # Domain layer
│   ├── dto/                     # Data Transfer Objects
│   └── models/                  # Domain models
├── features/                     # Feature modules
│   ├── activity/                # Activity/audit log
│   │   └── pages/
│   ├── auth/                    # Authentication
│   │   ├── pages/
│   │   └── store/
│   ├── dashboard/               # Dashboard with charts
│   │   └── pages/
│   ├── preferences/             # Theme & table density
│   │   └── pages/
│   ├── reports/                 # Reports with charts
│   │   └── pages/
│   ├── settings/                # Application settings
│   │   ├── pages/
│   │   └── store/
│   └── users/                   # User management
│       └── pages/
└── mocks/                        # Mock data & services
    ├── data/
    └── services/
```

---

## Architecture Overview

The application follows a layered architecture with clear separation between domain models, DTOs, service interfaces, and implementations.

### Layer Diagram

```
Feature Pages / Stores
        │
        ▼
   API Exports  (core/api/services/*.ts)
        │
        ▼
  Service Factory  (core/services/service.factory.ts)
      ┌─────┴─────┐
      ▼            ▼
  Mock Services   Real Services
  (mocks/)        (core/services/impl/)
                       │
                       ▼
                  Base Repository  (core/api/base.repository.ts)
                       │
                       ▼
                   Axios / HTTP
```

### Base Repository

All real API services extend `BaseRepository`, which provides typed HTTP methods with automatic auth token injection, interceptors, and error handling.

```typescript
import { BaseRepository } from '../api/base.repository';

export class ProductService extends BaseRepository {
  constructor() {
    super('/products', 'application/json');
  }

  async getAll(): Promise<Product[]> {
    return this.get<Product[]>('');
  }
}
```

Available methods: `get`, `post`, `put`, `patch`, `delete`

### DTOs vs Domain Models

**Domain Models** represent core business entities. **DTOs** define request/response shapes for API communication. Keep them separate.

### Service Factory

Resolves mock or real implementations based on `AppConfig.api.useMockData`:

```typescript
import { serviceFactory } from '../services/service.factory';
const userService = serviceFactory.getUserService();
```

---

## Core Concepts

### State Management

- **Zustand** - Global state (auth, theme, notifications, settings, preferences)
- **TanStack Query** - Server state (data fetching, caching, mutations)

### Route Protection

```tsx
<AuthGuard>
  <PermissionGuard permissions={['users.view']}>
    <UsersPage />
  </PermissionGuard>
</AuthGuard>
```

### Responsive Design

The layout is fully responsive:
- **Desktop (lg+)**: Fixed sidebar + main content
- **Tablet/Mobile**: Hidden sidebar with hamburger menu overlay
- All tables, forms, and cards use responsive grid breakpoints (`sm:`, `md:`, `lg:`)

---

## Configuration Usage

```typescript
import { AppConfig } from '@/core/config/app.config';

// Key settings
AppConfig.api.useMockData    // Toggle mock/real API
AppConfig.features.enableDarkMode  // Dark mode feature flag
AppConfig.features.enableRBAC      // Role-based access
```

---

## Adding New Features

Follow these steps:

1. Create domain model (`domain/models/`)
2. Create DTOs (`domain/dto/`)
3. Create service interface (`core/services/`)
4. Create real service implementation (`core/services/impl/`)
5. Add mock data (`mocks/data/`)
6. Create mock service (`mocks/services/`)
7. Register in service factory
8. Create API export (`core/api/services/`)
9. Create feature page (`features/`)
10. Add route (`app/router/`)
11. Add to menu (`mocks/data/menu.json`)

---

## Using Table & Form Components

### DataTable

```typescript
import { DataTable, Column, RowAction } from '@/components/table/DataTable';

const columns: Column<User>[] = [
  { key: 'fullName', label: 'Name', sortable: true },
  { key: 'status', label: 'Status', render: (status) => <Badge>{status}</Badge> },
];

const rowActions: RowAction<User>[] = [
  { icon: Pencil, label: 'Edit', onClick: (user) => handleEdit(user), variant: 'primary' },
  { icon: Trash2, label: 'Delete', onClick: (user) => handleDelete(user), variant: 'danger', show: (user) => user.canDelete },
];

<DataTable columns={columns} data={users} isLoading={isLoading} searchable rowActions={rowActions} />
```

### DynamicForm

```typescript
import { DynamicForm, FormField } from '@/components/form/DynamicForm';

const fields: FormField[] = [
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'role', label: 'Role', type: 'select', options: [...] },
];

<DynamicForm fields={fields} onSubmit={handleSubmit} submitLabel="Save" />
```

---

## Form Drawer Component

A slide-out drawer that renders a `DynamicForm` inside it. Supports left/right positioning and multiple sizes.

```typescript
import { FormDrawer } from '@/components/ui/Drawer/FormDrawer';

<FormDrawer
  isOpen={isOpen}
  onClose={handleClose}
  title="Add New User"
  description="Fill in the user details"
  fields={userFormFields}
  onSubmit={handleSubmit}
  submitLabel="Create"
  isLoading={isSubmitting}
  position="right"    // 'left' | 'right'
  size="md"           // 'sm' | 'md' | 'lg' | 'xl'
/>
```

You can also pass custom `children` instead of using the built-in form:

```typescript
<FormDrawer isOpen={isOpen} onClose={close} title="Custom Content" fields={[]} onSubmit={() => {}}>
  <div>Any custom JSX here</div>
</FormDrawer>
```

---

## Authentication Flow

```typescript
const { login, logout, isAuthenticated, hasPermission } = useAuthStore();

await login({ email, password });
if (hasPermission('users.create')) { /* show button */ }
await logout();
```

### Demo Accounts

- **Admin**: admin@example.com / admin123
- **Manager**: manager@example.com / manager123
- **User**: user@example.com / user123

---

## Menu System

Menus are loaded from `src/mocks/data/menu.json`:

```json
{
  "id": "dashboard",
  "label": "Dashboard",
  "path": "/dashboard",
  "icon": "LayoutDashboard",
  "permissions": ["dashboard.view"]
}
```

Supports: nested children, badges, permission-based visibility. Icons use Lucide React names.

---

## Dark Mode & Theming

Dark mode is built into every component using Tailwind's `dark:` variant with the `class` strategy.

### Theme Store

```typescript
import { useThemeStore } from '@/core/stores/theme.store';

const { theme, toggleTheme, setTheme } = useThemeStore();
toggleTheme();        // Toggle between light/dark
setTheme('dark');     // Set explicitly
```

- Persisted to localStorage
- Applied via `document.documentElement.classList`
- Toggle button in the header (Sun/Moon icon)
- Also available in the Preferences page and Command Palette

### Preferences Store

```typescript
import { usePreferencesStore } from '@/core/stores/preferences.store';

const { tableDensity, setTableDensity, sidebarCollapsed } = usePreferencesStore();
```

Table density options: `compact`, `normal`, `comfortable`

---

## Settings System

Application settings are stored in Zustand with `persist` middleware (saved to localStorage as JSON). Settings can be imported/exported as JSON files.

### Settings Store

```typescript
import { useSettingsStore } from '@/features/settings/store/settings.store';

const { general, security, notifications, updateGeneral, exportAsJSON } = useSettingsStore();

updateGeneral({ siteName: 'My App' });
const json = exportAsJSON(); // Returns JSON string of all settings
```

### Settings Categories

1. **General** - Site name, description, email, timezone, date format, language, maintenance mode
2. **Security** - 2FA, session timeout, login attempts, password policy, IP whitelist, audit retention
3. **Notifications** - Email/push channels, user/security/system alerts, weekly/monthly reports

### Import/Export

Settings can be exported as `.json` files and re-imported. The General Settings page has Import/Export buttons.

### Migration Path

Settings are currently stored in localStorage via Zustand persist. To move to a database later:
1. Create a settings table in Supabase
2. Create a settings service interface
3. Implement real service that reads/writes to the database
4. Replace direct store usage with API calls

---

## Notification Center

The notification bell in the header shows unread notifications with a badge count.

### Notification Store

```typescript
import { useNotificationStore } from '@/core/stores/notification.store';

const { notifications, unreadCount, addNotification, markAsRead, markAllAsRead, removeNotification } = useNotificationStore();

addNotification({
  title: 'New order',
  message: 'Order #123 received',
  type: 'success', // 'info' | 'success' | 'warning' | 'error'
});
```

---

## Command Palette

Press **Ctrl+K** (or Cmd+K on Mac) to open the global command palette.

Features:
- Navigate to any page
- Toggle dark/light mode
- Logout
- Keyboard navigation (Arrow keys + Enter)
- Search by label or keywords
- Grouped by category (Navigation, Actions)

---

## Reports & Charts

The Reports page demonstrates various chart types using Recharts:

- **Bar charts** - Revenue vs Expenses
- **Pie charts** - Sales by category (donut)
- **Area charts** - Traffic trends
- **Line charts** - Profit trends
- **Data tables** - Top products with growth metrics

All charts are responsive and styled for both light and dark modes.

---

## Mock System

Mock services implement the same interfaces as real API services. The `ServiceFactory` resolves which to use.

```typescript
// Both implement IUserService
class MockUserService implements IUserService { ... }
class UserService extends BaseRepository implements IUserService { ... }
```

Features: simulated delays, CRUD, pagination, search, sorting.

---

## Switching to Real Backend

1. Set `AppConfig.api.useMockData = false`
2. Set `VITE_API_BASE_URL` environment variable
3. Done! The ServiceFactory switches automatically.

Your feature pages require **zero changes** because they depend on service interfaces, not implementations.

---

## Best Practices

1. Keep components small and focused
2. Use TypeScript strictly (no `any`)
3. Follow naming conventions (PascalCase components, camelCase functions, DTOs suffixed with `Dto`)
4. Separate concerns (hooks, components, stores, services)
5. Handle loading, error, and empty states
6. Use React Query for server state
7. Validate forms with Zod
8. Protect routes with guards
9. Always use `dark:` variants for dark mode support
10. Use the FormDrawer for slide-out editing experiences

---

## Common Mistakes to Avoid

1. **Bypassing service interfaces** - Always use API exports, not direct implementations
2. **Forgetting to invalidate queries** - After mutations, call `queryClient.invalidateQueries`
3. **Not handling permissions** - Check permissions before showing UI
4. **Hardcoding configuration** - Use `AppConfig` instead
5. **Mixing domain models and DTOs** - Keep them separate
6. **Not showing loading states** - Always handle loading/error
7. **Ignoring TypeScript errors** - Fix them, don't suppress
8. **Missing dark mode styles** - Every new component needs `dark:` variants

---

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling (with dark mode via `class` strategy)
- **Zustand** - Global state (auth, theme, settings, notifications, preferences)
- **TanStack Query** - Server state
- **React Router** - Routing
- **React Hook Form** - Forms
- **Zod** - Validation
- **Axios** - HTTP client (via Base Repository)
- **Recharts** - Charts (bar, line, area, pie)
- **Lucide React** - Icons
