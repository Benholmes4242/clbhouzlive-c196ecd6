# Clubhouse Tour slot — two follow-ups (record figures, rotation)

Date: 2026-11-13. Build: OK (build-errors.log, 18:24:28Z).

## What changed

**1. Record figures now match the Tour picks block.**
`src/features/clubhouse-tour/tourSlotRules.ts` — `recordLine` reads `record.won`,
`record.top10` and `record.event_count` only, the same three fields
`PicksBlock.tsx:210-211` reads. `record.best` (the single best event) is no
longer consulted. With `event_count == null` the clause is omitted:
`"Our record on the PGA Tour: 1 win, 9 top 10s."` — no invented denominator.
With a count: `"Our record on the PGA Tour: 5 wins, 21 top 10s from 11 events."`

**2. Rotation advances when the slot is still below the fold.**
`src/features/clubhouse-tour/useTourSlotData.ts` — the visit cursor now advances
on first mount (unchanged), on each return to an active Clubhouse (KeepAlive
keeps `/` mounted, so a tab switch is a reactivation, not a remount), and on
pull-to-refresh. `src/pages/Clubhouse.tsx` calls `tourSlotVisit.refresh?.()`
from the existing `CardFeed onRefresh` closure. `src/features/clubhouse-tour/TourSlot.tsx`
registers the rendered slot root on the visit so the guard can measure it.

The guard (`slotBelowViewport`): a slot that has not rendered yet, or is hidden
inside an inactive keep-alive portal (no client rects), is safe to re-pick
against; otherwise only a top edge below the viewport bottom is. Once the member
has scrolled past it, the tournament stays put. Advancing clears the current
selection and bumps a tick, so the next eligible event is read on the next
render instead of the old card sitting there. `advanceTourSlotCursor` keeps its
try/catch — a failed storage read or write still leaves the cursor at index 0.

## Tests — 8,534 passed, 0 failed

Baseline 8,527. Delta +7, reconciled: +1 from splitting the record test in two,
+6 from the new rotation file.

Shards, each its own command: 1/4 = 2,168 · 2/4 = 2,020 · 3/4 = 2,173 · 4/4 = 2,173.

Changed in `src/test/tourSlot.test.tsx` (33 tests, was 32):
- Renamed and re-pointed: was `reads the same best-pick record figures as the
  Tour picks block`, asserting
  `.toBe('Our record on the PGA Tour: 1 win, 9 top 10s from 13 events.')` from a
  payload whose `best` said 1/9/13 while `won/top10` said 5/21. Now
  `reads the same record figures as the Tour picks block`, asserting
  `.toBe('Our record on the PGA Tour: 5 wins, 21 top 10s from 11 events.')`
  against `won:5, top10:21, event_count:11` with the contradictory `best` left in.
- New: `omits the events clause when the record has no event count`, asserting
  `.toBe('Our record on the PGA Tour: 1 win, 9 top 10s.')` with
  `event_count:null` and a contradictory `best`.

New `src/test/tourSlotVisit.test.tsx` (6 tests), real `KeepAliveOutlet` provider
plus the real data hook over a pre-filled cache (PGA Preview, LPGA Live):
- `advances on reactivation when the slot is below the viewport`
- `does not advance on reactivation when the slot has been scrolled past`
- `advances on pull-to-refresh`
- `does not advance on pull-to-refresh when the slot has been scrolled past`
- `does not change the tournament while the page stays active`
- `wraps at the end of the list`

No assertion was weakened: both record cases keep a `best` value that
contradicts the canonical figures, so a fallback to `best` fails.

## Diff

Auto-saved by the platform as checkpoint commit `c376db2cee`
(6 files, 195 insertions, 10 deletions):
`TourSlot.tsx` 2 · `tourSlotRules.ts` 10 · `useTourSlotData.ts` 48 ·
`Clubhouse.tsx` 3 · `tourSlot.test.tsx` 3 · `tourSlotVisit.test.tsx` 139 (new).

## Not verified

The 390/320 renders of all three states and a real pull-to-refresh gesture on a
device — the fold guard is exercised against a stubbed element, not a scrolled
page. Ben's local render is the check.
