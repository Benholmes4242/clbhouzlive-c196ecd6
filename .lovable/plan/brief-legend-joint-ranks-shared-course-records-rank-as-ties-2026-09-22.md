# BRIEF_LEGEND_JOINT_RANKS — shared course records rank as ties

## What changes

Course legend boards stop splitting equal scores. Two players on 86 at Royal Portrush
both read as joint first, and the next distinct score takes third. Nobody is shown a
shared course record as a defeat.

Second, the crown (rank-1) path stops assuming a single top holder: it compares the whole
set of joint leaders before and after. A member who keeps a share of a record is told
nothing at all — neither earned nor lost.

## Technical detail

New module `supabase/functions/gam-evaluator/legendRanks.ts`:

- `assignCompetitionRanks(rows)` — standard competition ranking ("1224") over the
  already-sorted array. Equality is tested on `Number(value).toFixed(6)`, the same
  precision `legendBoardSignature` already normalises to; never `===`. Sort order is
  untouched — only the emitted rank numbers.
- `crownSetDelta(prevRows, nextRows)` — returns `{ earned, lost, retained }` from the
  sets of rank-1 `user_id`s.

`index.ts` / `recomputeLegend`:

- Both current `rank: i + 1` sites (the `nextSig` signature and the board insert) read
  ranks from one `assignCompetitionRanks(arr)` call, so the signature and the stored
  board can never disagree.
- The crown path replaces `prevTopUser` / `newTopUser` single-element comparison with
  `crownSetDelta` over the previous stored rows (which already carry `rank`) and the newly
  ranked array:
  - entering the set → `legend_earned` (subject to the existing notify gates)
  - leaving the set → `legend_lost`, plus taker-name lookup as today, where the taker is
    a newly entering holder
  - in both sets → no notification
  - `recomputeLegendTitles` runs for every user entering **or** leaving, not just two.
- Write-skip, sort order, category configs, 18-hole filter, women's scoping, the 90-day
  suppression and the play_date freshness gate are untouched.

## Historical rewrite silence (item 3)

The gate that covers it is `isTriggerFreshForCrownNotice` —
`LEGEND_NOTIFY_MAX_AGE_DAYS = 2` tested on the triggering round's `play_date`, computed
before any enqueue and applied to both sides. A backfill recompute of a 2018 round is
suppressed by age; a missing or unparseable `play_date` is also suppressed. Combined with
the all-time-only rule, no notification can arise from the requeue. This will be restated
with line references in the report; no new suppression is added.

## Proof

Deno tests in `legendRanks_test.ts`: `[70,70,73]` → 1,1,3; `[70,73,73,75]` → 1,2,2,4;
sixth-decimal noise ties; joiner earns while existing holder keeps silence; a dropped
holder still loses; unchanged board still skips the write (signature equality).
`deno check` on the evaluator, plus the app suite at its current baseline.

## Report, not run (item 4)

A read-only select counting `(course_id, category)` boards with at least one tie today and
how many rows would change rank. No update, no requeue.
