# Baro-Ai Referral Admin

A small internal admin site for Baro-Ai: managing referral codes (who earns a commission, how much they're owed, marking them as paid) plus read-only visibility into subscriptions, payments, plans and revenue. Built for a single admin user (you).

Stack: Vite + React + TypeScript + Tailwind CSS + React Router + `@supabase/supabase-js` v2.

The site never contains the Supabase service role key. All reads and writes go through `admin_*` database functions (`supabase.rpc(...)`) — the underlying tables have row-level security enabled with no policies, so they can't be queried directly from the browser.

## Running locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Environment variables

Create a `.env` file (see `.env.example`):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

Only the public anon/publishable key goes here — never the service role key. `.env` is already in `.gitignore`.

## Logging in

Email + password sign-in via Supabase Auth (`signInWithPassword`). After signing in, the site calls `admin_is_admin()`:

- `true` → you see the dashboard.
- `false` → "This account has no admin access" and a Sign out button, with no data shown.

There is no sign-up page — your admin account must already exist in Supabase Auth and have a row in `admin_users`.

## Deploying to Vercel

1. Push this project to a GitHub repo.
2. Import it into Vercel as a Vite project (framework preset: Vite).
3. Add the two environment variables above in Vercel's Project Settings → Environment Variables.
4. Deploy. `vercel.json` already rewrites all routes to `index.html`, so refreshing any page (e.g. `/codes/HODAN1`) works correctly.

## Project structure

- `src/lib/supabase.ts` — Supabase client (anon key only).
- `src/lib/api.ts` — every database call goes through this file. Pages never call `supabase.rpc` directly. Also maps database error codes (e.g. `code_exists`) to friendly messages.
- `src/lib/format.ts` — money/date formatting; all dates are shown in East Africa Time (UTC+3).
- `src/lib/csv.ts` — CSV export (UTF-8 with BOM so it opens correctly in Excel).
- `src/auth/` — session + admin-gate logic.
- `src/pages/` — Overview, Codes, Code detail, Payouts, Plans (Referrals); Revenue, Subscriptions, Payments (Billing).
- `src/components/` — shared UI (layout, modals, tables, etc).

## Notes

- Money is shown in US dollars with 2 decimals. Dates are shown in East Africa Time as "12 Nov 2026".
- A code's percent change only affects future payments — past referral rows keep the percent they were created with (the database guarantees this; the UI just explains it).
- Stopping a code is permanent and requires confirmation. Pausing is reversible.
- "Undo" on a payout deletes it and marks its referrals unpaid again (also requires confirmation).

## Billing pages (Revenue / Subscriptions / Payments / Plans)

These read the `subscriptions`, `payment_attempts`, and `subscription_plans` tables, which were locked down the same way as the referral tables (RLS enabled, no policies). Since no admin functions existed for them yet, this project added four new read-only `SECURITY DEFINER` functions directly on the Supabase project (migration `admin_billing_readonly_functions`), reusing the existing `referral_assert_admin()` admin check and `referral_plan_label()` / `referral_eat_start()` helpers:

- `admin_revenue_overview(p_from, p_to)` — totals, daily revenue, revenue by plan.
- `admin_payments(p_from, p_to, p_outcome)` — every payment attempt (including declined ones).
- `admin_subscriptions(p_from, p_to, p_status)` — every subscription with a derived status (`active` / `expired` / `canceled`).
- `admin_plan_catalog()` — the full plan catalog with subscriber counts and revenue per plan.

They are strictly read-only — nothing in the app writes to these tables. If you ever need to change or remove them, they're just Postgres functions in the `public` schema of the `baro-ai` Supabase project.
