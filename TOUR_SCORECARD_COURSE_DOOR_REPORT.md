# FOLLOW-UP — TOUR SCORECARD TILE: course door, right edge

## Changes

### 1. Course door — `src/features/tourhub/leaderboard/ScorecardSheet.tsx`
- Replaced `onViewCourse={undefined}` with a handler built from the tournament
  metadata: when `meta.data?.golf_course_id` is set, `() => { onClose(); navigate(`/courses/${golfCourseId}`); }`;
  otherwise `undefined`. The shared identity row then renders Course first,
  Profile second, both the same `SheetDoorButton` the member head uses. No new
  component.

### 2. Right edge — `src/features/courses/_shared/scorecard/scorecardParts.tsx`
- **No edit was needed.** The tour identity row already carries exactly the
  member-row values the brief specifies: the name span
  `flex: '1 1 auto', minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden',
  textOverflow: 'ellipsis'` (line 454) and the doors wrapper
  `display: 'flex', gap: 6, flex: 'none', marginLeft: 10` (line 465). The doors
  are the row's last children, so they sit flush right and never wrap or
  shrink; a long name truncates. Ben's device observation matches an older
  build — the shipped source already has the fix, asserted by the new tests.

### 3. Unlinked tournament
- Profile alone, still at the right edge (doors wrapper renders whenever
  either handler exists).

## Tests
`src/test/tourScorecardProfileDoor.test.tsx` — 5 → 7 tests; **no existing
assertion changed** (additions only):
- NEW "the doors are the last children of the identity row and the name takes
  the remaining width": `row.lastElementChild` is the doors span; the name span
  has `flex: '1 1 auto'`, `min-width: 0`, ellipsis.
- NEW "a long name truncates without moving or wrapping the doors": with a
  160-char name the doors are still last; name span keeps
  `overflow: hidden`, `white-space: nowrap`, ellipsis; doors keep `flex: none`
  (jsdom normalises to `0 0 auto`) and `margin-left: 10px`.

`src/test/tourScorecardCourseDoor.test.tsx` — NEW file, 2 tests (real
`ScorecardSheet` wrapper; `useTournamentMeta`/`useCardOpenGate`/`useNavigate`
mocked, supabase client stubbed, i18n courses+tourhub):
- NEW "renders the course door when the tournament is linked and navigates to
  the course": `data-sheet-door="course"` present, click calls `navigate('/courses/course-1')`
  and `onClose` once.
- NEW "shows Profile alone when the tournament has no linked course": no
  course door, profile door present.

## Results
- Both files: 9/9 passed. Preview build OK.
- Full suite in shards (4): **5,697 passed / 5,702 across 532 files**.
  - Exactly 5 failures, all pre-existing from the in-progress T100 phase
    (`src/test/t100Race.test.tsx`, "T100 slab and progress" — the component
    renders the HTML-escaped "GB&I" instead of "GB&I" in the slab
    sentence; behind / leading / no gap / tie / absent). Documented in
    T100_RACE_STOP_REPORT.md; untouched here.
- Totals vs the 5,669/530 baseline: +33 tests / +2 files. This follow-up
  accounts for +4 tests / +1 file (2 new wrapper tests + 2 new right-edge
  tests + new file); the remaining +29 tests / +1 file are the T100 phase's
  own additions (t100Race.test.tsx), reported there.

## Unchanged
Member surface, the foot removal from the previous change, and the rest of the
tour tile. No SQL, no migrations, no RPC/edge edits, feed_config untouched,
round_pool_cap stays at 30, no native/Median changes.

---

# FOLLOW-UP — full-width tour player row (doors flush right)

## Problem
The right-edge flex values were correct but the tour identity row lived INSIDE
the head's left column (`scorecardParts.tsx`, `showIdentity && isTour` block),
so it ended where the score column began and the doors sat mid-tile. The member
row renders after the head's left/score flex at full width.

## Diff
`src/features/courses/_shared/scorecard/scorecardParts.tsx` — the only file
changed:
- Removed the `showIdentity && isTour` block from the head's left column.
- Re-rendered it AFTER the head flex, as a full-width sibling with the member
  row's container: `data-scorecard-player-row`, `display: flex`,
  `alignItems: center`, `marginTop: 10`, `minWidth: 0`. Headshot stays 22px
  (tour `srcCandidates` avatar), name 12.5/700 `flex: 1 1 auto` with ellipsis,
  HandicapChip where it applies, doors wrapper unchanged (`flex: none`,
  `marginLeft: 10`, `gap: 6`, Course then Profile). The doors' right edge now
  lines up with the score's right edge above.
- UNCHANGED: tour head kicker/event/venue/score, the position row and below,
  and the member surface (`!isTour` row untouched).

## Tests — `src/test/tourScorecardProfileDoor.test.tsx` (7 → 8)
CHANGED assertion (old nesting asserted the tour surface had no full-width
player row):
- OLD: `expect(document.querySelector('[data-scorecard-player-row]')).toBeNull();`
- NEW: `expect(document.querySelector('[data-scorecard-player-row]')).not.toBeNull();`
  (comment updated: the tour identity row now renders at full tile width after
  the head's left/score flex, carrying the same marker as the member row.)
NEW test "the identity row is a sibling after the head left/score flex, not
inside the left column": the row's previous sibling is the head flex
(`display: flex`, `gap: 14px`); the left column (`flex: 1 1 auto`) does not
contain the row.
The two earlier right-edge tests (doors last children; long-name truncation)
pass unchanged against the new placement.

## Results
- Focused (5 scorecard files): 36/36 passed.
- `npx tsgo --noEmit`: clean.
- Full suite in shards (4): 1,410 + 1,378 + 1,438 + 1,477 =
  **5,703 passed / 5,703 across 532 files**, zero failures. The five
  pre-existing T100 `GB&I` slab failures were resolved by T100.1 before this
  follow-up, so none remain. Totals vs the 5,702/532 baseline: +1 test / +0
  files (the new sibling-placement test).

## Unchanged
No SQL, no migrations, no RPC/edge edits, feed_config untouched,
round_pool_cap stays at 30, no native/Median changes.
