# Stroke Off — Handoff (for the next chat)

Living status doc. Read `CLAUDE.md` and `docs/strokeoff-spec.md` first — the spec is
the source of truth. This file says **what's built, what's next, and what to watch**.

_Last updated after Phase 3, plus three post-Phase-3 product adjustments (below)._

## Post-Phase-3 adjustments

Three product tweaks landed on top of Phase 3 (not new phases):

- **Course directory + par.** Courses used to be free text on a round and par
  didn't exist anywhere. Migrations `0005` (schema + RLS + `create_round` gains
  `p_course_id` / `p_course_layout_id`) and `0006` (seed) add a shared,
  world-readable directory: 120 Massachusetts courses, 25 with a sourced par, 65
  layouts, 2 with hole-by-hole pars. Par is editable at the course level and hole
  by hole; a layout with hole detail derives its total from its holes via a DB
  trigger. Round setup now has a course picker and freezes `rounds.course_par`.
  Dataset + regenerator live in `supabase/seed/` (see its README). UI:
  `src/routes/courses/`, `src/features/courses/`, Community → Courses.
  **Par is not wired into the scoring math yet** — that belongs with regular-score
  entry in Phase 6. Spec §14/§15 and CLAUDE.md updated.
- **Avatars for everyone.** Avatar upload is no longer login-only — anonymous
  players can add a photo too (Community → Me). Anonymous sessions already have
  a uid, so the existing `avatars` bucket RLS (`storage.foldername = auth.uid()`)
  covers them; only the UI gate in `MeSection` was removed. Custom messages stay
  login-only. Spec §11, CLAUDE.md principle 7 updated.
- **Mid-round rules (host only).** The round's active-rule set is no longer
  frozen at Start (conversion + theme still are). The host can toggle library
  rules on/off, pull in more from the group library, or author a new rule on the
  fly, from the lobby **and** the live round. Migration `0004` adds
  `add_round_rule` / `remove_round_rule` RPCs (host-checked, `lobby`/`active`
  only) and publishes `round_rules` to Realtime; `useRoundRealtime` now
  subscribes to it. UI: `src/features/round/RoundRulesManager.tsx`, rendered in
  `RoundLobbyScreen`. Spec §5/§7 updated.

## Where things stand

- **Branch:** work through Phase 3 landed on
  `claude/strokeoff-phase-0-scaffold-khauv5`; the course directory is on
  `claude/bulk-course-par-import-likbuz`. Keep developing and pushing to the
  branch you were given (no per-phase branches in this setup).
- **Phases complete: 0, 1, 2, 3.** Next up: **Phase 4 — Live scoring (Multi Phone).**
- **Checks:** `pnpm typecheck && pnpm lint && pnpm test` (38 tests) and `pnpm build`
  are all green. Dev server boots and serves.

### Important caveat — backend not yet live
There is **no Supabase project wired in this environment** (`.env.local` is empty).
All Supabase code (auth, RLS, RPCs, Realtime) is written and type-checks, but the
app has **not been run end-to-end against a real database**. Phases were verified
via typecheck/lint/unit-tests/build + dev-server smoke.

Migrations `0001`–`0006` *have* been applied in order to a throwaway Postgres 16
with a hand-rolled `auth`/`storage` shim: they apply clean, the seed lands
120/25/65/27 rows and is safely re-runnable, the hole→layout par trigger
recalculates on insert/update/delete, `create_round` snapshots the right par, and
the course RLS policies were exercised (a signed-in user can correct a seeded par
but can't delete a seeded row, claim seeded provenance, or insert on someone
else's behalf; anon can read but not write). That's the SQL validated, not the
app-to-Supabase round trip — still exercise the flows when a real project lands.

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
- **Course directory (post-Phase-3):** shared `courses` / `course_layouts` /
  `course_holes`, seeded MA roster, directory browse/search, course- and
  hole-level par editing, round-setup course picker + par snapshot. Migrations
  `0005`, `0006`.

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

## Open design items & decisions (carried from the original handoff)

Cosmetic / still-to-design (don't block the build):
- **App icon & visual identity** — name is locked (**Stroke Off**); icon is a
  placeholder (brand-blue ring in `public/`). Final identity TBD.
- **Per-theme art** — 3 directions mocked, ~21 spec'd as directions; the full
  gallery is Phase 7.
- **Scorecard styling** — matrix vs solo per-theme pairing still to be locked
  (Phase 6/7).

Decisions worth re-confirming as you build (settled in spec, easy to revisit):
- **Notifications / push are out of scope for v1** (the "skip if offline/
  backgrounded" multi-player rule makes that fine). Revisit only if you want
  off-app pings.
- **Settings contents are a placeholder list** — fill in as you go.
- **Tie-breaker methods** (coin flip, number picker, random draw) are extensible
  — add more later if the group wants them (Phase 6).
- Stack is **decided** (see `CLAUDE.md`) — don't re-litigate React/Vite/TS,
  Supabase, Tailwind, Netlify.

## How to continue (next session)

Full phase order (spec §15): **0** Scaffold · **1** Identity · **2** Groups &
Rules · **3** Round setup & lobby · **4** Live scoring (Multi Phone) · **5**
Single Phone & guests · **6** End of round & history · **7** Theme gallery · **8**
Animations · **9** Guest claim flow · **10** Offline & PWA polish · **11**
Community → People. (Phases 0–3 done.)

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
