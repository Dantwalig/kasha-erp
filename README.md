# Kasha ERP

A modular ERP system inspired by Microsoft Dynamics 365 — built module by module.

## Stack

- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend:** NestJS, TypeScript
- **Database:** PostgreSQL via Prisma ORM
- **Cache/Sessions:** Redis (added when we need it — not required to run Step 1)
- **Auth:** JWT (access + refresh tokens), RBAC (Role + Permission based)
- **Infra:** Docker Compose for local Postgres/Redis

We're deliberately starting **simple** (a modular monolith, single Postgres DB) and structuring the
code so we can carve out microservices, add Kafka/Elasticsearch, or split databases later **without
a rewrite**. Every module lives in its own NestJS module folder with its own Prisma models, so it can
be lifted out later if needed.

## Module Build Order

1. ✅ **Auth & RBAC** — users, roles, permissions, JWT login/register
2. ✅ **Inventory** — products, categories, locations, stock levels, transfers, adjustments
3. ✅ **Procurement** — suppliers, purchase requests with approval workflow, purchase orders with receiving (this step)
4. Warehouse Management — receiving, picking, packing, shipping
5. Finance — GL, invoices, payments, budgets, assets
6. CRM — leads, customers, opportunities, pipeline
7. HR — employees, leave, recruitment, payroll
8. Reporting & Dashboards
9. Remaining modules (Supply Chain, Customer Service, Marketing, Field Service, Manufacturing,
   Commerce, Workflow Automation, Notifications, Audit Logs, AI & Analytics) — added incrementally
   after the core is solid.

## Project Structure

```
kasha-erp/
├── backend/          NestJS API
│   ├── prisma/        schema.prisma, migrations, seed script
│   └── src/
│       ├── auth/       login/register, JWT strategy, guards, decorators
│       ├── users/      user CRUD
│       ├── roles/      role CRUD
│       ├── permissions/ permission CRUD
│       ├── prisma/     PrismaService (injectable DB client)
│       └── common/     shared filters/interceptors
├── frontend/         Next.js app
│   └── src/
│       ├── app/        pages (login, register, dashboard)
│       ├── lib/        API client, auth context
│       └── components/
└── docker-compose.yml  Postgres + Redis for local dev
```

## Branding

The UI follows the Kasha 2023 Branding Guidelines:
- **Colors:** Blue `#1E499F` (Enterprises — used as primary here since this is an internal ERP), Pink `#E2156A` (Consumers), Yellow `#EBCD1A` (Retailers/Health), Black, Light Grey `#EEEEEE`.
- **Typography:** Nunito Sans (ExtraBold for headlines, SemiBold for body), loaded via `next/font/google`.
- **Logo:** `src/components/KashaLogo.tsx` recreates the wordmark and 3-triangle mark from the guide's described geometry (pink/yellow/blue, yellow always centered, uniform size, same plane) — no source logo file was provided, so if you have the real logo asset, swap it in here.
- **Tagline:** "ACCESS. CHOICE. TRUST." appears on the navbar and auth pages.

## Getting Started (using Supabase)

### 1. Get your connection strings from Supabase

In your Supabase project: **Project Settings -> Database -> Connection string**.

You need **two** URLs (Supabase shows both):
- **Transaction pooler** (port `6543`) -> use for `DATABASE_URL`
- **Direct connection** (port `5432`) -> use for `DIRECT_URL` (Prisma needs this for migrations, since PgBouncer's pooled connection doesn't support everything migrations require)

### 2. Backend setup

```bash
cd backend
cp .env.example .env
```

Paste your two Supabase connection strings into `.env` as `DATABASE_URL` and `DIRECT_URL`, then:

```bash
npm install
npx prisma migrate dev --name init
npm run seed
npm run start:dev
```

The API runs at `http://localhost:3001`. It seeds:
- Roles: `admin`, `manager`, `employee`
- Permissions: a starter set (`users:read`, `users:write`, `roles:manage`, etc.)
- One admin user: `admin@kasha.dev` / `Admin123!`

### 3. Frontend setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The app runs at `http://localhost:3000`. Log in with the seeded admin account.

### Redis (not needed yet)

Redis isn't used by the code yet — we'll add it (and instructions for it, local or a hosted option like Upstash) when a module actually needs caching/sessions.

<details>
<summary>Alternative: running Postgres locally via Docker instead of Supabase</summary>

If you ever want a local DB instead:
```bash
docker compose up -d
```
This starts Postgres on `localhost:5432` and Redis on `localhost:6379`, matching the `docker-compose.yml` in this repo. Then set `DATABASE_URL` (and `DIRECT_URL` to the same value, since there's no pooler locally) to:
```
postgresql://kasha:kasha@localhost:5432/kasha_erp?schema=public
```
</details>

## API Endpoints (Step 1)

| Method | Path                  | Description                    | Auth required |
|--------|-----------------------|---------------------------------|----------------|
| POST   | /auth/register        | Create a new user               | No             |
| POST   | /auth/login            | Get access + refresh tokens     | No             |
| POST   | /auth/refresh          | Rotate access token              | Refresh token  |
| GET    | /auth/me                | Current user + roles/permissions | Yes           |
| GET    | /users                  | List users                       | `users:read`  |
| GET    | /roles                  | List roles                       | `roles:read`  |
| POST   | /roles                  | Create role                      | `roles:manage`|
| GET    | /permissions            | List permissions                 | `roles:read`  |
| GET    | /inventory/categories   | List categories                  | `inventory:read` |
| POST   | /inventory/categories   | Create category                  | `inventory:write` |
| GET    | /inventory/products     | List products (with total stock) | `inventory:read` |
| GET    | /inventory/products/:id | Get one product                  | `inventory:read` |
| POST   | /inventory/products     | Create product                   | `inventory:write` |
| PATCH  | /inventory/products/:id | Update product                   | `inventory:write` |
| DELETE | /inventory/products/:id | Deactivate product (soft delete) | `inventory:write` |
| GET    | /inventory/locations    | List locations                   | `inventory:read` |
| POST   | /inventory/locations    | Create location                  | `inventory:write` |
| GET    | /inventory/stock/levels | Current stock by product/location | `inventory:read` |
| GET    | /inventory/stock/transfers | List transfers                | `inventory:read` |
| POST   | /inventory/stock/transfers | Create a transfer (PENDING)   | `inventory:write` |
| POST   | /inventory/stock/transfers/:id/complete | Complete transfer (moves stock) | `inventory:write` |
| POST   | /inventory/stock/transfers/:id/cancel | Cancel a transfer          | `inventory:write` |
| GET    | /inventory/stock/adjustments | List adjustments             | `inventory:read` |
| POST   | /inventory/stock/adjustments | Create adjustment (+/- qty)  | `inventory:write` |
| GET    | /procurement/suppliers | List suppliers                        | `procurement:read` |
| POST   | /procurement/suppliers | Create supplier                       | `procurement:write` |
| GET    | /procurement/requests  | List purchase requests                | `procurement:read` |
| POST   | /procurement/requests  | Submit a purchase request             | `procurement:write` |
| PATCH  | /procurement/requests/:id/approve | Approve a request          | `procurement:approve` |
| PATCH  | /procurement/requests/:id/reject | Reject a request (with reason) | `procurement:approve` |
| GET    | /procurement/orders    | List purchase orders                  | `procurement:read` |
| POST   | /procurement/orders    | Create a PO directly                  | `procurement:write` |
| POST   | /procurement/orders/from-request/:requestId | Create a PO from an approved request | `procurement:write` |
| PATCH  | /procurement/orders/:id/send | Mark PO as sent to supplier      | `procurement:write` |
| PATCH  | /procurement/orders/:id/cancel | Cancel a PO                     | `procurement:write` |
| POST   | /procurement/orders/:id/receive | Receive line item qty -> adds to Inventory stock | `inventory:write` |

## Roadmap note

Each future delivery will arrive as its own zip so you can commit incrementally:
`git init` once on the first zip, then for each subsequent zip, copy the new/changed files in and commit.
