# SOFTWORKS IT FARM — Full-Stack Platform

## Overview
A premium digital platform for SOFTWORKS IT FARM — a tech studio. Built as a full-stack monorepo with:
1. **Public Website** — Dark-mode glassmorphism design with all marketing pages
2. **Admin CMS Panel** — Full content management for all website data
3. **HR Management System** — Employees, Attendance, Leave Requests, Payroll

## Architecture

### Monorepo Structure (pnpm workspaces)
```
artifacts/
  softworks/      → React + Vite frontend (web, public + admin)
  api-server/     → Express 5 REST API backend
lib/
  db/             → Drizzle ORM + PostgreSQL schema + migrations
  api-client-react/ → Generated React Query hooks (OpenAPI)
```

### Database (PostgreSQL via Drizzle ORM)
Tables: `services`, `portfolio`, `blog`, `leads`, `testimonials`, `team`, `saas_products`, `employees`, `attendance`, `leaves`, `payroll`, `projects`, `clients`

Seed script: `lib/db/src/seed.ts` — run with:
```bash
DATABASE_URL=$DATABASE_URL node_modules/.bin/tsx lib/db/src/seed.ts
```

Push schema changes:
```bash
cd lib/db && pnpm run push
```

### API Routes (Express 5, all mounted at /api)
- `GET/POST /api/services`, `PUT/DELETE /api/services/:id`
- `GET/POST /api/portfolio`, `PUT/DELETE /api/portfolio/:id`
- `GET/POST /api/blog`, `PUT/DELETE /api/blog/:id`
- `POST /api/contact` (creates lead), `GET /api/leads`, `PUT /api/leads/:id`
- `GET/POST /api/testimonials`, `PUT/DELETE /api/testimonials/:id`
- `GET/POST /api/team`, `PUT/DELETE /api/team/:id`
- `GET/POST /api/saas-products`, `PUT/DELETE /api/saas-products/:id`
- `GET/POST /api/employees`, `GET/PUT/DELETE /api/employees/:id`
- `GET/POST /api/attendance`
- `GET/POST /api/leaves`, `PUT /api/leaves/:id` (approve/reject)
- `GET/POST /api/payroll`
- `GET/POST /api/projects`, `GET/PUT/DELETE /api/projects/:id`
- `GET/POST /api/clients`, `GET/PUT/DELETE /api/clients/:id`
- `GET /api/dashboard/stats`
- `GET /api/dashboard/recent-leads`
- `GET /api/dashboard/project-summary`
- `GET /api/dashboard/hr-summary`

### Frontend Routes
**Public:**
- `/` — HomePage (hero, stats, services preview, portfolio, testimonials)
- `/about` — AboutPage (team, mission)
- `/services` — ServicesPage (filtered by category, Lucide icons)
- `/portfolio` — PortfolioPage (filtered, with images)
- `/saas` — SaasPage (product cards with pricing)
- `/blog` — BlogPage (filtered by category)
- `/blog/:slug` — BlogPostPage (full article)
- `/contact` — ContactPage (form → POST /api/contact)

**Admin (under `/admin/*`):**
- `/admin` — DashboardPage (live stats from API)
- `/admin/services` — ServicesAdminPage (CRUD)
- `/admin/portfolio` — PortfolioAdminPage (CRUD)
- `/admin/saas-products` — SaasAdminPage (CRUD)
- `/admin/blog` — BlogAdminPage (CRUD)
- `/admin/testimonials` — TestimonialsAdminPage (CRUD)
- `/admin/team` — TeamAdminPage (CRUD)
- `/admin/clients` — ClientsAdminPage (CRUD)
- `/admin/projects` — ProjectsAdminPage (CRUD)
- `/admin/leads` — LeadsAdminPage (status management)
- `/admin/employees` — EmployeesAdminPage (CRUD)
- `/admin/attendance` — AttendancePage (daily tracking)
- `/admin/leaves` — LeavesPage (approve/reject)
- `/admin/payroll` — PayrollPage (salary management)

## Design System
- **Theme:** Dark mode default (navy/indigo background)
- **Gradients:** `gradient-text` class, deep indigo to purple/cyan
- **Cards:** `gradient-border` glassmorphism with glow effects
- **Accents:** Neon cyan (#00d4ff) and violet (#7c3aed)
- **CSS utilities:** `.gradient-text`, `.glass`, `.gradient-border`, `.glow-primary`, `.glow-accent`, `.grid-pattern`

## Key Conventions
- Express 5: handlers typed as `Promise<void>`, use `res.status().json(); return;` for early exits
- Zod imports: use `zod/v4` in the workspace (not `zod`)
- API hooks: without params → `useHook(options?)`, with params → `useHook(params?, options?)`
- Cache invalidation: `const { queryKey } = useListX(); qc.invalidateQueries({ queryKey })`
- Icon rendering: `service.icon` is a string name → map to Lucide component via `iconMap`

## Workflows
- `artifacts/softworks: web` — Vite dev server for React frontend
- `artifacts/api-server: API Server` — Express API with esbuild bundling
