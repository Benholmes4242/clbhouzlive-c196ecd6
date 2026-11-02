# T100 race — complete

## Result (T100.1)
Harness fix only, `src/test/t100Race.test.tsx:35`:
`void i18n.init({ lng: 'en', initAsync: false, resources: … })` → `void i18n.init({ lng: 'en', initAsync: false, interpolation: { escapeValue: false }, resources: … })`. Matches app `src/i18n/index.ts:91`. No expected text, assertion or case changed.

- Focused six files (same command as before): **69/69 passed** (was 64/5 failed on escaped "GB&amp;I").
- `npx tsgo --noEmit`: clean. `npx vite build`: OK (existing chunk-size warning only).
- Full suite, `vitest --shard=n/4 --maxWorkers=2`: 1,409 + 1,378 + 1,438 + 1,477 = **5,702/5,702 across 532 files**, zero failures. No pre-existing failures.
- vs baseline 5,669/530: **+33 tests / +2 files** = +30 `t100Race.test.tsx` (new file), −1 deleted Rounds `The Hundred placeholders > heights`, +4 `tourScorecardCourseDoor.test.tsx` (new file, Tour scorecard course-door follow-up). Relocated `theHundred.test.ts` → `hundredRaceRules.test.ts` is file-neutral (its 9→8 is the deleted placeholder test).

## Changes
- New `src/hooks/top100/useTop100Race.ts`: extracted career row/useCareerBoard, same RPC/cache key/map/limit100. Signed-in only. Pure helpers live in `hundredRaceRules.ts`; ties omit gap clauses per Ben's ruling.
- New `HundredRaceParts.tsx`, `Top100RaceSection.tsx`, `t100Race.css`; neutral global CSS tokens in `src/index.css`. Slab/progress leader/caption,116×80 rail, top-three/pinned viewer, member sheets and independent-chip see-all.
- `Top100CoursesHubPanel.tsx`: race follows raw selected slug and precedes dropdown; non-guest member only, race gate added; remaining argument/list preserved.
- `YourHundredSection.tsx`: head/figure/tier block removed; grid22px rows,14px gap, neutral viewer cells/peek. `YourCoursesDropdown` visibility>=5, resets on list change, counts reviewed cells and preserves grid/legend/peek.
- `top100Shells.tsx`: race slab/rail/three rows only, no unknown dropdown/pinned reservation.
- `ScoresLeaderboardsPage.tsx`: removed §7 read/state/chips/slab/rail/rows/sheets and its hold reservation. Remaining sections preserved; improvement CompactRow remains independent.

## Deleted / moved files and locales
- Deleted `src/features/explore-magazine/TheHundredSection.tsx` and `theHundred.ts`; no active production imports remain.
- Moved `src/features/explore-magazine/__tests__/theHundred.test.ts` → `src/hooks/top100/hundredRaceRules.test.ts` (9→8).
- Removed locale keys `amateur.leaderboards.theHundred` and `amateur.leaderboards.top100Empty` where present in six courses catalogues. Replaced hundredSlab played/behind/clear strings and added playedJoint; absent/nobodyPast preserved semantically. Other Top100 sheet keys retained.

## Test accounting / authorized changes
Last all-green full suite **5,669/5,669 across530**. Candidate inventory was 5,698 across 531 before the course-door follow-up; final full suite 5,702/532 above: +30 new `t100Race.test.tsx`, −1 retired Rounds placeholder test; relocated file has no file-count delta. 
- Relocated `theHundred.test.ts` (9→8): `mid-table: behind the leader by the gap` expected object gained `tie:false` to encode the new server tie flag; clause/count assertions remain.
- Relocated rail case renamed `beyond view, the tile before the target lands at the edge: (index − 1) × 116 − 16` → `(index − 1) × 124 − 16`. Assertions `expect(hundredRailScroll(3,16,430)).toBe(216)` →232; `(37,16,430)).toBe(4160)` →4448. Signed-off116px tiles plus8px gap replace108+8; algorithm unchanged.
- Deleted only `The Hundred placeholders > heights`: `expect(HUNDRED_SLAB_HEIGHT).toBe(88)`, `expect(HUNDRED_STRIP_HEIGHT).toBe(88)`, `expect(HUNDRED_ROWS_HEIGHT).toBe(144)`, `expect(hundredPlaceholderHeight(false)).toBe(288)`, `expect(hundredPlaceholderHeight(true)).toBe(476)`. The Rounds section/reservations are explicitly removed; new race loading shape covered in T100 file.
- `Top100CoursesHubPanel.test.tsx` stays10→10. `five played renders the heading, figure, grid and legend` renamed to closed-dropdown/open-grid case; old `Your hundred`, `A life in golf, one list`, `of100` assertions replaced with Your courses and closed-then-open behavior; cell/legend assertions retained after opening. `the boundary sits at five, not four` and `switching the active scope from nine played to three…` replace `Your hundred` presence with `Your courses` and open the grid where necessary. All other tests/assertions retained.
- `yourHundredPeek.test.tsx`11/11 unchanged; its historical amber wording in case names remains but structural assertions still pass. Existing Rounds files7/7 and3/3 unchanged.

## Counting provenance — report only
The Your courses **played** number is currently the active-list `user_top100_progress_view.courses_played_in_list`, NOT a client count of rounds or ratings. Its recorded current definition (`docs/sql/2026-10-22-top100-progress-view-played.sql`, read only) counts unique list courses with either a non-null rating OR a logged WHS round. Repeated rounds/ratings at one course count once. Grid ownership reads `user_course_activity` via enrichment (documented round OR rating); reviewed caption counts loaded cells in reviewed state, not the separate rated aggregate.

The repository's current view record explicitly states its played definition matches `get_career_leaderboard`. However the deployed career function definition is not available in this checkout; historical May milestone recomputation counts ratings only and cannot establish the current career RPC implementation. Therefore career `top_100_*_distinct` live provenance/equality is **not independently verified**: do not conclude the current RPC is ratings-only from that historical badge routine. The view and activity-cell path can disagree if their sources are incomplete/out of sync; whether the current career RPC disagrees for a particular member cannot be established without Ben's current function definition. No counting change, SQL execution or new backend read performed.

## Limits and protected scope
Signed-in browser proof unavailable (`external_unmanaged`); no screenshot parity claim. No SQL/migrations/migration files/RPC/edge edits, feed_config untouched, round_pool_cap30, no native/Median changes. Frozen chips/shared SectionHead keep existing geometry; mock artwork/names are illustrative, not imported. No release/publish.