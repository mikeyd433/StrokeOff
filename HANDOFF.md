# Stroke Off — Handoff (for the next chat)

Living status doc. Read `CLAUDE.md` and `docs/strokeoff-spec.md` first — the spec is
the source of truth. This file says **what's built, what's next, and what to watch**.

_Last updated after Phase 3._

## Where things stand

- **Branch:** all work is on `claude/strokeoff-phase-0-scaffold-khauv5`. Keep
  developing and pushing there unless told otherwise (no per-phase branches in
  this setup).
- **Phases complete: 0, 1, 2, 3.** Next up: **Phase 4 — Live scoring (Multi Phone).**
- **Checks:** `pnpm typecheck && pnpm lint && pnpm test` (19 tests) and `pnpm build`
  are all green. Dev server boots and serves.

### Important caveat — backend not yet live
There is **no Supabase project wired in this environment** (`.env.local` is empty).
All Supabase code (auth, RLS, RPCs, Realtime) is written and type-checks, but has
**not been run against a real database**. Phases were verified via
typecheck/lint/unit-tests/build + dev-server smoke, not end-to-end. First time a
real project is connected, apply migrations and exercise the flows.

## What each phase delivered

- **Phase 0 — Scaffold:** Vite + React + TS PWA (`vite-plugin-pwa`), Tailwind
  (layout only), **theme-token architecture** (CSS custom properties; `stat-sheet`
  default + `arcade` stub; `ThemeProvider`), five-tab shell + bottom nav, Supabase
  client + health check, TanStack Query, Netlify config.
- **Phase 1 — Identity & personal group:** anonymous + magic-link auth, profiles,
  Community → Me (profile editor, avatar/custom-message login-only, save-progress
  upgrade, change email, sign out, delete account), auto-created personal group,
  first-run flow. Migration `0001`.
- **Phase 2 — Groups & Rules library:** group create/join (invite code/link),
  owner/member roles, group-scoped rules CRUD with search/filter, conversion-table
  editor, Community → Groups. Pure conversion model (tier/ratio) + tests.
  Migration `0002`.
- **Phase 3 — Round setup & lobby:** two-screen setup (group, course, date,
  scoring mode, conversion, theme picker, active-rules + bulk, animations), QR +
  code, join-by-code (+ `?join=CODE` auto-join), live roster via Realtime,
  single-phone guest pre-add, creator Start. Migration `0003`.

## Stubbed / deferred (don't assume these exist)

- **Live scoring, leaderboard, event feed, edit/undo/void, multi-player
  confirmations, mid-round join/leave** → Phase 4+ (lobby shows an "active"
  placeholder after Start).
- **Camera QR scanning** → only QR *display* + QR-link/manual-code join exist.
- **Guests beyond single-phone pre-add**, guest claim/email → Phases 5 / 9.
- **Owner-only group management** (remove member, rename, hand-off, delete) — RLS
  allows owner updates/deletes; UI only has create/join/leave + invite.
- **Quick-add from People**, People tab → Phase 11.
- **Full theme gallery (~21)** → Phase 7 (registry currently ships 2).
- **Animations** → Phase 8. **Offline queue / PWA polish** → Phase 10.

## How to continue (next session)

Paste the reusable phase prompt from `docs/PHASE-0-KICKOFF.md`, swapping in the
phase. For Phase 4:

> Read `CLAUDE.md` and `docs/strokeoff-spec.md`. Implement **only Phase 4 — Live
> scoring (Multi Phone)** (spec §6, §15) to its Deliverable. Honor the architecture
> principles (theme tokens, snapshot, RLS-first, permission-on-writes,
> derive-from-events). Add RLS to any new table in the same migration. Finish with
> `pnpm typecheck && pnpm lint && pnpm test` clean.

Phase 4 will add `point_events` (+ likely `event_confirmations`), derive live
totals from events (never a stored counter), enforce own-only writes in UI **and**
RLS, and reuse the `round:{id}` Realtime channel already set up in
`src/lib/rounds.ts` (extend it to `point_events`).

## Connecting a real Supabase project (when ready)

1. Create the project; copy URL + anon key into `.env.local`
   (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
2. Apply migrations: `npx supabase db push` (or `supabase db reset` locally).
   Migrations live in `supabase/migrations/0001…0003`.
3. Enable **Anonymous sign-ins** and the **Email (magic link)** provider; add app
   origins to Auth → URL Configuration → Redirect URLs. See `supabase/README.md`.
4. Set the same `VITE_` vars in the deploy environment.

## ⚠️ For the website-integration chat (you said you'll add the website repo)

The app is the deploy target **`dabingabongo.com/strokeoff`** (a sub-path), but the
code currently assumes it's served from the **root `/`**. Before/while integrating
with the website repo, these need attention:

- **Vite `base`** — set `base: '/strokeoff/'` in `vite.config.ts` for a sub-path
  deploy (assets currently resolve from `/`).
- **React Router `basename`** — `BrowserRouter` in `src/main.tsx` has no
  `basename`; set it to `/strokeoff` so routes resolve under the sub-path.
- **PWA manifest scope/start_url** — `vite.config.ts` VitePWA `manifest.start_url`
  and `scope` are `/` (and `index.html`/SPA fallback assume root). Update to the
  sub-path so install + offline scope are correct.
- **Join links / QR** — `RoundLobbyScreen` and group invite links build
  `${window.location.origin}/...`; confirm they include the `/strokeoff` base.
- **Netlify** — `netlify.toml` SPA redirect + `publish = dist` assume a standalone
  site. If the app is nested inside the website repo's build/deploy instead, the
  redirect, publish dir, and base path all need to match that setup.
- **Decision to make:** is the app (a) its own Netlify site mounted at the
  sub-path, or (b) built into the website repo's pipeline? That choice drives all
  of the above. Surface it early.

Nothing above is done yet — it's the integration checklist for when the website
repo is in hand.
