# BRIEF_CONTESTED_TITLES — a title must be won against a field

## What changes

A course legend title only counts when someone else is on the board. Rank 1 on a
board with a single claimant is worth nothing; a joint first on a board of three
is worth a title. The `legend_at_course` badge is recalibrated so it distinguishes
members again.

Server-side only. No UI, no SQL run, no requeue.

## Technical detail

New module `supabase/functions/gam-evaluator/legendTitles.ts`:

- `contestedBoardKeys(rows)` — pure: given `{ course_id, category }` claimant rows
  for the boards in question, returns the set of `course_id|category` keys with
  more than one current claimant. `> 1` exactly; no larger floor.
- `countContestedTitles(userRankOneBoards, claimantRows)` — pure: the single
  number both the milestone and the tier read.

`recomputeLegendTitles(userId)` in `index.ts`:

1. Read the user's rank-1 current rows (`course_id, category`) instead of a bare
   `head: true` count.
2. Read all current claimants for exactly those boards (`in` on course_id, filtered
   per board in memory — PostgREST has no correlated subquery).
3. `const count = countContestedTitles(...)` — computed **once**. The
   `gam_user_milestones` upsert and `computeTier(count, tiers)` both read that same
   binding, so they cannot disagree.
4. `count === 0` keeps today's behaviour: the badge row is deleted and the card
   falls back to locked. A member whose only title was uncontested lands here.

Joint firsts count: they are rank-1 rows and their board has more than one
claimant by definition.

## Silence (item 3)

`REBUILD_SUPPRESS` (index.ts:21) is the mechanism, and it does cover this:
`enqueueNotification` returns immediately while it is true (index.ts:3131), and
`upsertBadgeTiered`'s only notification path is `enqueueNotification("badge_earned")`
(index.ts:1765). Tier *drops* are silent already — `isNewTier` is
`(existing.counter_tier ?? 0) < tier`, so a downgrade writes the row and notifies
nothing.

What is missing is a way for Ben to run the recompute under that flag. This brief
adds one action, and nothing else:

- `POST { action: "recompute_legend_titles", apply?: true }` — sets
  `REBUILD_SUPPRESS = true` for the duration in a `try/finally`, walks every member
  holding a current rank-1 row, and returns a per-member
  `{ user_id, before: { count, tier }, after: { count, tier } }` report. Dry run
  unless `apply === true`; the dry run writes nothing at all.

So the backfill is silent by construction, not by luck.

## Tier recalibration (item 2) — SQL, not run

```sql
-- Calibrated against the 22-member distribution of CONTESTED titles on
-- 2026-09-22 (~3 members at tier 3, ~10 at tier 2, rest at tier 1).
-- These are CALIBRATION, not fundamentals: revisit as membership grows.
UPDATE public.gam_badge_catalogue
   SET counter_tiers = '[1,15,60]'::jsonb
 WHERE id = 'legend_at_course';
```

## Proof

Deno tests in `legendTitles_test.ts`: single-claimant board yields no title; joint
first on a board of three yields one; a member's count and tier read one binding;
mixed boards count only the contested ones.

Read-only SQL survey for item 4: before/after count and tier for all 22 members,
and the ordering by contested titles checked against the measured
389/61, 192/117, 1/0 figures.

`deno check` on the evaluator plus the app suite at its current baseline (704
passed, the same 4 pre-existing failures).
