# Release Notes Draft

## Summary

This release hardens production safety, aligns documentation, and improves assistant architecture consistency.

## Included Changes

### Security and Reliability

- Added centralized environment validation:
  - `lib/config/public-env.ts`
  - `lib/config/server-env.ts`
  - `lib/config/auth-env.ts`
- Wired Supabase clients and middleware to validated env values.
- Added explicit OpenAI key enforcement in chat route.
- Added strict screenshot URL validation for credit purchase submissions.
- Feature-flagged temporary admin email fallback with default disabled behavior.

### Assistant Architecture

- Replaced hardcoded assistant lists in chat flow with DB-backed active assistants.
- Chat API now validates `assistantSlug` against active records.
- Dashboard and project pages fetch active assistants from DB and pass typed options.
- Assistant cards now use deterministic icons based on provider.

### Testing

- Added Vitest setup and scripts.
- Added initial unit tests for:
  - Role/account type logic
  - URL validation helper
  - Route handlers:
    - `POST /api/chat`
    - `POST /api/credit-purchases`

### Documentation

- Rewrote README to match current repository structure and deployment expectations.
- Added/updated architecture and remediation docs.

## Breaking/API Notes

- `POST /api/chat` request body now requires `assistantSlug` (replacing implicit free-form assistant type in previous behavior).

## Suggested Commit Message

`feat: harden env/auth safety, db-source assistants, and add vitest route coverage`

## Suggested Changelog Entry

- Hardened runtime configuration and admin fallback behavior.
- Moved chat assistants to database-backed source of truth.
- Added deterministic assistant provider icon mapping.
- Added Vitest and initial route/unit test coverage.
- Updated README and architecture/remediation docs.
