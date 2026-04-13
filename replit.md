# SOFTWORKS IT FARM — Full-Stack Platform

## Overview
A premium digital platform for SOFTWORKS IT FARM — a tech studio. Built as a full-stack monorepo with:
1. **Public Website** — Dark-mode glassmorphism design with all marketing pages
2. **Admin CMS Panel** — Full content management for all website data
3. **HR Management System** — Employees, Attendance, Leave Requests, Payroll
4. **Enterprise Auth** — Dual-token JWT, bcrypt, CSRF, refresh token rotation (DB), session tracking, audit logs, account lockout, RBAC + permissions
5. **SaaS Features** — Subscription plans (free/pro/enterprise), feature flags, multi-tenant foundation, job queue (DB-backed), SSE real-time events
6. **Observability** — /ready endpoint, Prometheus metrics (/api/metrics), Swagger docs (/api/docs), structured JSON logging
7. **Security** — Helmet, rate limiting, CORS, compression, account lockout after 5 failures
8. **Docker/VPS Ready** — docker-compose.yml, multi-stage Dockerfiles, nginx.conf, DB backup script (scripts/backup-db.mjs)

## Deployment Targets
- **Vercel**: `vercel.json` + `scripts/build-vercel.mjs` → frontend static + `api/index.mjs` serverless
- **Railway/Render**: `scripts/build-production.mjs` → unified server (API serves frontend static files)
- **Docker/VPS**: `docker-compose.yml` → api + web (nginx) containers
- **NO Replit dependency** in production code

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
Tables: `services`, `portfolio`, `blog`, `leads`, `testimonials`, `team`, `saas_products`, `employees`, `attendance`, `leaves`, `payroll`, `projects`, `clients`, `licenses`, `license_products`, `license_activations`, `license_payments`, `license_logs`, `api_keys`, `payment_methods`, `faqs`, `invoices`, `jobs`, `newsletter_subscribers`

Auth tables: `refresh_tokens` (token_hash, username, role, ip, user_agent, expires_at, is_revoked), `audit_logs` (username, action, resource, ip, status, created_at)

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
- `GET/POST /api/faqs`, `PUT/DELETE /api/faqs/:id`
- `GET/POST /api/invoices`, `PUT/DELETE /api/invoices/:id`
- `GET/POST /api/jobs`, `PUT/DELETE /api/jobs/:id`
- `GET /api/newsletter`, `POST /api/newsletter/subscribe`, `DELETE /api/newsletter/:id`
- **DB: Neon PostgreSQL** — `NEON_DATABASE_URL` env var (read before `DATABASE_URL` in `lib/db.ts`)
- `GET /api/openai/conversations`, `POST /api/openai/conversations`, `GET /api/openai/conversations/:id`
- `POST /api/openai/conversations/:id/messages` (streaming SSE, GPT-5.2)
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

### Military-Grade License Management System
**Database Tables:** `licenses` (enhanced), `license_products`, `license_activations`, `license_payments`, `license_logs`

**License API Endpoints:**
- `POST /api/license/activate` — Domain/IP/hardware bind with activation limits
- `POST /api/license/validate` — HMAC signed validation response
- `POST /api/license/heartbeat` — Periodic check-in
- `POST /api/license/deactivate` — Remove activation
- `GET /api/license/check/:key` — Public verification
- `GET /api/license-stats` — Dashboard statistics

**Admin License Actions:**
- `POST /api/licenses/:id/activate` | `suspend` | `blacklist` | `unblacklist`
- `POST /api/licenses/:id/kill-switch` | `reset-activations`
- `POST /api/licenses/:id/mark-paid` | `mark-overdue`

**License Key Format:** `SW-XXXX-XXXX-XXXX`
**Signing:** HMAC-SHA256 with `LICENSE_SIGNING_SECRET` env var
**Rate Limiting:** In-memory Map, 60 req/min per IP
**Grace Period:** 3 days | **Trial:** 7 days

**Client SDKs:**
- JavaScript/Node.js: `/sdk/softworks-license.js` (browser + Node dual support)
- PHP: `/sdk/softworks-license.php` (cURL-based, fingerprinting, enforceOrDie)

**Shield SDKs (Tamper-Proof):**
- JS Shield: `/sdk/softworks-shield.js` — Anti-debug, anti-tamper, DOM mutation observer, self-healing, multi-layer heartbeat
- PHP Shield: `/sdk/softworks-shield.php` — File integrity check, shutdown hook, HMAC signed comms, singleton pattern
- Shield API: `POST /api/shield-verify` — Verifies SDK integrity, logs tampering attempts

**Stealth SDKs (Invisible — looks like analytics/caching library):**
- JS Stealth: `/sdk/sw-perf.js` — Disguised as "WebPerf Analytics Core v4.2.1". Global: `WebPerf` (frozen). Auto-init: `data-wp-key` + `data-wp-endpoint`. Manual: `WebPerf.track({k,b,c})`. Uses X-WP-Nonce/X-WP-Auth headers.
- PHP Stealth: `/sdk/sw-cache.php` — Disguised as "PageCache v4.2". Class: `PageCache`. Auto-init via `WP_CACHE_KEY`/`WP_CACHE_API` env vars. Uses X-Cache-Token headers.
- Both use same license API endpoints under the hood, completely unrecognizable as license protection

**Admin License Pages:**
- `/admin/licenses` — Full CRUD with kill switch, reset activations, blacklist/unblacklist
- `/admin/license-dashboard` — Analytics dashboard
- `/admin/license-products` — Product management
- `/admin/license-activations` — Activation logs
- `/admin/license-payments` — Payment recording
- `/admin/license-logs` — Real-time audit trail

**Public:** `/verify-license` — License verification with SDK integration guide

### Bangladesh Payment Methods (55 total)
- 14 MFS (bKash Personal/Merchant/Agent, Nagad, Rocket, Upay, etc.)
- 28 Banks (all major Bangladeshi banks)
- 4 Payment Gateways (SSLCOMMERZ, ShurjoPay, AamarPay, PortWallet)
- 4 Card payments, 5 International
- Custom SVG logos, Bangla UI
- Reseed endpoint: `POST /api/payment-methods/reseed`

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

## Critical Vercel Compatibility Notes
### NEVER DO THESE (cause 30s FUNCTION_INVOCATION_TIMEOUT):
1. **`serverless-http v4`** — DO NOT use. Its Promise never resolves on Vercel Lambda request objects.
   - FIX: Call the raw Express `app(req, res, next)` directly from `api/index.mjs`
2. **`pg` (node-postgres) in serverless bundle** — DO NOT import. TCP connections hang in Vercel Lambda.
   - FIX: Use `@neondatabase/serverless` + `drizzle-orm/neon-http` in `artifacts/api-server/src/lib/db.ts`
   - `lib/db/src/index.ts` still uses pg.Pool for local seeding ONLY — never import this in api-server routes
3. **Route files importing `@workspace/db"`** — This imports `lib/db/src/index.ts` which has `import pg from "pg"` — pulls pg into bundle
   - FIX: All routes import from `@workspace/db/schema"` instead
4. **`pino`/`pino-http`/`esbuild-plugin-pino`** — Spawns worker threads that block on Vercel Lambda init
   - FIX: Use simple console.log-based logger in `artifacts/api-server/src/lib/logger.ts`

### DB Driver Architecture (MUST NOT MERGE):
- `artifacts/api-server/src/lib/db.ts` = Neon HTTP driver ONLY (`@neondatabase/serverless` + `drizzle-orm/neon-http`)
- `lib/db/src/index.ts` = pg.Pool ONLY for local/seed scripts. Never bundled into serverless.mjs.

### Vercel Lambda Entry Point Pattern:
- `api/index.mjs` calls `app(req, res, next)` directly
- Bundle loaded at init time (top-level `appPromise`) for warm Lambda reuse
- When Express doesn't find a route, `next()` is called — must manually send 404

### DB URL Priority (used in both db files):
`DATABASE_URL_UNPOOLED` → `POSTGRES_URL_NON_POOLING` → `NEON_DATABASE_URL` → `POSTGRES_URL` → `DATABASE_URL`
