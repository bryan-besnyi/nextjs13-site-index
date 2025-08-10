# Admin Dashboard Implementation Plan

## Phase 1: Essential Packages & Components

### Immediate Package Installation
```bash
# Essential packages only (to minimize dependencies)
npm install --legacy-peer-deps \
  @tanstack/react-table@latest \
  recharts@latest \
  react-hot-toast@latest \
  cmdk@latest \
  next-themes@latest \
  @radix-ui/react-dialog@latest \
  @radix-ui/react-dropdown-menu@latest \
  @radix-ui/react-tabs@latest \
  @radix-ui/react-select@latest \
  @radix-ui/react-checkbox@latest \
  @radix-ui/react-switch@latest
```

## New Admin Layout Design

### 1. **Modern Sidebar Component**
```tsx
// src/components/admin/AdminSidebar.tsx
const sidebarItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin",
  },
  {
    title: "Data Management",
    icon: Database,
    items: [
      { title: "Browse Items", href: "/admin/data" },
      { title: "Import/Export", href: "/admin/data/import-export" },
      { title: "Bulk Operations", href: "/admin/data/bulk" },
    ],
  },
  {
    title: "Developer Tools",
    icon: Code2,
    items: [
      { title: "API Explorer", href: "/admin/tools/api" },
      { title: "Performance", href: "/admin/tools/performance" },
      { title: "Cache Manager", href: "/admin/tools/cache" },
    ],
  },
  {
    title: "Analytics",
    icon: TrendingUp,
    items: [
      { title: "Usage Stats", href: "/admin/analytics/usage" },
      { title: "Search Insights", href: "/admin/analytics/search" },
    ],
  },
  {
    title: "System",
    icon: Settings,
    items: [
      { title: "Health Status", href: "/admin/system/health" },
      { title: "Backups", href: "/admin/system/backups" },
      { title: "Settings", href: "/admin/system/settings" },
    ],
  },
];
```

### 2. **Dashboard Overview Page**
Key metrics to display:
- Total Index Items (with growth %)
- API Calls Today (with trend)
- Cache Hit Rate (with gauge)
- System Health Status
- Recent Activity Feed
- Quick Actions (Add Item, Run Backup, Clear Cache)

### 3. **Enhanced Data Table Features**
```tsx
// Advanced filtering with these options:
- Multi-column search
- Campus filter (checkbox group)
- Letter filter (A-Z buttons)
- Date range filter
- Saved filter presets
- Column visibility toggle
- Density toggle (compact/normal/comfortable)

// Bulk operations toolbar:
- Select All / Clear Selection
- Export Selected (CSV/JSON)
- Bulk Delete
- Bulk Edit (campus/letter)
- Duplicate Items
```

### 4. **Developer Tools**

#### API Explorer
```
┌─────────────────────────────────────────┐
│ API Explorer                            │
├─────────────────────────────────────────┤
│ Method: [GET ▼] URL: /api/indexItems   │
│                                         │
│ Headers:                                │
│ ┌─────────────────────────────────────┐ │
│ │ User-Agent: Mozilla/5.0...          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Query Parameters:                       │
│ ┌─────────────────────────────────────┐ │
│ │ campus: College of San Mateo        │ │
│ │ letter: A                           │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Send Request] [Save] [History ▼]       │
│                                         │
│ Response:                               │
│ Status: 200 OK | Time: 45ms            │
│ ┌─────────────────────────────────────┐ │
│ │ {                                   │ │
│ │   "data": [...],                   │ │
│ │   "count": 150                     │ │
│ │ }                                   │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

#### Performance Dashboard
- Response time graph (line chart)
- Cache hit rate (donut chart)
- Top slowest endpoints (bar chart)
- Real-time request feed
- Database query performance
- Alert configuration

### 5. **Command Palette (Cmd+K)**
Quick actions accessible via keyboard:
- Search items by title
- Navigate to any page
- Run common tasks (backup, clear cache)
- Toggle dark mode
- View keyboard shortcuts

## Implementation Priorities

### Week 1: Core Infrastructure
1. **New Layout Structure**
   - Modern sidebar with collapsible sections
   - Header with search, user menu, theme toggle
   - Responsive mobile menu
   
2. **Dashboard Page**
   - Metric cards with Recharts
   - System status indicators
   - Recent activity feed

3. **Enhanced Data Table**
   - TanStack table with sorting/filtering
   - Inline editing
   - Bulk selection

### Week 2: Developer Tools
1. **API Explorer**
   - Request builder
   - Response viewer
   - Save/load requests

2. **Performance Monitor**
   - Connect to existing metrics API
   - Real-time charts
   - Historical data

### Week 3: Data Management
1. **Import/Export**
   - CSV/JSON upload with preview
   - Field mapping
   - Validation errors

2. **Bulk Operations**
   - Multi-select actions
   - Progress indicators
   - Undo capability

### Week 4: Polish
1. **Command Palette**
2. **Keyboard Shortcuts**
3. **Dark Mode**
4. **Mobile Optimization**

## Component Library Setup

### 1. Create base UI components
```bash
# Additional shadcn/ui components to add:
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add select
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add command
npx shadcn-ui@latest add data-table
```

### 2. Theme Configuration
```tsx
// Add to tailwind.config.js
theme: {
  extend: {
    colors: {
      dashboard: {
        sidebar: "hsl(var(--dashboard-sidebar))",
        header: "hsl(var(--dashboard-header))",
        card: "hsl(var(--dashboard-card))",
      }
    }
  }
}
```

## Benefits for College Web Devs

1. **Efficiency Gains**
   - Bulk import 1000+ items in seconds
   - Keyboard shortcuts for power users
   - Saved searches and filters
   - One-click exports

2. **Developer Experience**
   - Test APIs without external tools
   - Monitor performance in real-time
   - SQL-like filtering on data
   - Visual feedback for all actions

3. **Data Integrity**
   - Validation before imports
   - Duplicate detection
   - Backup before bulk operations
   - Audit trail of changes

4. **Professional Tools**
   - Similar to tools like Postman (API)
   - Similar to pgAdmin (Database)
   - Similar to Grafana (Metrics)
   - All integrated in one place

## Next Steps

1. Install essential packages
2. Create new layout components
3. Implement dashboard overview
4. Enhance data table
5. Add developer tools progressively

This plan provides a modern, developer-focused admin experience while keeping the public APIs simple and unauthenticated for maximum accessibility.