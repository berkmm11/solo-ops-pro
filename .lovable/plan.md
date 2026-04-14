
# soloops — AI-Powered Business Operations for Turkish Freelancers

## Overview
A minimalist, grayscale SaaS app with Turkish UI, email/password auth, and a sidebar navigation shell. No database tables yet — just the structure, auth, and empty module pages.

## Design System
- Pure grayscale palette: white background, #111827 text, #6B7280 secondary, #E5E7EB borders
- Inter font throughout, no gradients, no shadows, no color
- Black buttons with white text, subtle hover states
- Generous whitespace, clean card layouts

## Pages & Components

### Auth Pages
- **Login** (`/login`) — centered card with email/password fields, "Giriş Yap" button, link to register
- **Register** (`/register`) — centered card with email/password/confirm fields, "Kayıt Ol" button, link to login
- Protected route wrapper redirecting unauthenticated users to `/login`
- Post-login redirect to `/dashboard`

### App Shell
- Collapsible sidebar with icon+label navigation using shadcn Sidebar
- Logo/wordmark "soloops" at top of sidebar
- Navigation items:
  - Komuta Merkezi (Dashboard) — `LayoutDashboard` icon
  - Müşteriler (Clients) — `Users` icon
  - Projeler (Projects) — `FolderKanban` icon
  - Faturalar (Invoices) — `FileText` icon
  - Giderler (Expenses) — `Receipt` icon
- User email + logout button at sidebar bottom
- Header with sidebar trigger

### Module Pages (placeholder shells)
- `/dashboard` — "Komuta Merkezi" heading, empty state message
- `/clients` — "Müşteriler" heading, empty state
- `/projects` — "Projeler" heading, empty state
- `/invoices` — "Faturalar" heading, empty state
- `/expenses` — "Giderler" heading, empty state

### 404 Page
- Minimal "Sayfa bulunamadı" page

## Backend
- Connect Supabase (Lovable Cloud) for auth only
- No tables, no RLS policies yet
- Email/password auth enabled

## File Structure
- `src/pages/Login.tsx`, `Register.tsx`, `Dashboard.tsx`, `Clients.tsx`, `Projects.tsx`, `Invoices.tsx`, `Expenses.tsx`
- `src/components/AppSidebar.tsx`, `src/components/AppLayout.tsx`, `src/components/ProtectedRoute.tsx`
- Update `index.css` with grayscale design tokens and Inter font import
- Update `App.tsx` with all routes
