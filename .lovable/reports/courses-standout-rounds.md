# COURSES PAGE: STANDOUT ROUNDS REPLACES THE REGULARS — build report

Status: **STOPPED in shard 1** on an unlisted failure in an untouched file. Shards 2–4 not run.

## Stop
- File: `src/test/ms1MessagesHeadToHead.test.tsx:405:3`
- Case: `ThreadV2Page header > names the member at 17px with "{count} rounds together · last {d MMM}" under it`
- Error: `Error: Test timed out in 15000ms.`
- Shard 1: 1 failed | 2,265 passed (2,266); duration 327.10s. Full log `/tmp/standout-shard-1.log`.
- Isolated rerun: 28/28 passed (`/tmp/ms1-isolated.log`). Not touched by this build (messaging thread page).

## Files changed
- New: `src/components/courses/browse/useCoursesStandoutRounds.ts`, `standoutRoundsRules.ts`, `StandoutRoundsSection.tsx`, `standout-rounds.css`; `src/test/standoutRounds.test.tsx`.
- `src/features/explore-magazine/watch/RoundCard.tsx`: optional `header`, `line`, `points` props (backward compatible).
- `src/components/courses/browse/sectionShells.tsx`: `StandoutRoundsShell` added; `PhotoRailShell` deleted.
- `src/components/courses/browse/PhotoFigureCard.tsx`: component, `PHOTO_FIGURE_W/H`, `MOST_PLAYED_COUNT` deleted; `PHOTO_FIGURE_GAP` kept.
- Deleted `src/components/courses/browse/MostPlayedSection.tsx`.
- `src/components/courses/CoursesBrowsePage.tsx`: gate id `standoutRounds`; guest fallback `LatestHolesShell`.
- `src/locales/en/courses.json`, `src/locales/en-XA/courses.json`: `browse.standout.*`.

## Tests
Deleted (ruled in advance):
- `coursesRegularsFive.test.tsx` (3 cases, whole file — feature retired).
- `coursesHighestRatedTileScores.test.tsx` case "e) the regulars rail headline figure stays white" — `expect(colorOf('42')).toBe(WHITE)`; only case, file deleted.
- `coursesPageV5Sections.test.tsx` describe "V5 §3 The regulars pill" (2 cases: `toBe('17,316 holes played · Plays to +12.1')`, `toBe('72 holes played')`) and the MostPlayedSection import.
- `coursesPhotoTopScrims.test.tsx`: 'PhotoFigureCard' removed from the it.each list (1 case), with its import and mount line.
Changed (ruled): `coursesWholePageHold` and `coursesBrowseHighestRatedRemoval` mock StandoutRoundsSection, ids renamed; WholePageHold's sectionShells mock `PhotoRailShell` → `LatestHolesShell` (testid `latest-holes-shell`) and the guest case title now says "Latest holes shell". `latestCoursesSection` GATE_IDS/order assertions use standoutRounds.
Added: `standoutRounds.test.tsx`, 36 cases (a–g).
Expected total: 9,264 − 7 + 36 = 9,293. Focused 7 files 91/91; typecheck clean.

## Deviations / notes
- Secondary short form for an albatross after an ace is "an albatross"/"N albatrosses" — the brief lists no albatross short form.
- Albatross ", a par N" is dropped when feat_par is null or the hole list is empty (mirrors the ace yards rule).
- 390/320 signed-in check not done: the section needs a signed-in member with qualifying rounds.
