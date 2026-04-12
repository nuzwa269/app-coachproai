# CoachPro AI Architecture and Endpoint Matrix

This document provides a handoff-ready architecture map and API inventory aligned with the current repository.

## System Architecture

```mermaid
flowchart TD
  A[Browser Client] --> B[Next.js App Router]
  B --> C[Route Groups]
  C --> C1[(auth)]
  C --> C2[(dashboard)]
  C --> C3[(admin)]

  B --> D[Route Handlers /app/api/*]
  D --> D1[/api/chat]
  D --> D2[/api/projects]
  D --> D3[/api/saved-outputs]
  D --> D4[/api/credit-packs]
  D --> D5[/api/credit-purchases]
  D --> D6[/api/admin/*]

  B --> E[proxy.ts]
  E --> F[Supabase Session Refresh + Guarding]

  C2 --> G[Client Components]
  G --> H[useChat + fetch APIs]

  D --> I[Supabase Server Client]
  C --> I
  I --> J[(PostgreSQL via Supabase)]
  J --> J1[Tables + RLS Policies]
  J --> J2[RPC: deduct_credit]
  J --> J3[RPC: review_credit_purchase]

  D1 --> K[OpenAI via Vercel AI SDK]
```

## Module Boundaries

- UI components
  - `components/ui/*`, `components/dashboard/*`, `components/chat/*`, `components/admin/*`
- Page and route orchestration
  - `app/*`
- Server auth and access checks
  - `lib/auth/roles.ts`
  - `lib/auth/server-roles.ts`
- Supabase access layer
  - `lib/supabase/client.ts`
  - `lib/supabase/server.ts`
  - `lib/supabase/middleware.ts`
- Environment config
  - `lib/config/public-env.ts`
  - `lib/config/server-env.ts`
  - `lib/config/auth-env.ts`
- Database schema and policy source of truth
  - `supabase/migrations/*.sql`
  - `types/database.ts`

## Routing and Entry Points

- Root layout and metadata
  - `app/layout.tsx`
- Public landing
  - `app/page.tsx`
- Route protection entry
  - `proxy.ts`
- Dashboard route shell
  - `app/(dashboard)/layout.tsx`
- Admin route shell
  - `app/(admin)/admin/layout.tsx`

## Auth and Authorization Flow

1. Request enters `proxy.ts`.
2. `updateSession()` refreshes Supabase session and resolves user.
3. Route checks:
   - `/dashboard*` requires authenticated user.
   - `/admin*` and `/api/admin*` require admin role.
4. Server routes and server actions additionally enforce with:
   - `requireAuth()`
   - `requireAdmin()`
   - `requireSuperAdmin()` where needed.
5. Database RLS provides data-level isolation and admin policies.

## API Endpoint Matrix

| Area | Path | Methods | Auth | Purpose |
|---|---|---|---|---|
| Auth | `/auth/callback` | GET | Public | Exchange OAuth code for session |
| Auth | `/auth/confirm` | GET | Public | Verify OTP/email confirmation |
| Chat | `/api/chat` | POST | Required | Deduct credit and stream AI response |
| Projects | `/api/projects` | GET, POST | Required | List and create user projects |
| Projects | `/api/projects/[id]` | GET, PATCH, DELETE | Required | CRUD for owned project |
| Saved outputs | `/api/saved-outputs` | GET, POST | Required | List and save output for user/project |
| Credits | `/api/credit-packs` | GET | Required | List active credit packs |
| Credits | `/api/credit-purchases` | GET, POST | Required | User purchase history and submission |
| Admin credits | `/api/admin/credit-purchases` | GET, PATCH | Admin | Review purchases, export CSV |
| Admin users | `/api/admin/users` | GET, PATCH | Admin | Search/update users and roles |
| Admin assistants | `/api/admin/assistants` | GET, POST, PATCH | Admin | Manage assistant catalog |

## Database and RPC Summary

- Core user/project tables:
  - `profiles`, `projects`, `saved_outputs`, `chat_messages`
- Monetization tables:
  - `credit_packs`, `credit_purchases`, `credit_ledger`
- Admin control-plane tables:
  - `assistants`, `admin_event_logs`, `admin_templates`, `admin_knowledge_sources`, `admin_settings`
- Key RPCs:
  - `deduct_credit(p_user_id)`
  - `add_credits(p_user_id, p_amount)`
  - `review_credit_purchase(p_purchase_id, p_action, p_admin_notes)`

## Build and Tooling Snapshot

- Scripts: `dev`, `build`, `start`, `lint`
- Framework: Next.js 16 App Router
- Language: TypeScript strict
- Styling: Tailwind v4
- Linting: ESLint + Next config
- Tests: no configured test framework in repository

## Known Architectural Risks

- Temporary admin email fallback exists and must remain disabled in production unless explicitly needed.
- No built-in rate limiting for chat endpoint.
- Test coverage is currently minimal and focused on utility/auth helpers.

## Recent Hardening Updates

- Assistant selection and persona resolution are now sourced from active `assistants` records.
- Chat endpoint validates `assistantSlug` against active assistants before generating.
- Startup env validation is centralized for public and server env requirements.
