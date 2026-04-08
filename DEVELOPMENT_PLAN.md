# CoachPro AI - Development Plan

This document outlines the step-by-step implementation plan for the CoachPro AI MVP.
Update the checkboxes `[ ]` to `[x]` as you complete each task to track progress.

## 🛠️ Tech Stack
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS + Shadcn UI
- **Database & Auth:** Supabase (PostgreSQL)
- **AI Engine:** Vercel AI SDK + OpenAI API / Anthropic Claude
- **Payments:** Stripe Checkout
- **Hosting:** Vercel

## 📅 Week 1: Foundation & Database
**Goal:** Users can log in and create projects.
- [x] Initialize Next.js project and push to repository.
- [x] Setup Tailwind CSS and Shadcn UI.
- [x] Setup Supabase project (Database & Auth).
- [x] Create core database tables (`Users`, `Projects`, `SavedOutputs`).
- [x] Implement Authentication (Email/Password & Google OAuth).
- [x] Setup protected routes (Dashboard is only accessible to logged-in users).

## 📅 Week 2: UI/UX & Workspace
**Goal:** Build the shell, navigation, and project management flow.
- [x] Build Dashboard Shell (Sidebar, Top nav).
- [x] Create "Recent Projects" view.
- [x] Build Assistants Grid (Programming Tutor, DB Expert, etc.).
- [x] Build Project Workspace (Notion-style tabs: Overview, DB, API, Docs).
- [x] Implement CRUD for Projects (Create, Read, Update, Delete).

## 📅 Week 3: Core AI Engine
**Goal:** Make the AI chat functional and context-aware.
- [x] Build Chat Interface using Vercel AI SDK (`useChat`).
- [x] Implement Context Injection (pass Project details into AI System Prompt).
- [x] Build the "Save to Workspace" button on AI responses.
- [x] Save AI outputs to specific project tabs in the database.

## 📅 Week 4: Monetization & Polish
**Goal:** Restrict free usage, accept money, and launch.
- [ ] Implement usage limits for free tier (e.g., max 2 projects / limited AI messages).
- [ ] Integrate Stripe Checkout for Pro plan upgrades.
- [ ] Update user plan in Supabase via Stripe Webhooks.
- [ ] Build Global "Saved Outputs" page across all projects.
- [ ] Final QA, bug fixes, and connect custom domain (`app.coachproai.com`).