# Frontend

## Stack

| Technology | Purpose |
|-----------|---------|
| Next.js 16.2 | React framework (App Router) |
| Tailwind CSS 4 | Utility-first styling |
| Lucide React | Icon library |
| Recharts 3.8 | Charts and data visualization |
| Framer Motion 12 | Animations and transitions |
| Zustand 5 | Client state management |
| TanStack Query 5 | Server state, caching, loading states |
| React Hook Form 7 | Form management |
| Zod v4 | Schema validation |
| Sonner 2 | Toast notifications |
| Radix UI | Accessible dialog and tooltip primitives |
| cmdk 1.1 | Command palette (CMD+K) |
| next-themes | Dark mode support |

## Routes (35 total)

### Public
| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Hero, features, portals, stats, CTA, footer |
| `/login` | Login | Email/password with validation, loading state, toast |
| `/register` | Register | Multi-field form with password strength |
| `/password/reset` | Reset | Email input with success state |
| `/terms` | Terms | Terms of Service |
| `/privacy` | Privacy | Privacy Policy |

### Dashboard (authenticated)
| Route | Page | Description |
|-------|------|-------------|
| `/dashboard` | Overview | Stats, charts, recent transactions, upcoming payments |

### Admin
| Route | Page |
|-------|------|
| `/admin/members` | Member list with DataTable |
| `/admin/members/create` | Add new member form |
| `/admin/savings-accounts` | Account management |
| `/admin/transactions` | Transaction history |
| `/admin/transactions/create` | New transaction form |
| `/admin/loans` | Loan management |
| `/admin/expenses` | Expense tracking |
| `/admin/reports` | Report generator |
| `/admin/users` | User management |
| `/admin/settings` | System settings |
| `/admin/interest` | Interest calculator |
| `/admin/deposit-requests` | Pending deposits |
| `/admin/withdraw-requests` | Pending withdrawals |
| `/admin/bank-accounts` | Bank account management |
| `/admin/payment-gateways` | Payment gateway config |
| `/admin/welfare` | Welfare program admin |

### Member Portal
| Route | Page |
|-------|------|
| `/portal/savings` | My savings accounts |
| `/portal/loans` | My loans + calculator |
| `/portal/transactions` | My transaction history |
| `/portal/deposits` | Make a deposit |
| `/portal/withdrawals` | Request withdrawal |
| `/portal/welfare` | Welfare programs + pledges |
| `/portal/help` | Help & support articles |

### Profile
| Route | Page |
|-------|------|
| `/profile` | Edit profile |
| `/profile/change-password` | Change password |

## Component Library

### Layout Components

| Component | File | Description |
|-----------|------|-------------|
| `Sidebar` | `components/sidebar.tsx` | Glass-dark sidebar, collapsible on mobile, Escape key close, section dividers |
| `DashboardHeader` | `components/dashboard-header.tsx` | Glass header, CMD+K search, theme toggle, notifications, profile dropdown |
| `MobileNav` | `components/mobile-nav.tsx` | Landing page mobile navigation with login portal dropdown |
| `LoginDropdown` | `components/login-dropdown.tsx` | Portal selection dropdown (Admin/Member/Staff) |
| `Breadcrumb` | `components/ui/breadcrumb.tsx` | Auto-generated from pathname |
| `CommandPalette` | `components/ui/command-palette.tsx` | CMD+K search across all pages |
| `ScrollToTop` | `components/ui/scroll-to-top.tsx` | Floating scroll button |

### Data Components

| Component | File | Description |
|-----------|------|-------------|
| `DataTable` | `components/data-table.tsx` | Sortable columns, search, pagination, CSV export, mobile card view, loading/empty/error states |
| `StatCard` | `components/stat-card.tsx` | Glass stat card with icon, value, change indicator |
| `DepositsWithdrawalsChart` | `components/dashboard-charts.tsx` | Area chart |
| `ExpenseChart` | `components/dashboard-charts.tsx` | Pie chart |
| `LoanChart` | `components/dashboard-charts.tsx` | Bar chart |

### UI Primitives

| Component | File | Description |
|-----------|------|-------------|
| `Skeleton` | `components/ui/skeleton.tsx` | Shimmer skeleton + StatSkeleton, TableSkeleton, CardSkeleton |
| `ConfirmDialog` | `components/ui/confirm-dialog.tsx` | Radix dialog, default/destructive variants |
| `FormField` | `components/ui/form-field.tsx` | Input with label, icon, error, helpText, ARIA |
| `SecurityBadge` | `components/ui/security-badge.tsx` | SSL encryption badge |
| `FadeIn` / `SlideUp` / `PageTransition` | `components/motion.tsx` | Framer Motion wrappers |
| `Providers` | `components/providers.tsx` | QueryClient + ThemeProvider + Toaster + TooltipProvider |

## Design System

### Glassmorphism Classes

```css
.glass         /* Standard: white 65%, blur 20px */
.glass-strong  /* Navbar: white 80%, blur 30px */
.glass-subtle  /* Badges: white 45%, blur 16px */
.glass-dark    /* Sidebar: dark 85%, blur 24px */
.glass-card    /* Cards: white 60%, blur 20px, shadow, hover effect */
.mesh-gradient /* Multi-color radial gradient background */
```

All have `.dark` variants that automatically adapt.

### Dark Mode

Enabled via `next-themes` with `class` strategy. Toggle in dashboard header (sun/moon icon) and via CMD+K palette.

All CSS custom properties have `.dark` overrides in `globals.css`.

### Animations

- **Floating blobs**: Ambient gradient blobs with 15-25s infinite animations
- **Skeleton shimmer**: Linear gradient animation for loading states
- **Transitions**: 200ms cubic-bezier on all elements, 150ms for buttons/links
- **Framer Motion**: FadeIn, SlideUp, StaggerChildren, PageTransition, ScaleIn
- **`prefers-reduced-motion`**: Disables all animations when user requests

### Accessibility

- **Skip-to-content**: Hidden link, visible on focus
- **Focus-visible**: 2px primary outline on all focusable elements
- **ARIA**: `role="grid"` on DataTable, `aria-label` on navigation, `aria-invalid` on form errors
- **Keyboard**: Escape closes sidebar/modals, CMD+K opens command palette
- **Contrast**: All text meets WCAG AA (4.5:1) requirements
