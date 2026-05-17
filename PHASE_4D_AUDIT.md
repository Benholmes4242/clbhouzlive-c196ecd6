# Phase 4D — Social Competition System Audit

Read-only inventory. No code changes. Companion to `GAMIFIED_HANDICAP_AUDIT.md` and `GAMIFIED_HANDICAP_AUDIT_DRILLDOWN.md`.

Date of audit: 2026-05-17. Database snapshot taken via `supabase--read_query` against the production project `ybxkehyomcakqjvuhnna`.

---

## 1. Tables — schema, RLS, data state

Phase 4D (and the two sibling phases that ship in the same chunk) consists of three migrations executed on 2025-11-16:

| Migration | Time | Phase | Tables created |
|-----------|------|-------|----------------|
| `20251116202003_…` | 20:20 UTC | **4A — Seasonal XP Ladders** | `seasons` (+ views `user_season_xp_view`, `season_leaderboard_view`) |
| `20251116210750_…` | 21:07 UTC | **4C — Season Pass Premium + Season Shop Cosmetics** | `season_pass_tiers`, `season_shop_items`, `user_cosmetic_unlocks`, `cosmetic_loadouts`, `user_season_currency` |
| `20251116211939_…` | 21:19 UTC | **4D — Social Competition** | `challenges`, `challenge_requirements`, `user_challenge_progress`, `rivals`, `streaks`, `weekly_challenge_ladder`, `season_wrap_cards` |

Phase 4B was not found in this date window (no migration carries that header). Phases 4A, 4C, and 4D are best read as a single shipped chunk; this audit treats them collectively.

No further migrations touch these tables after 2025-11-16. No subsequent migration adds an `xp_log`, `level_log`, or numbered `_v2` table. The `processing_flag` column on `seasons` (visible in the row sample) was added by some later migration we did not isolate — it is the only post-hoc schema drift detected.

### 1.1 `seasons` (Phase 4A)

```sql
create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_active boolean not null default false,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
  -- processing_flag boolean (added by later migration, not in original chunk)
);
create index seasons_active_idx on seasons (is_active, starts_at, ends_at);
```

RLS: `seasons_read_all` (`for select using (true)`). No insert/update/delete policies — managed by admins via service role only.

FKs in: `weekly_challenge_ladder.season_id`, `season_wrap_cards.season_id`, `season_pass_tiers.season_id`, `season_shop_items.season_id`.

**Rows: 1.** The seed row from the original migration:

```
id:           a28afa29-6d33-4c1a-a34c-dc903dc7c4bd
slug:         winter-2025
name:         Winter 2025 Season
starts_at:    2025-01-01T00:00:00Z
ends_at:      2025-03-31T23:59:59Z
is_active:    true
is_default:   true
processing_flag: true
created_at:   2025-11-16T20:20:00Z
updated_at:   2025-11-16T20:20:00Z
```

The active window (Jan–Mar 2025) **predates** the migration (Nov 2025) and is now ~14 months stale. No second season has been inserted.

### 1.2 `challenges` (Phase 4D)

Full schema from migration `20251116211939_…` lines 4–18. CHECK constraints: `type in ('weekly','monthly','personal','regional','global')`, `category in ('exploration','skill','social')`. Indexes: `idx_challenges_active`, `idx_challenges_type`.

RLS: `Public can view active challenges` (select, `is_active AND now() between start_at and end_at`); `Admins can manage challenges` (all, `is_admin()`).

FKs in: `challenge_requirements.challenge_id`, `user_challenge_progress.challenge_id`. FK out: `created_by → user_profiles(id)`.

**Rows: 0.** No challenge has ever been created.

### 1.3 `challenge_requirements` (Phase 4D)

`id`, `challenge_id (fk challenges, cascade)`, `metric text`, `target int`, `created_at`. Index on `challenge_id`.

RLS: select-only, gated through the parent challenge.

**Rows: 0.**

### 1.4 `user_challenge_progress` (Phase 4D)

`id`, `challenge_id (fk)`, `user_id (fk user_profiles)`, `current_value int default 0`, `is_completed bool`, `completed_at`, `updated_at`. Unique `(challenge_id, user_id)`. Trigger `update_user_challenge_progress_updated_at` (BEFORE UPDATE → `update_updated_at_column()`).

RLS: owner select/insert/update. There is also a `System can manage progress` policy with `using (false) with check (false)` — effectively a no-op stub, presumably intended to be replaced by a service-role bypass later.

**Rows: 0.**

### 1.5 `rivals` (Phase 4D)

```sql
create table rivals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  rival_user_id uuid not null references user_profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, rival_user_id),
  check (user_id != rival_user_id)
);
```

Indexes: `idx_rivals_user`, `idx_rivals_rival`.

RLS: owner can view, insert, delete own rivals. Counterpart can also `select` (so the rival sees they are rivalled).

**Rows: 0.** No one has ever added a Phase 4D rival.

### 1.6 `streaks` (Phase 4D)

```sql
create table streaks (
  user_id uuid primary key references user_profiles(id) on delete cascade,
  daily_streak int default 0,
  weekly_streak int default 0,
  monthly_streak int default 0,
  last_daily_action timestamptz,
  last_weekly_action timestamptz,
  last_monthly_action timestamptz,
  updated_at timestamptz default now()
);
create index idx_streaks_daily on streaks(last_daily_action);
```

RLS: owner select/update. Same stub `using (false)` "system" policy as `user_challenge_progress`. Trigger `update_streaks_updated_at`.

**Rows: 0.**

### 1.7 `weekly_challenge_ladder` (Phase 4D)

`id`, `user_id (fk)`, `season_id (fk)`, `week_start tz`, `week_end tz`, `points int default 0`, `rank int`, `created_at`, `updated_at`. Unique `(user_id, season_id, week_start)`. Indexes `idx_weekly_ladder_season_week`, `idx_weekly_ladder_user`. Trigger `update_weekly_challenge_ladder_updated_at`.

RLS: `Public can view ladder` (select, true). Same stub `system` policy.

**Rows: 0.**

### 1.8 `season_wrap_cards` (Phase 4D)

`id`, `user_id (fk)`, `season_id (fk)`, `cards jsonb default '[]'`, `viewed bool`, `generated_at`. Unique `(user_id, season_id)`. Index `idx_season_wrap_user`.

RLS: owner select; owner update (only `viewed`); insert blocked (`with check (false)`).

**Rows: 0.**

### 1.9 Phase 4C tables (Season Pass / Shop / Cosmetics)

All created in `20251116210750_…`. Full schemas in that file. Row counts:

| Table | Rows |
|-------|------|
| `season_pass_tiers` | 0 |
| `season_shop_items` | 0 |
| `user_cosmetic_unlocks` | 0 |
| `cosmetic_loadouts` | 0 |
| `user_season_currency` | 0 |

### 1.10 Tangentially-related tables found while scanning

These tables matched the broader search (`season_*`, `*rival*`, `*badge*`, `streak*`, `championship*`, `ladder*`, `league*`, `shop_*`, `xp_*`) but were **not** created by the 4A/4C/4D chunk. Counts shown for context only:

| Table | Rows | Origin | Relationship to Phase 4D |
|-------|------|--------|--------------------------|
| `badges` | 11 | Older catalogue table | Unrelated to Phase 4D challenges |
| `user_badges` | 20 | Older | Used by current `AllTrophiesSheet` pipeline |
| `user_badge_pins` | 0 | Older | Pinning UI; no Phase 4D link |
| `friend_rivalry` | 2 | WHS pipeline | Used by `RivalryCard.tsx` (the WHS feature). **This is the table the previous audit assumed was named `friend_rivalries`. It is singular.** |
| `user_rivals` | 0 | Championship feature (`hooks/championship/useUserRivals.ts`) | Distinct from Phase 4D `rivals` |
| `user_rival_overrides` | 3 | WHS rivalry pipeline (`src/lib/whs/api.ts`) | Distinct |
| `college_rivalries` | 30 | College Franchise feature | Unrelated |
| `championship_dispatches`, `championship_editorial_daily`, `championship_seasons` | not counted | Championship tour-hub feature | Unrelated |
| `season_badges`, `season_rewards` (6), `season_podium_archive` | 0 / 6 / 0 | Top-100 / Championship season system | **Same word "season", different concept** — these reference `championship_seasons`/Top-100 ranking, not the Phase 4A `seasons` table. Audited via FKs. |

There is no `xp_*`, `level_log`, `shop_currency` (the Phase 4D analog is `user_season_currency`), or `badges_v2` table.

---

## 2. Code paths per table

### 2.1 Hooks (all live under `src/hooks/`)

| Hook file | Reads | Writes | Consumers |
|-----------|-------|--------|-----------|
| `useCurrentSeason.ts` | `seasons` | — | `useUserCosmetics`, `useSeasonShop`, `useSeasonPass`, `useUserSeasonXP`, `useSeasonWrap`, `useSeasonRecap`, `useRivals` indirectly. Components: `SeasonPassHeader`, `PremiumRewardsTrack`, `SeasonShop` page, `SeasonStatusCard`, `SeasonOnCourseCard`, `NewSeasonBanner`, `ChallengesPage`, `Clubhouse` page (via `SeasonWrapModal`). |
| `useUserSeasonXP.ts` | `season_leaderboard_view`, `seasons` | — | `SeasonStatusCard`, `SeasonOnCourseCard`, `ChallengesPage`, `useRivals` (transitively via `user_season_xp`). |
| `useSeasonLeaderboard.ts` | `season_leaderboard_view` | — | Not referenced by any component (`rg "<.*useSeasonLeaderboard"` returns nothing). |
| `useActiveChallenges.ts` | `challenges`, `challenge_requirements`, `user_challenge_progress` | — | `ChallengesPage`, `ChallengeBanner`. |
| `useChallengeProgress.ts` | `challenges`, `user_challenge_progress` | (likely client upserts; not verified) | `ChallengesPage`. |
| `useWeeklyChallengeLadder.ts` | `weekly_challenge_ladder` (3 selects) | — | `WeeklyChallengeLadder` component (only). |
| `useRivals.ts` | `rivals`, `seasons`, `user_season_xp` (deprecated table name — see Gaps §9) | insert/delete `rivals` | `RivalsPanel` (only). |
| `useStreaks.ts` (the **Phase 4D** one at `src/hooks/useStreaks.ts`) | `streaks` (upsert pattern) | upsert `streaks` | `StreakWidget` (only). Distinct from `src/lib/whs/useStreaks.ts` which has no overlap (different signature, different return type). |
| `useSeasonWrap.ts` | `seasons`, `season_wrap_cards` | update `viewed` | `SeasonWrapModal`. |
| `useSeasonRecap.ts` | `seasons` (+ derived) | — | Not referenced. |
| `useSeasonPass.ts` | `season_pass_tiers` | — | `SeasonPassHeader`, `PremiumRewardsTrack`. |
| `useSeasonShop.ts` | `season_shop_items` | — | `SeasonShop` page. |
| `useUserCosmetics.ts` | `user_cosmetic_unlocks`, `user_season_currency` | upsert both | `SeasonShop` page. |

### 2.2 Edge functions

All seven exist in the repo (`supabase/functions/<name>/index.ts`); none are scheduled.

| Function | Writes to | Cron? |
|----------|-----------|-------|
| `calculate-streaks` | `streaks` (upsert) | **No cron.** |
| `generate-weekly-challenges` | `challenges`, `challenge_requirements` | **No cron.** Despite the name, nothing invokes it. |
| `reset-weekly-challenge-ladders` | `weekly_challenge_ladder` (select, delete, insert) | **No cron.** |
| `generate-season-wrap` | `season_wrap_cards` (upsert) | **No cron.** |
| `process-ended-seasons` | `seasons` (flag flip) | **Active cron** `process-ended-seasons-daily` at `10 3 * * *`. Reads/writes only `seasons` table. |
| `process-season-pass` | `season_pass_tiers`, `season_shop_items`, `user_cosmetic_unlocks`, `user_season_currency` | **No cron.** |
| `refresh-season-shop` | `season_shop_items` | **No cron.** |

Recent edge-function logs (last 1h window) show **zero invocations** of any of the seven functions — only `tournament-live-sync`, `sportradar-sync`, `cleanup-open-to-play`, `backfill-video-metadata`, and `upsert-live-tournament-post` are firing.

### 2.3 React components

| Component | Mounted? | Surface |
|-----------|----------|---------|
| `src/pages/ChallengesPage.tsx` | Yes — route `/challenges` in `App.tsx:355` | Page exists but **no link in app navigation** (only `ChallengeBanner` links to it, and that banner is itself unmounted). |
| `src/pages/SeasonShop.tsx` | Yes — route `/season-shop` in `App.tsx:354` | Same situation — no nav entry. |
| `src/components/season/SeasonWrapModal.tsx` | **Yes — mounted globally in `App.tsx:679`** | Renders only when `season_wrap_cards` has an unviewed row for the user; table is empty so the modal is always inert. |
| `src/components/challenges/ChallengeBanner.tsx` | **No** — `rg "<ChallengeBanner"` returns no matches outside its own file | Dormant. |
| `src/components/challenges/WeeklyChallengeLadder.tsx` | **No** mounts found | Dormant. |
| `src/components/rivals/RivalsPanel.tsx` | **No** mounts found | Dormant. |
| `src/components/streaks/StreakWidget.tsx` | **No** mounts found | Dormant. |
| `src/components/season-pass/SeasonPassHeader.tsx` | **No** mounts found | Dormant. |
| `src/components/season-pass/PremiumRewardsTrack.tsx` | **No** mounts found | Dormant. |
| `src/components/feed/NewSeasonBanner.tsx` | **No** mounts found | Dormant. |
| `src/components/profile/SeasonStatusCard.tsx` | **No** mounts found (only self-export) | Dormant. |
| `src/components/profile/courses/SeasonOnCourseCard.tsx` | **No** mounts found | Dormant. |

### 2.4 Triggers

Only the three `update_updated_at_column()` triggers declared inline in migration `20251116211939_…` (lines 211–224): `update_user_challenge_progress_updated_at`, `update_streaks_updated_at`, `update_weekly_challenge_ladder_updated_at`. No notification, scoring, or fan-out triggers.

### 2.5 RPCs

No RPC (SECURITY DEFINER function) has been created against any Phase 4D table. All access is direct table SELECT/INSERT/UPDATE through PostgREST.

---

## 3. UI exposure — what is live today

Walking the live app:

- **"Challenges" tab/page** — Route `/challenges` is mounted lazily in `App.tsx`. There is **no link to `/challenges` from any header, bottom-nav, profile, or hub**. Reaching it requires typing the URL by hand. The page reads `challenges` (0 rows) so it would render an empty state.
- **"Rivals" surface** — `RivalsPanel` is not mounted anywhere. The "Rivalries" feature visible in the app (Handicap → Today → Rivalries section) is the **WHS** feature, served by `src/components/profile/handicap/whs/sections/rivalries/RivalryCard.tsx` and backed by the `friend_rivalry` + `user_rival_overrides` tables. It is **unrelated** to Phase 4D's `rivals` table.
- **XP / level badges** — `useUserSeasonXP` resolves data but is consumed only by un-mounted components (`SeasonStatusCard`, `SeasonOnCourseCard`, `ChallengesPage`). No XP value, level badge, or progress meter is rendered anywhere in the running app.
- **"Shop" / "Rewards"** — Route `/season-shop` is mounted but unlinked. `season_shop_items` is empty so the page would render no products. `season_pass_tiers` and `user_season_currency` are also empty.
- **Weekly challenge ladder** — `WeeklyChallengeLadder` component exists but is never instantiated.
- **Streaks** — The streak chip rendered inside the Handicap Today view (`StreaksSection.tsx`) is the **WHS** streak, computed client-side in `src/lib/whs/useStreaks.ts` from `whs_scores`. The Phase 4D `StreakWidget` (which reads the `streaks` table) is dormant.
- **Season Wrap modal** — Mounted globally but inert; will only display when `season_wrap_cards` is populated for the current user.
- **New season banner** — `NewSeasonBanner.tsx` is dormant.

Headline: **Phase 4D ships zero visible UI in production today.** Two route stubs exist (`/challenges`, `/season-shop`) but are not navigable from within the app. The only globally-mounted Phase 4D component (`SeasonWrapModal`) is a no-op because its source table is empty.

---

## 4. Cron jobs (`cron.job`)

Filtered to anything that could touch Phase 4A/4C/4D:

| jobname | schedule | active | function |
|---------|----------|--------|----------|
| `process-ended-seasons-daily` | `10 3 * * *` | true | `process-ended-seasons` (Phase 4A — flips `seasons.is_active`) |
| `auto-flip-season` | `5 0 * * *` | true | Inline SQL — flips `is_active` based on `now() between starts_at and ends_at`. Detected via name match; body not opened in this pass. |
| `refresh-college-season-stats-daily` | `0 7 * * *` | true | Unrelated (College Franchise) |

**Not scheduled** (confirmed via `cron.job` lookup by command substring):

- `generate-weekly-challenges` — never invoked. The function exists but no challenge can ever materialise from it without manual call.
- `reset-weekly-challenge-ladders` — never invoked.
- `calculate-streaks` — never invoked.
- `generate-season-wrap` — never invoked.
- `process-season-pass` — never invoked.
- `refresh-season-shop` — never invoked.

Per the brief: confirming explicitly — `reset-weekly-challenge-ladders` and `generate-weekly-challenges` are **not** running.

---

## 5. Data state

Already covered table-by-table in §1. Summary:

- **Real-user rows in any Phase 4D / 4A / 4C table: 0**, except for the single `seasons` seed row (Winter 2025, dates already expired).
- **Active rows** (`is_active AND now() between start/end`): the seed `winter-2025` season is flagged `is_active=true` but its `ends_at` is `2025-03-31T23:59:59Z` — already 14 months in the past at audit time. The `process-ended-seasons-daily` cron is running, so either it does not modify the flag without an `ends_at < now()` condition we did not verify, or its update is gated by `processing_flag`. Either way, no fresh season has been seeded.
- No Phase 4D table has been written by any client or function since 2025-11-16.

---

## 6. Origin and intent

Discoverable evidence:

- **Migration headers** are the only narrative comments: `Phase 4A: Seasonal XP Ladders`, `Phase 4C: Season Pass Premium + Season Shop Cosmetic System`, `Phase 4D: Social Competition System`. All three migrations land **within one hour** on 2025-11-16 (20:20, 21:07, 21:19 UTC), suggesting a single drop.
- **No `Phase 4B`** migration was found.
- **No PRD, brief, or CHANGELOG** entry for Phase 4A/4C/4D exists in `/docs/`, `/.memory/`, root markdown, or README.
- **No TODO/FIXME comments** referencing the system were found in the hooks or components (search `rg -n "TODO|FIXME|XXX" src/hooks/use{Rivals,Streaks,ActiveChallenges,SeasonWrap,SeasonShop,SeasonPass,UserCosmetics,WeeklyChallengeLadder,ChallengeProgress}.ts` yields only one TODO inside `useRivals.ts`: `// TODO: Calculate actual rank` / `// TODO: Calculate rank difference`).
- The hooks reference a table `user_season_xp` (see `useRivals.ts:62`) which **does not exist** in the database — only the view `user_season_xp_view` does. This is a latent bug that would manifest the moment the Rivals UI is wired up.
- **No shipped UI surface.** Combined with the dormant components and absent crons, the system reads as a backend-only scaffold that was landed and never wired into the product.

Best-effort summary: conceived as a three-part competitive layer (XP seasons → Premium pass → Social challenges + rivals + streaks), the entire chunk was migrated on 2025-11-16 and has had **no further activity in either the database or git history** in the audited window. It appears to be paused or abandoned, not in active development.

---

## 7. Overlap with proposed `gam_*` work

Verified prerequisite: **no `gam_*` table currently exists in the database** (the `game*` matches in the schema listing are the unrelated tee-time/games feature). The new `gam_*` work is therefore at proposal stage; comparison is against what we know is intended.

| Phase 4D table | Proposed `gam_*` analog | Overlap |
|----------------|-------------------------|---------|
| `rivals` | `friend_rivalries` (per spec, an extension of an existing table) | **Name mismatch verified.** No `friend_rivalries` (plural) table exists — the WHS rivalry feature uses `friend_rivalry` (singular). The Phase 4D `rivals` is a third, independent rivalry concept. There are now three rivalry storage layers in the schema: WHS `friend_rivalry`/`user_rival_overrides`, Championship `user_rivals`, Phase 4D `rivals`. None of them share data. |
| `streaks` | `gam_streaks` | Same column name, different semantics. Phase 4D models calendar adherence (daily/weekly/monthly login-style). The gam_ proposal models golf-specific streaks (consecutive rounds, no-ups, birdie strings, etc.). The two could coexist, but the bare name `streaks` is already taken. |
| `challenges` (+ `challenge_requirements`) | `gam_badge_catalogue` | Partial overlap. Phase 4D models time-windowed, point-rewarded objectives with explicit start/end and a `metric → target` requirement schema. A "seasonal badge catalogue" overlaps semantically (objective → reward) but the existing schema has live RLS, indexes, and an admin policy already in place. If the gam_ system treats badges as evergreen unlocks rather than time-boxed competitions, the overlap is conceptual only. |
| `weekly_challenge_ladder` | `gam_league_members` | Overlapping primitive — both are per-user, per-period, per-grouping leaderboard rows. Phase 4D scopes by `season_id + week_start`; a gam_ league would presumably scope by `league_id`. If a "league" in the new model is a weekly cohort, this is the same table with a different name. |
| `seasons` | `gam_leagues.season text` | The existing `seasons` table is a real entity with `id`, slug, dates, active/default flags, and is FK-referenced by four other tables and two views. A `season text` column on `gam_leagues` would not be substitutable without breaking those FKs and views. |
| `season_pass_tiers`, `season_shop_items`, `user_cosmetic_unlocks`, `cosmetic_loadouts`, `user_season_currency` | (no proposed analog mentioned) | Pure overhang — the cosmetics economy has no counterpart in the proposed gam_ work and would remain orphaned. |
| `season_wrap_cards` | (no proposed analog mentioned) | Orphaned end-of-season recap surface; no overlap. |

Where overlap is clear: `streaks` (name collision), `weekly_challenge_ladder` ↔ `gam_league_members` (same primitive), `seasons` (already a real FK target). Where overlap is ambiguous: `challenges` vs `gam_badge_catalogue` depends on whether badges are time-boxed.

---

## 8. Verifying the previous audit's assumptions

| Assumption | Status |
|------------|--------|
| `whs_scores` exists with full schema | **Confirmed.** 30 columns including `actual_gross`, `adjusted_gross`, `stableford_points`, `course_rating`, `slope_rating`, `pcc`, `course_handicap`, `handicap_differential`, `handicap_index_at_time`, `is_eligible_for_handicapping`, `hole_by_hole_fetched`, `raw_payload jsonb`, etc. Matches the drilldown's reconstruction. |
| `friend_rivalries` exists | **Wrong name.** The actual table is `friend_rivalry` (singular). It is the source for `src/components/profile/handicap/whs/sections/rivalries/RivalryCard.tsx` (which imports `FriendRivalryHydrated` from `@/lib/whs/types`) and is read in `src/lib/whs/api.ts:870`. Two rows exist. Three other tables also carry "rival" in their name (`user_rivals`, `user_rival_overrides`, `rivals`) and are distinct features. |
| `courses` vs `golf_courses` — which is canonical | **`golf_courses` is canonical** (24 columns, FK target across the schema). No `courses` table exists in `public`. |
| `user_profiles` vs `auth.users` for FKs | **All Phase 4D FKs reference `user_profiles(id) on delete cascade`.** No table in the audited set references `auth.users` directly. This matches the codebase convention documented elsewhere. |

---

## 9. Gaps and unknowns

What this audit could not determine:

1. **Why the Winter 2025 season is still flagged `is_active=true`.** The `process-ended-seasons-daily` cron is running and the function exists in the repo, but the season's `ends_at` is 14 months past. Either the function's logic excludes this row (perhaps via `processing_flag`), or it errors silently. Edge-function logs in the captured 1-hour window show no invocation of `process-ended-seasons`, so its actual behavior was not observed.
2. **`auto-flip-season` cron body.** Detected only by name in `cron.job`. The function it calls (inline SQL? net.http_post?) was not opened in this pass.
3. **`useRivals.ts` references `user_season_xp`** as a table, not the existing `user_season_xp_view` view. Whether this is a latent bug (PostgREST would reject the call) or whether there is an additional materialised table we missed is unverified. The DB inventory found only the view.
4. **`processing_flag` column on `seasons`** is not in the original Phase 4A migration but is present in the row sample. The migration that added it was not located in this pass.
5. **Edge-function source for `process-ended-seasons`, `process-season-pass`, etc.** is present in the repo, but their actual behavior was not stepped through line-by-line; column-touch attributions in §2.2 are based on the `from()` calls only.
6. **Whether any of the seven Phase 4D edge functions was ever invoked manually** (e.g. by an admin via `curl` or the Supabase dashboard) cannot be answered from the table state alone — all writes would have happened to currently-empty tables, so we have no positive evidence of any historical invocation.
7. **`generate-weekly-challenges` templates.** The function declares a `ChallengeTemplate` interface but the template content was not enumerated in this pass.
8. **Whether `processing_flag` interacts with `process-ended-seasons`** in a way that explains the stale active season, or whether this is simply a forgotten cron.
9. **The Phase 4D `streaks` table's intended write path.** `calculate-streaks` is the only writer and is not scheduled; `useStreaks.ts` issues client-side upserts that would have to pass the owner-update RLS policy. There is no documented event that triggers a streak increment.
10. **The `system` RLS pattern** (`using (false) with check (false)`) appears on `user_challenge_progress`, `streaks`, and `weekly_challenge_ladder`. This blocks even service-role role-name matches via PostgREST conventions; whether the design intent was for edge functions to bypass via the service-role key (which it would, RLS-exempt) was not verified end-to-end.

---

## Headline summary

Phase 4D (and its 4A/4C siblings shipped the same hour on 2025-11-16) is a **complete backend scaffold with zero live UI**: 7 hooks, 7 edge functions, ~13 components, and ~12 tables, all dormant. Every Phase 4A/4C/4D table is empty except a single seed `seasons` row whose active window expired in March 2025. None of the six functional crons that would populate the system (`generate-weekly-challenges`, `reset-weekly-challenge-ladders`, `calculate-streaks`, `generate-season-wrap`, `process-season-pass`, `refresh-season-shop`) are scheduled — only `process-ended-seasons-daily` runs, and it has had no observable effect on the stale active season. The two stub routes `/challenges` and `/season-shop` exist but are unlinked from the app's navigation. The previous audit's assumption that a `friend_rivalries` table exists is wrong — the WHS rivalry table is `friend_rivalry` (singular), and the schema now contains three independent rivalry tables (`friend_rivalry`, `user_rivals`, Phase 4D `rivals`) which share no data. Proposed `gam_*` work overlaps Phase 4D primarily on `streaks` (name collision, different semantics), `weekly_challenge_ladder` ↔ `gam_league_members` (same primitive), and the existing `seasons` table (already a real FK target that cannot be reduced to a `text` column without breaking four downstream FKs). No `gam_*` table currently exists in the database.

File written: `/PHASE_4D_AUDIT.md`.
