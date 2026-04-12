# CoachPro AI

AI-powered development coach built with Next.js App Router, Supabase, and the Vercel AI SDK.

## Stack

- Next.js 16.2.2 + React 19 + TypeScript
- Tailwind CSS v4 + Radix UI components
- Supabase (PostgreSQL, Auth, RLS)
- Vercel AI SDK + OpenAI provider

## Quick Start

1. Install dependencies

```bash
npm install
```

2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Required variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
OPENAI_API_KEY=<your-openai-api-key>
ADMIN_EMAIL=<optional-admin-email@example.com>
ADMIN_EMAIL_FALLBACK_ENABLED=false
```

Notes:
- Keep `ADMIN_EMAIL_FALLBACK_ENABLED=false` in production unless you explicitly need temporary email-based admin fallback.
- The app now validates required environment variables at startup.

3. Apply Supabase migrations in order

Run each file from `supabase/migrations` sequentially:

1. `001_initial_schema.sql`
2. `002_credit_packs.sql`
3. `003_user_roles.sql`
4. `004_admin_assistants.sql`
5. `005_admin_control_plane.sql`
6. `006_account_types.sql`
7. `007_enforce_credit_purchase_relationships.sql`
8. `008_phase1_access_roles_account_types.sql`
9. `009_review_credit_purchase_rpc.sql`
10. `010_subscriber_on_approved_purchase.sql`

4. Run locally

```bash
npm run dev
```

Open http://localhost:3000.

## Scripts

- `npm run dev` Start development server
- `npm run build` Build for production
- `npm run start` Run production server
- `npm run lint` Run ESLint
- `npm run test` Run unit tests (Vitest)
- `npm run test:watch` Run tests in watch mode

## Architecture Overview

- App routes and pages: `app/`
- API routes: `app/api/`
- Auth callbacks: `app/auth/callback`, `app/auth/confirm`
- Route protection entry: `proxy.ts`
- Supabase middleware/session refresh: `lib/supabase/middleware.ts`
- Server role guards: `lib/auth/server-roles.ts`
- Shared typed schema: `types/database.ts`
- SQL schema and policies: `supabase/migrations/*.sql`

## Main Route Groups

- `(auth)` login and signup flows
- `(dashboard)` user workspace routes
- `(admin)` admin control plane routes

## API Surface

- User APIs
  - `POST /api/chat`
  - `GET,POST /api/projects`
  - `GET,PATCH,DELETE /api/projects/[id]`
  - `GET,POST /api/saved-outputs`
  - `GET /api/credit-packs`
  - `GET,POST /api/credit-purchases`
- Admin APIs
  - `GET,PATCH /api/admin/credit-purchases`
  - `GET,PATCH /api/admin/users`
  - `GET,POST,PATCH /api/admin/assistants`

## Notes

- Assistant selection in project chat is sourced from active records in the `assistants` table.
- Credits are enforced server-side via `deduct_credit` RPC before AI generation.
- Payment review is handled atomically via `review_credit_purchase` RPC.

## Additional Docs

- `DESIGN_SYSTEM.md`
- `DEVELOPMENT_PLAN.md`
- `docs/REMEDIATION_PLAN.md`
- `docs/ARCHITECTURE_AND_ENDPOINTS.md`
