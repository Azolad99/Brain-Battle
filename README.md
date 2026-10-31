# Brain Battle

A mobile-first multiplayer trivia game built with Next.js, TypeScript, and Supabase. It includes room creation/joining, private player sessions, server-validated game actions and scoring, lobby and gameplay views, polling-based reconnect recovery, and a four-client integration test.

> **Deployment status:** The app still needs the Supabase migrations applied and production secrets configured. The integration test and Vercel deployment have not been run from this environment.

## Stack
- Next.js App Router + TypeScript
- Supabase Postgres (`supabase/migrations/001_initial.sql`, followed by `002_multiplayer_game.sql`)
- Server-only Supabase secret key access for API routes and security-definer RPCs
- Vitest unit tests

## Requirements
- Node.js 22+ (required by `@supabase/server`)
- A Supabase project
- GitHub and Vercel accounts for the recommended public deployment path

## Local setup

1. Create a Supabase project at https://supabase.com/.
2. In Supabase SQL Editor, run `supabase/migrations/001_initial.sql`, then `supabase/migrations/002_multiplayer_game.sql`.
3. Copy `.env.example` to `.env.local` and fill in values from Supabase Project Settings / API Keys. Set both `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for the browser and SSR clients and `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` for server utilities. Set `SUPABASE_SECRET_KEY` to a Supabase secret key and `SUPABASE_JWKS_URL` to the project's JWKS endpoint. Keep `SUPABASE_SECRET_KEY` server-side only; never prefix it with `NEXT_PUBLIC_`, commit it, or paste it into chat.
4. Install dependencies: `npm install`
5. Run checks: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
6. Start local development: `npm run dev`, then open http://localhost:3000.

## Gameplay and sessions
- `POST /api/rooms` creates a room; `POST /api/rooms/join` joins one. Both set a per-room, `HttpOnly`, `SameSite=Lax` session cookie. The raw random token is never stored in the database; PostgreSQL stores its SHA-256 digest.
- `GET /api/rooms/[code]` returns authorized room state. Correct answers and explanations are withheld until reveal.
- `POST /api/rooms/[code]/actions` handles match actions. The service-only RPCs serialize room changes, enforce room membership/host permissions, and make answer writes and round transitions idempotent. Any connected player can safely trigger a timed round transition, so the match is not tied to the host staying online.
- Questions have a 15-second server deadline. Freeze Clock adds a server-enforced 3-second personal grace period. Double Points applies to one answer. Shield is intentionally not offered because the game has no penalty mechanic.
- The client polls room state every 1.5 seconds and refreshes on focus/online events, which supports reconnects without exposing Supabase data to browser-side queries.
- Matches require 4–8 players. The host can start a rematch after the final round.

## Supabase user-authenticated server clients

`utils/supabase/authenticated-server.ts` reads the Supabase SSR cookie session, verifies its JWT with `verifyCredentials`, and creates an RLS-scoped client using `createContextClient`. The elevated admin client remains isolated in `lib/supabase-admin.ts`; do not use it for user-scoped reads.

## Integration test

Apply both migrations, run the app with a configured Supabase secret key, then set `BRAIN_BATTLE_TEST_BASE_URL` to its origin and run `npm run test:integration`. The test creates a room and exercises it with four independent cookie sessions, then runs the full match and rematch. Without that variable, the integration test is skipped.

## Supabase Edge Function example

`supabase/functions/my-function/index.ts` demonstrates a JWT-authenticated `@supabase/server` function that additionally pins the accepted JWT issuer to this project's `SUPABASE_URL`. `supabase/functions/custom-context/index.ts` demonstrates `createSupabaseContext` for custom authentication error responses. `supabase/functions/hono-api/index.ts` demonstrates Hono routes protected by Supabase's required-claims and Supabase-client middleware. `supabase/functions/list-orders/index.ts` lists orders through the caller's RLS-scoped client. `supabase/functions/scheduled-tasks/index.ts` accepts only the named `automations` secret key and inserts validated scheduled-task records using the admin client. `supabase/functions/process-order/index.ts` accepts the default secret key and updates a validated order ID through the admin client. `supabase/functions/request-order-processing/index.ts` requires a user JWT, checks that the caller owns the order using an RLS-scoped client, and then invokes `process-order` through the admin client. `supabase/functions/stripe-webhook/index.ts` verifies Stripe webhook signatures and marks checkout orders paid through an idempotent database function. JWT verification is enabled for the user-authenticated examples; secret-authenticated functions and the Stripe webhook have platform JWT verification disabled because they authenticate in their handlers. The `custom-context` and `hono-api` examples query a `todos` table; this game schema does not create that table.

Apply `supabase/migrations/003_scheduled_tasks.sql` before invoking the scheduled-tasks function, `004_orders.sql` before invoking either order function, and `005_stripe_webhooks.sql` before deploying the Stripe webhook. Configure `SUPABASE_SECRET_KEYS` in the Supabase Edge Function runtime with the named scheduled-task key and the default order-processing key. Configure `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` as Edge Function secrets; never commit or share these secret values.

## Vercel deployment

Import the repository into Vercel, configure the same environment variables from `.env.example` (never commit `.env.local`), and deploy. Verify the configured Supabase project has both migrations applied before opening the deployed game to players.

## Security notes
- All score, answer correctness, deadlines, and power-up eligibility must be validated on the server.
- Do not return answer keys before reveal.
- Do not enable broad public database writes.
- Add rate limits, expired-room cleanup, abuse monitoring, and safe handling for host disconnects before a public launch.
