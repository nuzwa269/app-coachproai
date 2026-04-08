# CoachPro AI

An AI-powered development coach built with Next.js, Supabase, and the Vercel AI SDK.

## Tech Stack

- **Framework:** Next.js 16+ (App Router, TypeScript)
- **Styling:** Tailwind CSS v4 + Shadcn UI (brand colors from `DESIGN_SYSTEM.md`)
- **Database & Auth:** Supabase (PostgreSQL + Row Level Security)
- **AI Engine:** Vercel AI SDK + OpenAI API / Anthropic Claude *(Week 3)*
- **Payments:** Credit Pack system (JazzCash, Easypaisa, Bank Transfer, WhatsApp)
- **Hosting:** Vercel

---

## Getting Started

### 1. Clone & Install

```bash
git clone <repo-url>
cd app-coachproai
npm install
```

### 2. Setup Environment Variables

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

You can find these in your Supabase project dashboard under **Settings → API**.

### 3. Setup Supabase Database

1. Create a new project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Copy the contents of `supabase/migrations/001_initial_schema.sql` and run it.
4. Then run `supabase/migrations/002_credit_packs.sql` to add the credit pack tables and RPC functions.

This creates all tables (`profiles`, `projects`, `saved_outputs`, `chat_messages`, `credit_packs`, `credit_purchases`, `credit_ledger`), indexes, RLS policies, and triggers.

### 4. Configure Google OAuth (optional)

1. In Supabase go to **Authentication → Providers → Google**.
2. Enable it and add your Google OAuth credentials.
3. Add `https://<your-domain>/auth/callback` to the list of allowed redirect URLs.

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
app/
├── (auth)/          # Login & Signup pages (centered card layout)
│   ├── login/
│   ├── signup/
│   └── layout.tsx
├── (dashboard)/     # Protected routes (require auth)
│   ├── dashboard/
│   ├── projects/    # Project workspace with AI chat
│   ├── buy-credits/ # Buy Credits page + purchase history
│   ├── saved-outputs/ # Global saved outputs across all projects
│   ├── admin/
│   │   └── payments/ # Admin credit purchase approval panel
│   └── layout.tsx
├── api/
│   ├── chat/        # AI chat endpoint (credit-enforced)
│   ├── credit-packs/ # List active credit packs
│   ├── credit-purchases/ # Submit & list purchase requests
│   └── admin/
│       └── credit-purchases/ # Admin approve/reject purchases
├── auth/
│   ├── callback/    # OAuth callback handler
│   └── confirm/     # Email confirmation handler
├── globals.css      # Brand CSS variables + Tailwind v4 theme
├── layout.tsx       # Root layout (Inter + Poppins fonts, metadata)
└── page.tsx         # Landing page (redirects to /dashboard if logged in)

components/
├── auth/            # LoginForm, SignupForm, OAuthButton, LogoutButton
├── chat/            # ChatPanel, SaveToWorkspaceButton
├── credits/         # CreditBalance, OutOfCreditsModal, LowCreditsWarning,
│                    # CreditPackCard, PurchaseForm
├── dashboard/       # DashboardShell, Sidebar, TopNav, project dialogs
└── ui/              # Button, Input, Label, Card, Dialog (Shadcn-style)

lib/
├── supabase/
│   ├── client.ts    # Browser Supabase client
│   ├── server.ts    # Server-side Supabase client
│   ├── middleware.ts # Session refresh helper
│   └── types.ts     # Re-exports for database types
└── utils.ts         # cn() helper for Tailwind class merging

types/
└── database.ts      # Full TypeScript types mirroring the DB schema

supabase/
└── migrations/
    └── 001_initial_schema.sql  # Complete DB schema (run in Supabase SQL Editor)

middleware.ts        # Root Next.js middleware (refreshes Supabase session)
```

---

## Credit System

CoachProAI uses a **credit pack** monetization model instead of a recurring subscription:

- New users start with **50 free credits**
- Each AI message costs **1 credit**
- Users purchase credit packs using Pakistan-friendly payment methods: **JazzCash, Easypaisa, Bank Transfer, or WhatsApp**
- Purchases are manually reviewed and approved by the admin
- Credits are added to the user's balance upon approval

| Pack | Credits | Price |
|---|---|---|
| Starter Pack | 100 | Rs.500 |
| Popular Pack | 200 | Rs.900 |
| Mega Pack | 500 | Rs.2000 |

---

## Development Plan

See `DEVELOPMENT_PLAN.md` for the full 4-week roadmap.

## Design System

See `DESIGN_SYSTEM.md` for brand colors, typography, and Tailwind configuration.
