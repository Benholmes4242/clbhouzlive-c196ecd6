# H2H_BEST_1 — compare sheet "Your best here" tiles blank

## Cause
Shared-round groups are keyed by a `whs_courses` id (`detect_shared_rounds`), while
`course_bests` is keyed by a `golf_courses` id (`gam_round_stats.course_id`), so
`course_bests[g.courseId]` never matched and both tiles rendered "– · – pts".

## Fix (client only; no SQL, no RPC changes)
- `useCompareStats.ts` — gam select now also reads `whs_score_id`; the raw per-player
  gam rows are exposed as `me.gam_rows` / `them.gam_rows` alongside `course_bests`
  (still keyed by golf_courses id, unchanged).
- `headToHeadRules.ts` — new pure `resolveGroupCourseId(group, gamRows, side)`:
  matches the player's gam rows on `play_date`; several rows on one date → the one
  whose `gross_score` equals that round's gross (`user_gross` for me, `rival_gross`
  for them), otherwise the date is skipped; the id seen on the most dates wins
  (ties: most recent date); null when nothing matches.
- `h2hStats.ts` — `PlayerStats.gam_rows` type added.
- `HeadToHeadDetail.tsx` — each side's id is resolved independently and
  `meBest`/`themBest` read `course_bests[resolvedId]`; a null resolution keeps the
  dash, as today. Shared-rounds list, GROSS/PTS records, season board,
  `groupByCourse` and tile layout/copy unchanged.

## Tests — `src/test/hh3HeadToHead.test.tsx` (18 → 24, +6, none changed/deleted)
- resolveGroupCourseId: single date match; two rows same date picks matching gross;
  no date match → null; mixed results → majority id.
- Sheet: group keyed by whs id W with gam rows on the same dates and
  `course_bests[G] = { gross: 74, points: 38 }` renders "74 · 38 pts" on YOUR BEST
  HERE; the rival tile resolves from the rival's rows independently ("71 · 40 pts").
- One side with no matching rows keeps the dash on that side only.

Focused: `npx vitest run src/test/hh3HeadToHead.test.tsx` — 24/24 passed.

## Shards (--maxWorkers=2, each its own command)
- Shard 1: 1,898 passed / 162 files — clean.
- Shard 2: 1,822 passed + 3 failed / 162 files. All three KNOWN, pre-existing:
  - `fw1FeaturedDeck.test.tsx` › FM1 sound group › reserves no right padding on the
    meta line (known FM1_MUTE_1 stop).
  - `proClubhouseSponsor.test.tsx` › sheet PRO label inline-block centring; sheet
    rank row two-column grid (the two known PRO_SPONSOR_EXPORT_FIX stops).
- Shard 3: 1,882 passed / 162 files — clean.
- Shard 4: 1,798 passed / 159 files — clean.

Total: 7,400 passed + 3 known failures = 7,403 tests / 645 files. No new failures;
`tourIsland.test.tsx:235` did not appear.

## Checks
1. Ben vs James, Sundridge Park · East: both tiles now resolve via date/gross match
   to the golf_courses id and show gross · points (verified by the sheet test with
   the same id-mismatch shape; live readback not possible — auth is externally
   managed).
2. A second course resolves independently (per-group, per-side resolution).
3. One side with no stats rows keeps the dash on that side only (tested).
4. Nothing else on the compare sheet changed (only the two tile props' lookup).

No SQL, no migrations, no RPC/edge-function changes, feed_config untouched,
round_pool_cap 30, no native/Median changes. Guest browsing, review wizard, news
and round plots untouched.
