# Frontend

## Stack

| Technology        | Purpose                                  |
| ----------------- | ---------------------------------------- |
| Next.js 16.2      | React framework (App Router)             |
| Tailwind CSS 4    | Utility-first styling                    |
| Lucide React      | Icon library                             |
| Recharts 3.8      | Charts and data visualization            |
| Framer Motion 12  | Animations and transitions               |
| Zustand 5         | Client state management                  |
| TanStack Query 5  | Server state, caching, loading states    |
| React Hook Form 7 | Form management                          |
| Zod v4            | Schema validation                        |
| Sonner 2          | Toast notifications                      |
| Radix UI          | Accessible dialog and tooltip primitives |
| cmdk 1.1          | Command palette (CMD+K)                  |
| next-themes       | Dark mode support                        |

## Routes (39 total)

### Public

| Route             | Page     | Description                                                   |
| ----------------- | -------- | ------------------------------------------------------------- |
| `/`               | Landing  | Hero, features, portals, stats, CTA, footer                   |
| `/login`          | Login    | Email/password with validation, loading state, toast          |
| `/register`       | Register | Multi-step 5-page membership application form (IBDA Bio Data) |
| `/password/reset` | Reset    | Email input with success state                                |
| `/terms`          | Terms    | Terms of Service                                              |
| `/privacy`        | Privacy  | Privacy Policy                                                |

### Dashboard (authenticated)

| Route                 | Page               | Description                                              |
| --------------------- | ------------------ | -------------------------------------------------------- |
| `/dashboard`          | Overview           | Stats, charts, recent transactions, upcoming payments    |
| `/application-status` | Application Status | Applicant sees Pending/Approved/Rejected status tracking |

### Chairman (chairman role)

| Route       | Page               | Description                                               |
| ----------- | ------------------ | --------------------------------------------------------- |
| `/chairman` | Chairman Dashboard | View-only oversight dashboard with expense approve/reject |

### Admin

| Route                        | Page                                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------------- |
| `/admin/members`             | Member list with DataTable                                                                |
| `/admin/members/create`      | Add new member form                                                                       |
| `/admin/members/[id]`        | Member dashboard detail (profile, account details, transactions, social welfare, remarks) |
| `/admin/members/[id]/edit`   | Edit member + dashboard fields (shares, support status/debt, remarks)                     |
| `/admin/applications`        | Application management (list, filter, review)                                             |
| `/admin/applications/[id]`   | Application detail view with approve/reject actions                                       |
| `/admin/savings-accounts`    | Account management                                                                        |
| `/admin/transactions`        | Transaction history                                                                       |
| `/admin/transactions/create` | New transaction form                                                                      |
| `/admin/loans`               | Loan management                                                                           |
| `/admin/expenses`            | Expense tracking                                                                          |
| `/admin/reports`             | Report generator                                                                          |
| `/admin/users`               | User management                                                                           |
| `/admin/settings`            | System settings                                                                           |
| `/admin/interest`            | Interest calculator                                                                       |
| `/admin/deposit-requests`    | Pending deposits                                                                          |
| `/admin/withdraw-requests`   | Pending withdrawals                                                                       |
| `/admin/bank-accounts`       | Bank account management                                                                   |
| `/admin/payment-gateways`    | Payment gateway config                                                                    |
| `/admin/welfare`             | Welfare program admin                                                                     |

### Member Portal

| Route                  | Page                       |
| ---------------------- | -------------------------- |
| `/portal/savings`      | My savings accounts        |
| `/portal/loans`        | My loans + calculator      |
| `/portal/transactions` | My transaction history     |
| `/portal/deposits`     | Make a deposit             |
| `/portal/withdrawals`  | Request withdrawal         |
| `/portal/welfare`      | Welfare programs + pledges |
| `/portal/help`         | Help & support articles    |

### Profile

| Route                      | Page            |
| -------------------------- | --------------- |
| `/profile`                 | Edit profile    |
| `/profile/change-password` | Change password |

## Role-Based Sidebar Navigation

The sidebar dynamically renders navigation items based on the authenticated user's role:

| Role         | Sidebar Items                                                                                                                                                                      |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Admin**    | Dashboard, Members, Applications, Accounts, Transactions, Loans, Expenses, Welfare, Users, Settings, Reports, Interest, Bank Accounts, Payment Gateways, Deposit/Withdraw Requests |
| **Chairman** | Chairman Dashboard, Expenses (approve/reject only)                                                                                                                                 |
| **Staff**    | Dashboard, Members, Accounts, Transactions, Loans, Deposit/Withdraw Requests                                                                                                       |
| **Member**   | Portal (Savings, Loans, Transactions, Deposits, Withdrawals, Welfare, Help)                                                                                                        |

### Auth Guard Redirects

On login, users are redirected based on their role:

| Role     | Redirect     |
| -------- | ------------ |
| admin    | `/dashboard` |
| chairman | `/chairman`  |
| staff    | `/dashboard` |
| member   | `/portal`    |

## Multi-Step Registration Form

The `/register` route implements a 5-step form wizard for the IBDA Bio Data membership application:

| Step | Name      | Fields                                                                            |
| ---- | --------- | --------------------------------------------------------------------------------- |
| 1    | General   | Surname, first name, other names, sex, date of birth, national ID, phone, email   |
| 2    | Places    | Birth place/district, ancestral home/district, current residence/district         |
| 3    | Work      | Occupation, employer, work address                                                |
| 4    | Family    | Father name/status, mother name/status, clan, totem, spouses, children, relatives |
| 5    | Documents | Passport photo, national ID photo, signature                                      |

Each step validates independently before allowing progression. The form state persists across steps.

## Component Library

### Layout Components

| Component         | File                                | Description                                                                                         |
| ----------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Sidebar`         | `components/sidebar.tsx`            | Glass-dark sidebar, collapsible on mobile, Escape key close, section dividers, role-based nav items |
| `DashboardHeader` | `components/dashboard-header.tsx`   | Glass header, CMD+K search, theme toggle, notifications, profile dropdown                           |
| `MobileNav`       | `components/mobile-nav.tsx`         | Landing page mobile navigation with login portal dropdown                                           |
| `LoginDropdown`   | `components/login-dropdown.tsx`     | Portal selection dropdown (Admin/Member/Staff)                                                      |
| `Breadcrumb`      | `components/ui/breadcrumb.tsx`      | Auto-generated from pathname                                                                        |
| `CommandPalette`  | `components/ui/command-palette.tsx` | CMD+K search across all pages                                                                       |
| `ScrollToTop`     | `components/ui/scroll-to-top.tsx`   | Floating scroll button                                                                              |

### Data Components

| Component                  | File                              | Description                                                                                    |
| -------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------- |
| `DataTable`                | `components/data-table.tsx`       | Sortable columns, search, pagination, CSV export, mobile card view, loading/empty/error states |
| `StatCard`                 | `components/stat-card.tsx`        | Glass stat card with icon, value, change indicator                                             |
| `DepositsWithdrawalsChart` | `components/dashboard-charts.tsx` | Area chart                                                                                     |
| `ExpenseChart`             | `components/dashboard-charts.tsx` | Pie chart                                                                                      |
| `LoanChart`                | `components/dashboard-charts.tsx` | Bar chart                                                                                      |

## Admin Member Dashboard (`/admin/members/[id]`)

The admin member detail route is a dossier-style dashboard with these sections:

- **Member Profile**: identity, contacts, bio-data links (clan/totem/work/family counts).
- **Account Details**: account numbers, types, status, balances, share count, outstanding debt.
- **Transactions**: first/latest deposit, deposit/withdrawal totals, monthly subscription aggregate, recent activity stream.
- **Social Welfare**: weddings + condolences support status, related debt totals, welfare pledges snapshot.
- **Remarks**: freeform notes persisted on the member record.

### UI Primitives

| Component                               | File                               | Description                                                  |
| --------------------------------------- | ---------------------------------- | ------------------------------------------------------------ |
| `Skeleton`                              | `components/ui/skeleton.tsx`       | Shimmer skeleton + StatSkeleton, TableSkeleton, CardSkeleton |
| `ConfirmDialog`                         | `components/ui/confirm-dialog.tsx` | Radix dialog, default/destructive variants                   |
| `FormField`                             | `components/ui/form-field.tsx`     | Input with label, icon, error, helpText, ARIA                |
| `SecurityBadge`                         | `components/ui/security-badge.tsx` | SSL encryption badge                                         |
| `FadeIn` / `SlideUp` / `PageTransition` | `components/motion.tsx`            | Framer Motion wrappers                                       |
| `Providers`                             | `components/providers.tsx`         | QueryClient + ThemeProvider + Toaster + TooltipProvider      |

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

### Accessibility (WCAG 2.1 AA)

- **Skip-to-content**: Hidden link, visible on focus
- **Focus-visible**: 2px primary outline on all focusable elements
- **ARIA**: `role="grid"` on DataTable, `aria-label` on navigation and interactive elements, `aria-invalid` on form errors
- **Semantic sections**: Proper use of `<main>`, `<nav>`, `<section>`, `<header>` elements
- **Sticky headers**: Dashboard header stays visible during scroll for context
- **Touch targets**: Minimum 44x44px touch targets for mobile interactions
- **Keyboard**: Escape closes sidebar/modals, CMD+K opens command palette
- **Contrast**: All text meets WCAG AA (4.5:1) requirements
