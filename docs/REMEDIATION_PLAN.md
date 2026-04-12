# CoachPro AI Remediation Plan

This plan is ordered by operational impact and release risk. P0 items are either implemented now or immediately actionable.

## P0: Security and Reliability Hardening

### 1) Centralize and enforce environment validation

Status: Implemented

Files changed:
- `lib/config/public-env.ts`
- `lib/config/server-env.ts`
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/supabase/middleware.ts`
- `app/api/chat/route.ts`

Exact edit summary:
- Added `requirePublicEnv()` and strict exports for:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Added server-only `requireServerEnv()` and strict export for:
  - `OPENAI_API_KEY`
- Replaced direct `process.env...!` reads in Supabase clients/middleware with validated config constants.
- Added explicit key presence enforcement in chat route by importing `OPENAI_API_KEY` at module scope.

Why:
- Removes silent failures from missing environment values.
- Eliminates non-null assertion risk at runtime.

---

### 2) Feature-flag temporary admin email fallback

Status: Implemented

Files changed:
- `lib/config/auth-env.ts`
- `lib/auth/server-roles.ts`
- `lib/supabase/middleware.ts`
- `.env.local.example`

Exact edit summary:
- Introduced:
  - `ADMIN_EMAIL_FALLBACK_ENABLED` (boolean, default false)
  - `ADMIN_EMAIL` (normalized lowercase)
- Added config guard: if fallback is enabled but `ADMIN_EMAIL` is missing, throw explicit startup error.
- Updated admin fallback checks to require both:
  - feature flag enabled
  - matching verified email
- Added env example key:
  - `ADMIN_EMAIL_FALLBACK_ENABLED=false`

Why:
- Keeps emergency access path available only when intentionally enabled.
- Prevents accidental long-lived privilege bypass in production.

---

### 3) Validate payment proof URL input

Status: Implemented

Files changed:
- `app/api/credit-purchases/route.ts`

Exact edit summary:
- Added `isValidScreenshotUrl()` using `URL` parser and protocol allowlist (`http`, `https`).
- Rejects invalid `screenshot_url` with 400 error.
- Normalizes screenshot URL before persistence.

Why:
- Prevents malformed payload persistence and improves admin review quality.

## P1: Product Correctness and Consistency

### 4) Single source of truth for assistants

Status: Implemented

Files changed:
- `app/api/chat/route.ts`
- `components/chat/chat-panel.tsx`
- `app/(dashboard)/projects/[id]/page.tsx`
- `app/(dashboard)/dashboard/page.tsx`
- `components/dashboard/assistants-grid.tsx`
- `lib/assistants/types.ts`

Exact edit summary:
- Removed hardcoded assistant arrays from chat API and chat panel.
- API now requires `assistantSlug` and validates against active `assistants` table entries.
- Project and dashboard pages now fetch active assistants from Supabase.
- Chat panel and assistants grid now render from DB-provided options.
- Project assistant query param now uses assistant slug.

Risk reduced:
- Eliminates frontend/backend drift and stale persona logic.

---

### 5) Documentation alignment with actual structure

Status: Planned

Target files:
- `README.md`

Exact edits to implement:
- Replace references to `middleware.ts` with actual `proxy.ts` + `lib/supabase/middleware.ts` flow.
- Update migration setup from 2-file setup to full chain `001` through `010`.
- Remove/clarify mention of Anthropic runtime if not currently used by chat endpoint.
- Update project structure section to match real route groups and admin paths.

Risk reduced:
- Prevents onboarding and deployment misconfiguration.

## P2: Operational Hardening

### 6) Add API rate limiting for `/api/chat`

Status: Planned

Suggested implementation paths:
- Vercel-native edge protections or middleware-based per-user throttling.
- Supabase-backed rolling-window rate table.

Target files:
- `app/api/chat/route.ts`
- possibly `proxy.ts` or dedicated utility under `lib/`

---

### 7) Add focused regression tests

Status: Planned

Scope:
- Auth guards (`requireAuth`, `requireAdmin`)
- Credit purchase review RPC interactions
- Chat endpoint credit deduction and unauthorized paths

Potential stack:
- Vitest + React Testing Library + route-handler tests

## Release Checklist

- [ ] Set production env vars for new guard:
  - `ADMIN_EMAIL_FALLBACK_ENABLED=false`
  - remove `ADMIN_EMAIL` unless emergency path is needed
- [ ] Verify startup with missing envs fails fast in non-prod test environment
- [ ] Rebuild and redeploy
- [ ] Run smoke tests:
  - login/signup
  - chat send
  - buy credits submission
  - admin pages access control
